let redisClient: any = null;
let isRedisInitAttempted = false;
const inMemoryCache = new Map<string, { data: string; expiry: number }>();

// Simple in-memory rate limiter bucket (max 35 req per 10 seconds)
const rateLimitBuckets = new Map<string, { tokens: number; lastRefill: number }>();
const MAX_TOKENS = 35;
const REFILL_INTERVAL_MS = 10000;

async function getRedis(): Promise<any> {
  if (typeof window !== 'undefined') return null; // Client side
  if (isRedisInitAttempted) return redisClient;

  isRedisInitAttempted = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(url, {
      maxRetriesPerRequest: 0,
      connectTimeout: 1000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    client.on('error', () => {
      redisClient = null;
    });
    await client.connect();
    redisClient = client;
  } catch (err: any) {
    // Graceful fallback to in-memory cache without console spam
    redisClient = null;
  }
  return redisClient;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = inMemoryCache.get(key);
  if (cached) {
    if (Date.now() < cached.expiry) {
      try {
        return JSON.parse(cached.data) as T;
      } catch {
        return null;
      }
    } else {
      inMemoryCache.delete(key);
    }
  }

  const redis = await getRedis();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        const data = JSON.parse(raw) as T;
        inMemoryCache.set(key, {
          data: JSON.stringify(data),
          expiry: Date.now() + 3600 * 1000,
        });
        return data;
      }
    } catch {
      // Fall through to a cache miss.
    }
  }

  return null;
}

export async function setCached<T>(key: string, data: T, ttlSeconds: number = 3600): Promise<void> {
  const payload = JSON.stringify(data);

  inMemoryCache.set(key, {
    data: payload,
    expiry: Date.now() + ttlSeconds * 1000,
  });

  const redis = await getRedis();
  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, payload);
      return;
    } catch {
      // Fall through to in-memory
    }
  }

  // Keep memory cache under 500 items
  if (inMemoryCache.size > 500) {
    const firstKey = inMemoryCache.keys().next().value;
    if (firstKey) inMemoryCache.delete(firstKey);
  }
}


export function checkRateLimit(identifier: string = 'tmdb_global'): boolean {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(identifier);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    rateLimitBuckets.set(identifier, bucket);
  }

  // Refill tokens proportionally
  const elapsed = now - bucket.lastRefill;
  if (elapsed > REFILL_INTERVAL_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  } else {
    const refillAmount = Math.floor((elapsed / REFILL_INTERVAL_MS) * MAX_TOKENS);
    if (refillAmount > 0) {
      bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refillAmount);
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true; // Allowed
  }

  return false; // Rate limited
}
