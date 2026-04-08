import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GH Command Center v2',
  description: 'GenerationHealth.me — SEO, AEO, GEO Operations Dashboard',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="text-gh-text-body">
        {children}
      </body>
    </html>
  );
}
