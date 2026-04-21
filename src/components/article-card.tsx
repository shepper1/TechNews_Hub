import { Clock, Bookmark, ExternalLink } from 'lucide-react';

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
  contentSnippet?: string;
  isTrending?: boolean;
  score?: number;
}

interface ArticleCardProps {
  article: Article;
  index: number;
  onBookmark: (article: Article) => void;
  isBookmarked: boolean;
}

const categoryConfig: Record<string, {
  label: string; emoji: string;
  color: string; bg: string;
  gradFrom: string; gradTo: string;
}> = {
  ia:             { label: 'IA',      emoji: '🤖', color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',   gradFrom: '#6d28d9', gradTo: '#4338ca' },
  devops:         { label: 'DevOps',  emoji: '⚙️', color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20',       gradFrom: '#0e7490', gradTo: '#0f766e' },
  linux:          { label: 'Linux',   emoji: '🐧', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     gradFrom: '#b45309', gradTo: '#c2410c' },
  windows:        { label: 'Windows', emoji: '🪟', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       gradFrom: '#1d4ed8', gradTo: '#4338ca' },
  infrastructure: { label: 'Infra',   emoji: '☁️', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', gradFrom: '#047857', gradTo: '#0e7490' },
  cybersecurite:  { label: 'Cyber',   emoji: '🔒', color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       gradFrom: '#9f1239', gradTo: '#7f1d1d' },
};

const DEFAULT_CAT = { label: 'Tech', emoji: '📰', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', gradFrom: '#4338ca', gradTo: '#0e7490' };

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60)     return 'À l\'instant';
  if (seconds < 3600)   return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}j`;
  return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ArticleCard({ article, index, onBookmark, isBookmarked }: ArticleCardProps) {
  const cat = categoryConfig[article.category] ?? DEFAULT_CAT;

  return (
    <div
      className="group flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
    >
      {/* ── Image / Placeholder ── */}
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', position: 'relative', height: 192, flexShrink: 0, overflow: 'hidden' }}
        aria-label={`Lire : ${article.title}`}
      >
        {/* Real image */}
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', transition: 'transform 0.5s ease', willChange: 'transform', transform: 'translateZ(0) scale(1)', backfaceVisibility: 'hidden' }}
            className="group-hover:[transform:translateZ(0)_scale(1.05)]"
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth < 200 || img.naturalHeight < 80) {
                img.style.display = 'none';
                const ph = img.nextElementSibling as HTMLElement | null;
                if (ph) ph.style.display = 'flex';
              }
            }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const ph = img.nextElementSibling as HTMLElement | null;
              if (ph) ph.style.display = 'flex';
            }}
          />
        )}

        {/* Placeholder — shown when no image (or image fails / low-res) */}
        <div
          style={{
            position: 'absolute', inset: 0,
            display: article.imageUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(145deg, ${cat.gradFrom}, ${cat.gradTo})`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
          <span style={{ fontSize: '3.5rem', opacity: 0.6, position: 'relative' }}>{cat.emoji}</span>
        </div>

        {/* Hover dark overlay (image only) */}
        {article.imageUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', opacity: 0, transition: 'opacity 0.3s' }} className="group-hover:opacity-100" />
        )}

{/* External link on hover */}
        <div style={{ position: 'absolute', top: 10, right: 10, opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ExternalLink style={{ width: 13, height: 13, color: '#fff' }} />
          </div>
        </div>
      </a>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.125rem 1.25rem 1rem' }}>
        {/* Category + time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, background: `linear-gradient(135deg, ${cat.gradFrom}, ${cat.gradTo})`, color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
            <span style={{ fontSize: '0.75rem' }}>{cat.emoji}</span>
            {cat.label}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock style={{ width: 11, height: 11 }} />
            {timeAgo(article.pubDate)}
          </span>
        </div>

        {/* Title */}
        <a href={article.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '0.5rem' }}>
          <h2 style={{
            fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.45,
            color: 'var(--color-text)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }} className="hover:text-indigo-400 transition-colors">
            {article.title}
          </h2>
        </a>

        {/* Description */}
        {article.description && (
          <p style={{
            fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            flex: 1, marginBottom: '0.5rem',
          }}>
            {article.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {article.source}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(article); }}
              style={{ padding: '6px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
              className="hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Bookmark style={{ width: 14, height: 14, transition: 'color 0.2s', fill: isBookmarked ? '#f59e0b' : 'none', color: isBookmarked ? '#f59e0b' : 'var(--color-text-muted)' }} />
            </button>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ padding: '6px', borderRadius: 8, display: 'flex' }}
              className="hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label="Ouvrir l'article"
            >
              <ExternalLink style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
