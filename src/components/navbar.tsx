'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Zap, Heart, Home } from 'lucide-react';

const navLinkStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', borderRadius: '9999px',
  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
  border: '1.5px solid var(--color-border)',
  background: 'transparent', color: 'var(--color-text-secondary)',
  textDecoration: 'none', transition: 'all 0.15s',
} as const;

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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              TechNews
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white leading-none">
              HUB
            </span>
          </Link>

          <div className="flex-1" />

          {/* Nav links + theme toggle — uniform pill style */}
          <div className="flex items-center gap-2">
            <Link href="/" style={navLinkStyle} className="hover:border-indigo-500/50 hover:text-[var(--color-text)]">
              <Home style={{ width: 14, height: 14 }} />
              Accueil
            </Link>
            <Link href="/favorites" style={navLinkStyle} className="hover:border-amber-500/50 hover:text-amber-400">
              <Heart style={{ width: 14, height: 14 }} />
              Favoris
            </Link>
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={navLinkStyle}
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              className="hover:border-indigo-500/50 hover:text-[var(--color-text)]"
            >
              {theme === 'dark' ? <Sun style={{ width: 14, height: 14 }} /> : <Moon style={{ width: 14, height: 14 }} />}
              {theme === 'dark' ? 'Clair' : 'Sombre'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
