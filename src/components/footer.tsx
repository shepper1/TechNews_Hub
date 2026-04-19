import Link from 'next/link';
import { Zap, Heart, GitBranch, MessageCircle, Rss, Mail } from 'lucide-react';

const categories = [
  { id: 'ia',             label: 'Intelligence Artificielle', icon: '🤖' },
  { id: 'devops',         label: 'DevOps & SRE',              icon: '⚙️' },
  { id: 'linux',          label: 'Linux',                     icon: '🐧' },
  { id: 'windows',        label: 'Windows',                   icon: '🪟' },
  { id: 'infrastructure', label: 'Infrastructure Cloud',      icon: '☁️' },
  { id: 'cybersecurite',  label: 'Cybersécurité',             icon: '🔒' },
];

const quickLinks = [
  { label: 'Accueil',   href: '/' },
  { label: 'Trending',  href: '/?trending=true' },
  { label: 'Favoris',   href: '/favorites' },
];

const socialLinks = [
  { label: 'RSS',     href: '#',                               icon: Rss },
  { label: 'GitHub',  href: 'https://github.com',              icon: GitBranch },
  { label: 'Twitter', href: 'https://x.com',                   icon: MessageCircle },
  { label: 'Contact', href: 'mailto:contact@technewshub.dev',  icon: Mail },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-8">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                TechNews Hub
              </span>
            </Link>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Agrégateur d'actualités tech : DevOps, IA, Linux, Windows et Cloud — tout en un seul endroit.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-widest mb-4">Catégories</h4>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link
                    href={`/categories/${cat.id}`}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-widest mb-4">Navigation</h4>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-widest mb-4">Liens</h4>
            <div className="flex gap-2 flex-wrap">
              {socialLinks.map(link => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="theme-toggle"
                    title={link.label}
                    aria-label={link.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[var(--color-border)] pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} TechNews Hub · Agrégation automatique de sources tech ouvertes.
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
            Fait avec <Heart className="w-3 h-3 text-rose-400" fill="currentColor" /> pour la communauté dev
          </p>
        </div>
      </div>
    </footer>
  );
}
