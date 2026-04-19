'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ArticleCard from '@/components/article-card';
import { Search, Grid, List, Heart, ArrowLeft, X } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category: string;
  source: string;
  imageUrl?: string;
  author?: string;
  isTrending?: boolean;
  score?: number;
}

interface BookmarkState {
  [id: string]: boolean;
}

export default function FavoritesPage() {
  const [articles,    setArticles]    = useState<Article[]>([]);
  const [bookmarks,   setBookmarks]   = useState<BookmarkState>({});
  const [loading,     setLoading]     = useState(true);
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let bookmarkState: BookmarkState = {};
    const saved = localStorage.getItem('technews-bookmarks');
    if (saved) try { bookmarkState = JSON.parse(saved); setBookmarks(bookmarkState); } catch {}

    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/articles');
        if (!res.ok) throw new Error();
        const data = await res.json();
        // Keep only bookmarked articles
        setArticles((data.articles ?? []).filter((a: Article) => bookmarkState[a.id]));
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const toggleBookmark = (article: Article) => {
    const next = { ...bookmarks, [article.id]: false };
    setBookmarks(next);
    localStorage.setItem('technews-bookmarks', JSON.stringify(next));
    setArticles(prev => prev.filter(a => a.id !== article.id));
  };

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.source.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  return (
    <div className="min-h-screen">

      {/* ── Header ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 to-pink-600 opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <div className="relative container py-14 md:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-8 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à l'accueil
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Mes favoris
          </h1>
          <p className="text-base text-white/75 mb-8">
            {loading
              ? 'Chargement de vos articles sauvegardés…'
              : `${articles.length} article${articles.length > 1 ? 's' : ''} sauvegardé${articles.length > 1 ? 's' : ''}`
            }
          </p>

          {/* Search */}
          <div className="max-w-lg">
            <div className="search-bar search-bar-light">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans vos favoris…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Effacer">
                  <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Toolbar ── */}
      <section className="sticky top-16 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between py-2.5">
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text)]">{filteredArticles.length}</span>
              {' '}article{filteredArticles.length > 1 ? 's' : ''} sauvegardé{filteredArticles.length > 1 ? 's' : ''}
            </p>

            <div className="flex items-center bg-[var(--color-surface-hover)] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-muted)]'}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-muted)]'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="container py-8">

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="article-card-skeleton">
                <div className="article-card-skeleton-image" />
                <div className="p-4 space-y-3">
                  <div className="article-card-skeleton-line" style={{ width: '30%' }} />
                  <div className="article-card-skeleton-line" style={{ width: '85%' }} />
                  <div className="article-card-skeleton-line" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Aucun favori pour le moment</h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
              Cliquez sur l'icône <Heart className="inline w-3.5 h-3.5 text-amber-400" /> sur les articles qui vous intéressent.
            </p>
            <Link
              href="/"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
            >
              Parcourir les actualités
            </Link>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className={`grid gap-5 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 max-w-3xl'
          }`}>
            {filteredArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={i}
                onBookmark={toggleBookmark}
                isBookmarked={!!bookmarks[article.id]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
