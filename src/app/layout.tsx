import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'optional',
  weight: ['400', '500', '600', '700', '900'],
});

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
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Fix #2 : applique le thème avant le premier rendu pour éviter le flash (CLS) */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('technews-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){}` }} />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}