'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Zap, Heart, Flame } from 'lucide-react';

export default function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('technews-theme');
    setTheme(saved === 'light' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('technews-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-inner">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              TechNews
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white leading-none">
              HUB
            </span>
          </Link>

          <div className="flex-1" />

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link href="/" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-all">
              Accueil
            </Link>
            <Link href="/?trending=true" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-red-400 px-3 py-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-all">
              <Flame className="w-3.5 h-3.5" />
              Trending
            </Link>
            <Link href="/favorites" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-all">
              <Heart className="w-3.5 h-3.5" />
              Favoris
            </Link>
          </div>

          {/* Theme toggle only */}
          <div className="flex items-center shrink-0 ml-2">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
