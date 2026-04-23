# TechNews Hub

Agrégateur d'actualités tech en temps réel — DevOps, IA, Infrastructure, Linux, Windows.

Sources : flux RSS francophones uniquement (Numerama, LeMonde Informatique, ZDNet France, IT-Connect, LinuxFr, Zataz, CERT-FR…). Cache serveur de 30 minutes. Favoris et thème sombre persistants côté client.

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

Catégories disponibles : `ia` · `devops` · `linux` · `windows` · `infrastructure` · `cybersecurite`

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
