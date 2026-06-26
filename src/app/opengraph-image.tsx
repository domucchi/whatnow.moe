import { ImageResponse } from 'next/og';

export const alt = 'whatnow.moe — find anime you and your friends all want to watch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '96px',
        backgroundColor: '#151311',
        backgroundImage:
          'radial-gradient(900px circle at 85% 15%, rgba(255, 106, 77, 0.18), transparent 60%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div
          style={{
            width: '24px',
            height: '120px',
            borderRadius: '12px',
            backgroundColor: '#ff6a4d',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: '112px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#f4ede0',
          }}
        >
          whatnow.moe
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: '40px',
          marginLeft: '52px',
          fontSize: '46px',
          fontWeight: 500,
          color: '#aaa39a',
        }}
      >
        find anime you and your friends all want to watch
      </div>
    </div>,
    { ...size },
  );
}
