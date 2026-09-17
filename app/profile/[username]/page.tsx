import React from 'react';
import UserProfileView from '@/components/UserProfileView';
import { fetchUserProfileDB } from '@/lib/supabase';
import { createMetadata, truncateDescription } from '@/lib/seo';
import type { Metadata } from 'next';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchUserProfileDB(username);
  const displayName = profile?.display_name || profile?.username || username;
  return createMetadata({
    title: `${displayName}'s Profile`,
    description: truncateDescription(profile?.bio, `View ${displayName}'s movie favorites, watchlist, watched diary, and reviews on Weflixd.`),
    path: `/profile/${encodeURIComponent(username)}`,
    image: profile?.avatar_url,
  });
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  return <UserProfileView username={username} />;
}
