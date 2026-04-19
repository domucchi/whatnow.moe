import type { Metadata } from 'next';
import { Geist_Mono, M_PLUS_Rounded_1c, Zen_Kaku_Gothic_New } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: '--font-display',
  weight: ['400', '500', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: '--font-ui',
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'whatnow.moe — find anime you all want to watch',
    template: '%s · whatnow.moe',
  },
  description: 'Match AniList planning lists across friends and find what to watch tonight.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${mPlusRounded.variable} ${zenKaku.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
