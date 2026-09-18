import React from 'react';
import { notFound } from 'next/navigation';
import PersonDetailView from '@/components/PersonDetailView';
import { getPersonDetails } from '@/lib/tmdb';
import { createMetadata, truncateDescription } from '@/lib/seo';
import type { Metadata } from 'next';

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { id } = await params;
  const person = /^\d+$/.test(id) ? await getPersonDetails(Number(id)) : null;
  if (!person) return { title: 'People | Weflixd' };
  return createMetadata({
    title: `${person.name} - ${person.known_for_department}`,
    description: truncateDescription(person.biography, `Discover ${person.name}'s filmography, career, and most notable movies and TV shows on Weflixd.`),
    path: `/people/${person.id}`,
    image: person.profile_path,
    type: 'article',
  });
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  const person = await getPersonDetails(numId);
  if (!person) notFound();

  return <PersonDetailView person={person} />;
}
