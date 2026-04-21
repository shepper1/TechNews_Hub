import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'TechNews Hub — L\'actualité tech en temps réel',
  description: 'Centralisez toutes les actualités tech : DevOps, IA, Infrastructure, Windows et Linux. Agrégation multi-sources en temps réel.',
  keywords: ['tech news', 'devops', 'IA', 'artificial intelligence', 'linux', 'windows', 'infrastructure', 'cloud', 'kubernetes', 'docker'],
  authors: [{ name: 'TechNews Hub' }],
  openGraph: {
    title: 'TechNews Hub',
    description: 'L\'actualité tech en temps réel',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}