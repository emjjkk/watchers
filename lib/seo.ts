import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://weflixd.live';
export const SITE_NAME = 'Weflixd';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
export const DEFAULT_DESCRIPTION =
  'Discover movies, TV shows, and people. Build your watchlist, track what you watch, rate titles, and share your taste with the Weflixd community.';

interface SEOInput {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
}

export function createMetadata({ title, description, path, image, type = 'website' }: SEOInput): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const ogImage = image || DEFAULT_OG_IMAGE;
  const images = [{ url: ogImage, alt: title }];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export function truncateDescription(value: string | undefined, fallback = DEFAULT_DESCRIPTION): string {
  const text = value?.replace(/\s+/g, ' ').trim() || fallback;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}