'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/article-card';
import { Search, X, Grid, List, Flame } from 'lucide-react';

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

const CATEGORIES = [
  { id: 'all',            label: 'Tout',   icon: '🌐' },
  { id: 'ia',             label: 'IA',     icon: '🤖' },
  { id: 'devops',         label: 'DevOps', icon: '⚙️' },
  { id: 'linux',          label: 'Linux',  icon: '🐧' },
  { id: 'windows',        label: 'Windows',icon: '🪟' },
  { id: 'infrastructure', label: 'Infra',  icon: '☁️' },
  { id: 'cybersecurite',  label: 'Cyber',  icon: '🔒' },
];

function HomePageContent() {
  const searchParams = useSearchParams();

  const [articles,       setArticles]       = useState<Article[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode,       setViewMode]       = useState<'grid' | 'list'>('grid');
  const [bookmarks,      setBookmarks]      = useState<BookmarkState>({});
  const [sortBy,         setSortBy]         = useState<'date' | 'relevance'>('date');
  const [trendingOnly,   setTrendingOnly]   = useState(false);
  const [favoritesOnly,  setFavoritesOnly]  = useState(false);

  /* ── Sync URL params → state (runs when URL changes) ── */
  useEffect(() => {
    setTrendingOnly(searchParams.get('trending') === 'true');
    const q   = searchParams.get('q');
    const cat = searchParams.get('category');
    if (q)   setSearchQuery(q);
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  /* ── Load bookmarks once ── */
  useEffect(() => {
    const saved = localStorage.getItem('technews-bookmarks');
    if (saved) try { setBookmarks(JSON.parse(saved)); } catch {}
  }, []);

  /* ── Fetch articles ── */
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (activeCategory !== 'all') p.set('category', activeCategory);
        if (searchQuery)              p.set('q', searchQuery);
        if (trendingOnly)             p.set('trending', 'true');

        const res = await fetch(`/api/articles?${p}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        setArticles(data.articles ?? []);
        setError(null);
      } catch {
        setError('Impossible de charger les actualités. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [activeCategory, searchQuery, trendingOnly]);

  const toggleBookmark = (article: Article) => {
    const next = { ...bookmarks, [article.id]: !bookmarks[article.id] };
    setBookmarks(next);
    localStorage.setItem('technews-bookmarks', JSON.stringify(next));
  };

  const filteredArticles = useMemo(() => {
    let list = [...articles];
    if (favoritesOnly) list = list.filter(a => bookmarks[a.id]);
    if (sortBy === 'relevance') {
      list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else {
      list.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    }
    return list;
  }, [articles, sortBy, favoritesOnly, bookmarks]);

  return (
    <div className="min-h-screen">

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero-section">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, transparent 50%, rgba(6,182,212,0.07) 100%)', pointerEvents: 'none' }} />

        <div className="relative container">
          <div className="hero-center">

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '2rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              {loading ? 'Chargement…' : `${articles.length} actualités · mis à jour`}
            </div>

            <h1 className="hero-title">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                TechNews Hub
              </span>
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              DevOps · IA · Infrastructure · Linux · Windows — agrégation multi-sources en temps réel.
            </p>

            <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
              <div className="search-bar">
                <Search className="search-icon w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une actualité, source, sujet…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingTop: '13px', paddingBottom: '13px', fontSize: '0.9rem' }}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Effacer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CATEGORY + TOOLBAR BAR ══════════════ */}
      <div className="sticky top-16 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 0', overflowX: 'auto' }} className="scrollbar-hide">

            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={activeCategory === cat.id ? {
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '9999px',
                  background: '#4f46e5', color: '#fff',
                  fontSize: '0.8rem', fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0, border: 'none', cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
                } : {
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '9999px',
                  background: 'transparent', color: 'var(--color-text-secondary)',
                  fontSize: '0.8rem', fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  border: '1.5px solid var(--color-border)', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <button
                onClick={() => setTrendingOnly(t => !t)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '9999px',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  background: trendingOnly ? '#ef4444' : 'transparent',
                  color: trendingOnly ? '#fff' : 'var(--color-text-secondary)',
                  border: trendingOnly ? '1.5px solid #ef4444' : '1.5px solid var(--color-border)',
                }}
              >
                <Flame style={{ width: 14, height: 14 }} />
                Trending
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'relevance')}
                style={{ fontSize: '0.8rem', border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', outline: 'none' }}
              >
                <option value="date">Récent</option>
                <option value="relevance">Pertinence</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-hover)', borderRadius: '8px', padding: '3px' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{ padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? '#6366f1' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--color-text-muted)', display: 'flex' }}
                  aria-label="Vue grille"
                >
                  <Grid style={{ width: 14, height: 14 }} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{ padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? '#6366f1' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--color-text-muted)', display: 'flex' }}
                  aria-label="Vue liste"
                >
                  <List style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ CONTENT ══════════════ */}
      <section className="container py-10">

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="article-card-skeleton">
                <div className="article-card-skeleton-image" />
                <div className="p-5 space-y-3">
                  <div className="article-card-skeleton-line" style={{ width: '30%' }} />
                  <div className="article-card-skeleton-line" style={{ width: '90%' }} />
                  <div className="article-card-skeleton-line" style={{ width: '75%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 text-2xl">⚠️</div>
            <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Erreur de chargement</h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-5">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)] mb-2">Aucun résultat</h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-5">
              Essayez de modifier vos filtres ou votre recherche.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); setTrendingOnly(false); setFavoritesOnly(false); }}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <p className="text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-text)]">{filteredArticles.length}</span>
                {' '}article{filteredArticles.length > 1 ? 's' : ''}
                {searchQuery && <> pour <span className="font-medium text-indigo-400">« {searchQuery} »</span></>}
              </p>
              {trendingOnly && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" /> Trending
                </span>
              )}
            </div>

            <div className={`grid gap-6 ${
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
          </>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
