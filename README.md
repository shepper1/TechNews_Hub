# TechNews Hub

Agrégateur d'actualités tech en temps réel — DevOps, IA, Infrastructure, Linux, Windows.

Sources : flux RSS, HackerNews, Reddit. Cache serveur de 30 minutes. Favoris et thème sombre persistants côté client.

---

## Lancement local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## Ajouter / modifier des sources

Tout se passe dans **`data/feeds.json`**. Chaque entrée suit ce format :

```json
{
  "name": "Nom affiché",
  "url":  "https://example.com/feed.xml",
  "category": "devops",
  "enabled": true
}
```

Catégories disponibles : `ia` · `devops` · `linux` · `windows` · `infrastructure`

Après toute modification, supprime `.cache/articles.json` pour forcer un re-fetch :

```bash
rm .cache/articles.json
```

---

## Réglages

| Fichier | Rôle |
|---|---|
| `data/feeds.json` | Sources RSS + paramètres (intervalle, max articles…) |
| `src/app/globals.css` | Thème, couleurs, composants CSS |
| `src/app/api/articles/route.ts` | Logique d'agrégation, cache, scoring trending |

---

## Hébergement

### ✅ Option recommandée — Vercel (gratuit, zéro config)

Vercel est conçu pour Next.js et supporte nativement les routes API serveur.

1. Pousse le projet sur GitHub
2. Va sur [vercel.com](https://vercel.com) → **New Project** → importe ton dépôt
3. Laisse toutes les options par défaut → **Deploy**

C'est tout. Chaque `git push` redéploie automatiquement.

---

### ⚠️ GitHub Pages — limitations importantes

GitHub Pages ne sert que des fichiers **statiques**. Ce projet utilise des routes API Next.js côté serveur (`/api/articles`) pour agréger les RSS, ce qui est **incompatible** avec un déploiement GitHub Pages standard.

Pour contourner, il faudrait convertir l'app en export statique (build-time RSS fetch), ce qui implique :
- Supprimer les routes API
- Pré-générer les articles à chaque build via GitHub Actions (cron)
- Ajouter `output: 'export'` dans `next.config.ts`

Cette conversion est complexe et casse le cache 30 min ainsi que le filtrage dynamique. **Vercel est fortement recommandé à la place.**

---

### Option alternative — Auto-hébergement (VPS / serveur)

```bash
npm run build
npm start        # écoute sur le port 3000 par défaut
```

Expose ensuite le port 3000 via Nginx ou Caddy en reverse proxy.

---

## Stack technique

- **Next.js 15** — App Router, React Server Components
- **Tailwind CSS v4** — utilitaires JIT, thème CSS natif
- **TypeScript 5.7**
- **rss-parser** — parsing des flux RSS
- **lucide-react** — icônes
