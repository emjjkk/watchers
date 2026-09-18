# Weflixd

Weflixd is a movie and TV show discovery platform with social features. It combines live data from The Movie Database (TMDB) with a Supabase-backed social layer, letting users browse and search titles, build a watchlist, log what they have watched with ratings and reviews, follow other members, and get personalized recommendations.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Architecture Notes](#architecture-notes)
- [Third-Party Services and Attribution](#third-party-services-and-attribution)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

**Discovery**
- Trending, popular, and newly released movies and TV shows sourced live from TMDB
- Browse by genre, country of origin, and sort order (popularity, rating, release date, review count)
- Full-text search across movies, TV shows, people, member profiles, and community reviews
- Detail pages with cast, trailers, watch providers (streaming, rent, buy), and recommendations
- People/cast catalog with filmographies and biography pages

**Social and personalization**
- Email/password and Discord authentication via Supabase Auth
- Personal watchlist, favorites (movies, TV shows, and people), and a watched diary with 0.5-5 star ratings
- Written reviews with community upvote/downvote scoring
- Follow/unfollow other members, with a following activity feed and notifications
- Personalized "Recommended for you" shelf derived from a user's favorites, watched history, and watchlist, blended with TMDB's recommendation API
- Public member profiles with banner image, bio, favorites, watchlist, watched log, and reviews
- Profile picture and banner uploads via ImgBB

**Platform**
- Dark/light theme with system preference detection
- Responsive layouts for desktop, tablet, and mobile
- SEO metadata, Open Graph images, sitemap, and robots.txt generation
- Redis-backed caching and simple in-process rate limiting for TMDB requests, with in-memory fallback when Redis is unavailable

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Motion (Framer Motion)
- **Icons:** Lucide React
- **Auth & Database:** Supabase (Postgres, Auth, Realtime, Row Level Security)
- **External data:** TMDB API (movies, TV, people, watch providers), JustWatch (via TMDB watch provider data)
- **Image hosting:** ImgBB API
- **Caching:** ioredis (Redis), with an in-memory fallback cache and rate limiter
- **Forms/validation:** React Hook Form, Hookform Resolvers

## Project Structure

```
app/                     Next.js App Router pages and API routes
  api/tmdb/               Server-side TMDB proxy endpoints (discover, search, details, people, recommendations)
  api/upload/              ImgBB image upload endpoint
  movie/, tv/, people/     Catalog and detail pages
  profile/, settings/      User profile and account settings
  login/, signup/          Authentication pages
  notifications/           Following activity feed
components/              Reusable UI components (cards, modals, shelves, navbar, footer, etc.)
context/                 React context providers (Auth, Media, Modal, Theme)
hooks/                   Custom React hooks
lib/                     Core logic: TMDB client, Supabase client, caching, SEO, types, utilities
supabase/                Database schema and Supabase CLI metadata
public/                  Static assets
```

Key files:

- `lib/tmdb.ts` - TMDB API client, response formatting, and derived color palettes per title
- `lib/supabase.ts` - All Supabase data-access functions (profiles, watchlist, favorites, watched log, reviews, follows)
- `lib/redis-cache.ts` - Caching and rate-limiting layer used by the TMDB client
- `context/AuthContext.tsx` - Session handling and profile synchronization
- `context/MediaContext.tsx` - Watchlist, favorites, watched log, and review state
- `supabase/schema.sql` - Full database schema, indexes, RLS policies, and triggers

## Prerequisites

- Node.js 18 or later
- npm (or a compatible package manager)
- A Supabase project (free tier is sufficient to start)
- A TMDB API key or read access token
- An ImgBB API key (for avatar/banner uploads)
- Optional: a Redis instance (e.g. Upstash) for production-grade caching; the app falls back to an in-memory cache if none is configured

## Getting Started

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root and fill in the variables described in [Environment Variables](#environment-variables).

3. Set up the database by running `supabase/schema.sql` against your Supabase project (see [Database Setup](#database-setup)).

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following keys:

```bash
# TMDB
TMDB_API_KEY=your_tmdb_api_key_or_bearer_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ImgBB (profile/banner image uploads)
IMGBB_API_KEY=your_imgbb_api_key

# Optional: Redis cache (falls back to in-memory cache if unset)
REDIS_URL=redis://user:password@host:port

# Optional: canonical site URL used for metadata, sitemap, and Open Graph tags
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Notes:

- `TMDB_API_KEY` accepts either a classic v3 API key or a v4 read access token (Bearer). The client detects which format was provided.
- If `NEXT_PUBLIC_SITE_URL` is not set, it defaults to `https://weflixd.live`.
- Without Supabase credentials, authentication and all social features (watchlist, favorites, reviews, follows) will be disabled; TMDB browsing and search will still work.

## Database Setup

The full schema lives in `supabase/schema.sql` and includes:

- `profiles` - public user profile data, auto-created on signup via a trigger
- `watched` - the per-user watched diary with ratings, reviews, and dates
- `watchlist` - saved-for-later titles
- `favorites` - favorited movies, TV shows, and people
- `follows` - follower/following relationships
- `reviews` - community reviews tied to a title
- `review_votes` - per-user upvote/downvote records, with a trigger that keeps review vote counts in sync

To apply it:

1. Open the SQL editor in your Supabase project dashboard.
2. Paste the contents of `supabase/schema.sql` and run it.
3. Confirm Row Level Security is enabled on all tables (the script enables it and defines policies automatically).
4. If you want live updates for reviews (used by the app's realtime subscription), make sure the tables are added to the `supabase_realtime` publication; the script attempts this automatically where supported.

Discord OAuth (optional) is configured from the Supabase Auth settings in your project dashboard, not from this codebase.

## Available Scripts

```bash
npm run dev     # Start the development server
npm run build   # Build for production
npm run start   # Start the production server (after build)
npm run lint    # Run ESLint
npm run clean   # Clean the Next.js build cache
```

## Architecture Notes

- **Server-side TMDB proxy:** All TMDB requests go through `app/api/tmdb/*` routes rather than being called directly from the client, keeping the API key server-side and allowing response caching.
- **Caching and rate limiting:** `lib/redis-cache.ts` caches TMDB responses (default 1 hour TTL) and enforces a simple token-bucket rate limit to avoid exceeding TMDB's request limits. It transparently falls back to an in-memory `Map` if Redis is not configured or unreachable.
- **Auth and profile sync:** `AuthContext` listens to Supabase auth state changes, loads or creates a matching row in `profiles`, and keeps Supabase Auth user metadata in sync with the profile table so the two never drift apart.
- **Client-side state:** `MediaContext` holds the current user's watchlist, favorites, watched log, and reviews, reading from and writing to Supabase, with a Supabase Realtime subscription keeping the community reviews feed live.
- **Image hosting:** Profile pictures and banners are uploaded through `app/api/upload/route.ts`, which proxies to the ImgBB API using a server-side key.
- **SEO:** `lib/seo.ts` centralizes metadata generation (title, description, Open Graph, Twitter cards) used across movie, TV, people, and profile pages, plus dynamic sitemap and robots.txt generation.

## Third-Party Services and Attribution

- **The Movie Database (TMDB):** This product uses the TMDB API but is not endorsed or certified by TMDB.
- **JustWatch:** Streaming, rental, and purchase availability data is sourced via TMDB's watch provider integration, which is powered by JustWatch.
- **ImgBB:** Used for hosting user-uploaded profile and banner images.
- **Supabase:** Used for authentication, the Postgres database, and realtime subscriptions.

## Deployment

The app is built with `output: 'standalone'` in `next.config.ts`, making it straightforward to deploy to any Node-compatible host (Vercel, a container platform, etc.). Ensure all required environment variables are set in your hosting provider's configuration, and that your Supabase project's allowed redirect URLs include your production domain if using OAuth (Discord).

## Contributing

Issues and pull requests are welcome. Before submitting a change:

1. Run `npm run lint` and resolve any issues.
2. Keep new UI consistent with the existing Tailwind-based design system (light/dark mode support, existing spacing and typography conventions).
3. If a change touches the database, update `supabase/schema.sql` accordingly.