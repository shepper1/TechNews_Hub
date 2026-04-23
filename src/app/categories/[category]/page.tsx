'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ArticleCard from '@/components/article-card';
import { Search, Grid, List, ArrowLeft, X } from 'lucide-react';

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

const CATEGORY_INFO: Record<string, { label: string; icon: string; gradient: string; description: string }> = {
  ia:             { label: 'Intelligence Artificielle', icon: '🤖', gradient: 'from-violet-600 to-purple-600',  description: 'IA, machine learning, deep learning et applications AI' },
  devops:         { label: 'DevOps & SRE',              icon: '⚙️', gradient: 'from-cyan-600 to-teal-600',     description: 'CI/CD, Kubernetes, Docker, Terraform et pratiques DevOps' },
  linux:          { label: 'Linux',                     icon: '🐧', gradient: 'from-amber-500 to-orange-500',  description: 'Distributions, administration système, kernels et outils Linux' },
  windows:        { label: 'Windows',                   icon: '🪟', gradient: 'from-blue-600 to-indigo-600',   description: 'Windows Server, PowerShell, WSL et écosystème Microsoft' },
  infrastructure: { label: 'Infrastructure Cloud',      icon: '☁️', gradient: 'from-emerald-600 to-green-600', description: 'AWS, Azure, GCP, architecture cloud et infrastructure moderne' },
  cybersecurite:  { label: 'Cybersécurité',             icon: '🔒', gradient: 'from-rose-700 to-red-900',      description: 'Menaces, vulnérabilités, alertes CERT-FR et bonnes pratiques de sécurité' },
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const info = CATEGORY_INFO[category];

  const [articles,    setArticles]    = useState<Article[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('grid');
  const [bookmarks,   setBookmarks]   = useState<BookmarkState>({});
  const [sortBy,      setSortBy]      = useState<'date' | 'relevance'>('date');

  useEffect(() => {
    const saved = localStorage.getItem('technews-bookmarks');
    if (saved) try { setBookmarks(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/articles?category=${category}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setArticles(data.articles ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [category]);

  const toggleBookmark = (article: Article) => {
    const next = { ...bookmarks, [article.id]: !bookmarks[article.id] };
    setBookmarks(next);
    localStorage.setItem('technews-bookmarks', JSON.stringify(next));
  };

  const filteredArticles = useMemo(() => {
    let list = [...articles];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'relevance') list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else list.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return list;
  }, [articles, searchQuery, sortBy]);

  return (
    <div className="min-h-screen">

      {/* ── Header ── */}
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${info?.gradient ?? 'from-indigo-600 to-cyan-600'} opacity-90`} />
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
            <span className="text-4xl">{info?.icon ?? '📰'}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            {info?.label ?? 'Actualités'}
          </h1>
          <p className="text-base text-white/75 max-w-lg mb-8">
            {info?.description ?? ''}
          </p>

          {/* Search */}
          <div className="max-w-lg">
            <div className="search-bar search-bar-light">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                placeholder={`Rechercher dans ${info?.label ?? 'les actualités'}…`}
                aria-label={`Rechercher dans ${info?.label ?? 'les actualités'}`}
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
          <div className="flex items-center justify-between py-2.5 gap-4">
            <p className="text-xs text-[var(--color-text-secondary)] shrink-0">
              <span className="font-semibold text-[var(--color-text)]">{filteredArticles.length}</span>
              {' '}article{filteredArticles.length > 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-category" className="sr-only">Trier les articles</label>
              <select
                id="sort-category"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'relevance')}
                className="text-xs border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none"
              >
                <option value="date">Récent</option>
                <option value="relevance">Pertinence</option>
              </select>

              <div className="flex items-center bg-[var(--color-surface-hover)] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Vue grille"
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-muted)]'}`}
                >
                  <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="Vue liste"
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-muted)]'}`}
                >
                  <List className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="container py-8">

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="article-card-skeleton">
                <div className="article-card-skeleton-image" />
                <div className="p-4 space-y-3">
                  <div className="article-card-skeleton-line" style={{ width: '30%' }} />
                  <div className="article-card-skeleton-line" style={{ width: '85%' }} />
                  <div className="article-card-skeleton-line" style={{ width: '65%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-[var(--color-text-secondary)] text-sm">Impossible de charger les articles.</p>
            <Link href="/" className="mt-4 inline-block text-indigo-400 text-sm hover:underline">Retour à l'accueil</Link>
          </div>
        )}

        {!loading && !error && filteredArticles.length === 0 && (
          <div className="text-center py-24">
            <p className="text-[var(--color-text-secondary)] text-sm">Aucun article trouvé.</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="mt-3 text-indigo-400 text-sm hover:underline">
                Effacer la recherche
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
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
