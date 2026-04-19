import type { MetadataRoute } from 'next';

// Theme + background colors mirror `--color-primary` and `--bg-0` in
// `globals.css`. Keep them hard-coded here (manifest must be JSON-serializable
// so we can't read the CSS vars at build time).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'whatnow.moe',
    short_name: 'whatnow.moe',
    description: 'Find anime you and your friends all want to watch.',
    start_url: '/',
    display: 'standalone',
    background_color: '#151311',
    theme_color: '#ff6a4d',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
