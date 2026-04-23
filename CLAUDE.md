# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint via Next.js
```

No test suite is configured.

To force a cache refresh (re-fetch all RSS feeds), delete the cache file (local only):

```bash
rm .cache/articles.json
```

On Vercel, the cache is written to `/tmp/articles.json` (filesystem read-only constraint); it resets automatically on each cold start.

## Architecture

**TechNews Hub** is a Next.js 15 (App Router) tech news aggregator. The core data flow is:

1. **`src/app/api/articles/route.ts`** — single GET endpoint that aggregates from francophone RSS feeds only (`rss-parser`). Results are cached for 30 minutes (TTL = `CACHE_TTL = 1800`) to `.cache/articles.json` locally or `/tmp/articles.json` on Vercel (`CACHE_DIR` switches based on `process.env.VERCEL`). On cache miss, it fetches all feeds in parallel, calculates trending scores, enriches missing thumbnails via `og:image` scraping, deduplicates by URL, then persists the cache.

2. **`data/feeds.json`** — single source of truth for RSS feed URLs, categories, and settings (`maxArticlesPerSource`, `totalMaxArticles`, `trendingWindowHours`). Toggling `enabled: false` disables a feed without deleting it.

3. **`src/app/page.tsx`** — client component (`'use client'`) that calls `/api/articles` with query params (`category`, `q`, `trending`, `page`, `limit`). Client-side sort order is applied after fetch. Bookmarks are stored in `localStorage` under key `technews-bookmarks`.

4. **`src/app/favorites/page.tsx`** and **`src/app/categories/[category]/page.tsx`** — additional pages sharing the same `/api/articles` endpoint.

5. **`src/components/`** — `ArticleCard`, `Navbar`, `Footer`. No shared state management library; state lives in page components.

## Categories

Valid category values (defined in `src/types/index.ts`): `ia` · `devops` · `linux` · `windows` · `infrastructure` · `cybersecurite` · `all`

## Styling

Tailwind CSS v4 with CSS custom properties for theming (`--color-surface`, `--color-border`, etc.) defined in `src/app/globals.css`. Dark mode is handled client-side via a class toggle persisted in `localStorage`.

## Deployment

Recommended: Vercel (native Next.js API route support). GitHub Pages is incompatible due to server-side API routes.
