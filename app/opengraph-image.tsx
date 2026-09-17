import { ImageResponse } from 'next/og';

export const alt = 'Weflixd - Movies, TV shows, reviews, and watchlists';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#18181b',
          color: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          padding: '80px',
          width: '100%',
        }}
      >
        <div style={{ color: '#facc15', fontSize: 32, fontWeight: 700, letterSpacing: 8 }}>WEFLIXD</div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 28 }}>Your cinema diary.</div>
        <div style={{ color: '#a1a1aa', fontSize: 28, marginTop: 22 }}>Discover. Rate. Remember.</div>
      </div>
    ),
    { ...size }
  );
}