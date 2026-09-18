import React from 'react';
import { notFound } from 'next/navigation';
import MediaDetailView from '@/components/MediaDetailView';
import { getMediaDetails } from '@/lib/tmdb';
import { createMetadata, truncateDescription } from '@/lib/seo';
import type { Metadata } from 'next';

interface TVPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  const { id } = await params;
  const media = /^\d+$/.test(id) ? await getMediaDetails(Number(id), 'tv') : null;
  if (!media) return { title: 'TV Show | Weflixd' };
  return createMetadata({
    title: `${media.title} (${(media.first_air_date || '').slice(0, 4) || 'TV Show'})`,
    description: truncateDescription(media.overview, `Explore ${media.title}, read reviews, see where to watch it, and add it to your Weflixd watchlist.`),
    path: `/tv/${media.id}`,
    image: media.backdrop_path || media.poster_path,
    type: 'article',
  });
}

export default async function TVDetailPage({ params }: TVPageProps) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const media = await getMediaDetails(numId, 'tv');
  if (!media) notFound();

  return <MediaDetailView media={media} />;
}
