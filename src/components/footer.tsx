import Link from 'next/link';
import { Zap, Heart, GitBranch } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="flex flex-col items-center text-center gap-4 py-4">

          {/* Brand */}
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              TechNews Hub
            </span>
          </Link>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
            Agrégateur d'actualités tech : DevOps, IA, Linux, Windows et Cloud — tout en un seul endroit.
          </p>

          {/* GitHub */}
          <a
            href="https://github.com/shepper1/TechNews_Hub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-200"
          >
            <GitBranch className="w-4 h-4" />
            Voir sur GitHub
          </a>
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
