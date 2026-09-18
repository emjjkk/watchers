import React from 'react';
import { notFound } from 'next/navigation';
import MediaDetailView from '@/components/MediaDetailView';
import MediaDetailRecovery from '@/components/MediaDetailRecovery';
import { getMediaDetails } from '@/lib/tmdb';
import { createMetadata, truncateDescription } from '@/lib/seo';
import type { Metadata } from 'next';

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const media = /^\d+$/.test(id) ? await getMediaDetails(Number(id), 'movie') : null;
  if (!media) return { title: 'Movie | Weflixd' };
  return createMetadata({
    title: `${media.title} (${(media.release_date || '').slice(0, 4) || 'Movie'})`,
    description: truncateDescription(media.overview, `Explore ${media.title}, read reviews, see where to watch it, and add it to your Weflixd watchlist.`),
    path: `/movie/${media.id}`,
    image: media.backdrop_path || media.poster_path,
    type: 'article',
  });
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const media = await getMediaDetails(numId, 'movie');
  if (!media) return <MediaDetailRecovery mediaType="movie" mediaId={numId} />;

  return <MediaDetailView media={media} />;
}
