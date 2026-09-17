import { NextRequest, NextResponse } from 'next/server';
import { getMediaRecommendations } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const type = params.get('type');
  const id = params.get('id');

  if ((type !== 'movie' && type !== 'tv') || !id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid media identifier' }, { status: 400 });
  }

  try {
    return NextResponse.json({ results: await getMediaRecommendations(id, type) });
  } catch (err: any) {
    console.error('[API tmdb/recommendations error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch recommendations' }, { status: 500 });
  }
}