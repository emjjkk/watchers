import { NextRequest, NextResponse } from 'next/server';
import { getPopularPeople, searchPeople } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(new URL(req.url).searchParams.get('page') || '1'));
  const query = new URL(req.url).searchParams.get('query')?.trim() || '';

  try {
    return NextResponse.json(query ? await searchPeople(query, page) : await getPopularPeople(page));
  } catch (err: any) {
    console.error('[API tmdb/people error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch people' }, { status: 500 });
  }
}