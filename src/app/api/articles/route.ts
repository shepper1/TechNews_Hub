import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

const parser = new Parser<{ [key: string]: any }>({
  customFields: {
    item: [
      ['content:encoded', 'textContent'],
      ['content:encoded', 'html'],
      'description',
      ['dc:creator', 'creator'],
      'media:content',
      'media:thumbnail',
      'category',
    ],
  },
});

interface FeedEntry {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string | null;
  content: string | null;
  creator: string | null;
  media_content: Array<{ [key: string]: string }>;
  media_thumbnail: Array<{ [key: string]: string }>;
  categories: string[];
  [key: string]: any;
}

interface FeedConfig {
  name: string;
  url: string;
  category: string;
  enabled: boolean;
}

interface FeedsConfig {
  feeds: FeedConfig[];
  settings: {
    refreshInterval: number;
    maxArticlesPerSource: number;
    totalMaxArticles: number;
    trendingWindowHours: number;
  };
}

const CACHE_TTL = 1800; // 30 minutes
// Vercel's filesystem is read-only except /tmp
const CACHE_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.cache');

async function getFeedsConfig(): Promise<FeedsConfig> {
  const configPath = path.join(process.cwd(), 'data', 'feeds.json');
  const data = await fs.promises.readFile(configPath, 'utf-8');
  return JSON.parse(data);
}

function extractImageUrl(entry: any): string | undefined {
  // media:thumbnail — rss-parser stores with colon key, xml2js wraps attrs in $
  const mt = entry['media:thumbnail'];
  if (mt) {
    const node = Array.isArray(mt) ? mt[0] : mt;
    if (node?.$?.url) return node.$.url;
    if (node?.url) return node.url;
    if (typeof node === 'string') return node;
  }
  // media:content
  const mc = entry['media:content'];
  if (mc) {
    const node = Array.isArray(mc) ? mc[0] : mc;
    if (node?.$?.url) return node.$.url;
    if (node?.url) return node.url;
    if (typeof node === 'string') return node;
  }
  // enclosure (standard RSS <enclosure> tag)
  if (entry.enclosure?.url) return entry.enclosure.url;
  // Parse <img> from content:encoded (mapped to textContent) or raw content
  const html: string = entry.textContent || entry['content:encoded'] || entry.content || '';
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&nbsp;': ' ', '&thinsp;': ' ', '&ensp;': ' ', '&emsp;': ' ',
  '&eacute;': 'é', '&egrave;': 'è', '&ecirc;': 'ê', '&euml;': 'ë',
  '&agrave;': 'à', '&acirc;': 'â', '&auml;': 'ä', '&aring;': 'å',
  '&ocirc;': 'ô', '&ouml;': 'ö', '&ugrave;': 'ù', '&ucirc;': 'û', '&uuml;': 'ü',
  '&ccedil;': 'ç', '&icirc;': 'î', '&iuml;': 'ï', '&ntilde;': 'ñ',
  '&Eacute;': 'É', '&Egrave;': 'È', '&Ecirc;': 'Ê', '&Euml;': 'Ë',
  '&Agrave;': 'À', '&Acirc;': 'Â', '&Auml;': 'Ä', '&Ocirc;': 'Ô',
  '&Ucirc;': 'Û', '&Uuml;': 'Ü', '&Ccedil;': 'Ç', '&Icirc;': 'Î',
  '&laquo;': '«', '&raquo;': '»', '&mdash;': '—', '&ndash;': '–',
  '&hellip;': '…', '&euro;': '€', '&copy;': '©', '&reg;': '®',
  '&trade;': '™', '&lsquo;': '\u2018', '&rsquo;': '\u2019',
  '&ldquo;': '\u201C', '&rdquo;': '\u201D', '&bull;': '•',
};

function decodeEntities(text: string): string {
  return text
    .replace(/&[a-zA-Z]+;/g, m => HTML_ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function cleanDescription(text: string | null): string {
  if (!text) return '';
  const stripped = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const decoded = decodeEntities(stripped);
  return decoded.slice(0, 300) + (decoded.length > 300 ? '…' : '');
}

// ── Ad / sponsored content filters ──────────────────────────────────────────

const AD_CATEGORY_RE = /sponsor|partner|advertorial|promoted|native[- ]?ad/i;

const AD_TITLE_RE = new RegExp(
  [
    // Editorial markers
    'partenaire', 'sponsor(?:is[eé])?', 'publi[- ]?report', 'publi[- ]?r[eé]dac',
    'communiqu[eé] de presse', '\\[sponso\\]', 'avis d.expert', 'advertorial',
    // Promo / price drop
    '\\ben\\s+promo\\b', 'tombe\\s+en\\s+promo', 'est\\s+en\\s+promo',
    'bon\\s*plan', 'bons\\s*plans', 'code\\s*promo', 'meilleur\\s*prix',
    'baisse\\s*(ses|les)\\s*prix', 'jusqu.à\\s*-\\s*\\d+\\s*%',
    '\\d+\\s*%\\s*de\\s*r[eé]duction', 'offre\\s*(sp[eé]ciale|exclusive|limit[eé]e|flash)',
    'promo\\s*(flash|exceptionnelle)',
    // Buying guides
    'quell?e?s?\\s+sont\\s+les?\\s+meilleures?',
    'les?\\s+meilleurs?\\s+(?:vpn|antivirus|enceintes?|casques?|[eé]crans?|smartphones?|tablettes?|laptops?|pc\\s+portables?)',
    'meilleur.*vpn', 'vpn.*pas\\s*cher', 'comparatif\\s*(des\\s*)?meilleur',
    '\\d+\\s+(?:mod[eè]les?|produits?|options?)\\s+(?:à\\s+)?(?:acheter|tester|essayer)',
  ].join('|'),
  'i'
);

const AD_URL_RE = /\ben-promo\b|tombe-en|bon-plan|code-promo|baisse-ses-prix|meilleur-prix|moins-cher|quelles?-sont-les-meilleures?|expressvpn|nordvpn|surfshark|cyberghost|ipvanish|purevpn/i;

// ── Keyword-based category classification ────────────────────────────────────

const CATEGORY_PATTERNS: Array<{ category: string; re: RegExp }> = [
  {
    category: 'cybersecurite',
    re: /cybers[eé]curit[eé]|vuln[eé]rabilit[eé]|ransomware|rançongiciel|malware|logiciel\s*malveillant|phishing|hameçonnage|faille\s*(?:de\s*s[eé]curit[eé])?|hack(?:er|ing|é)|CVE-\d|zero[- ]?day|breach|violation\s*de\s*donn[eé]es|attaque\s*inform|DDoS|CERT\b|ANSSI\b/i,
  },
  {
    category: 'ia',
    re: /intelligence\s*artificielle|\bIA\b|machine[\s-]?learning|deep[\s-]?learning|\bLLM\b|GPT-?[0-9o]|ChatGPT|Gemini|Mistral|Copilot|g[eé]n[eé]ratif|modèle\s+de\s+langage|réseau\s+de\s+neurones|agent\s+(?:ia|ai)|Llama\b|Ollama\b/i,
  },
  {
    category: 'devops',
    re: /\bDevOps\b|Docker|Kubernetes|\bK8s?\b|Terraform|Ansible|Jenkins|\bCI[/\s]?CD\b|conteneuris|microservice|GitOps|ArgoCD|Helm\b|Prometheus\b|Grafana\b/i,
  },
  {
    category: 'linux',
    re: /\bLinux\b|Ubuntu|Debian|Fedora|Red\s*Hat|openSUSE|Arch\s*Linux|kernel\s+Linux|distributions?\s+Linux|\bGNU\b/i,
  },
  {
    category: 'windows',
    re: /\bWindows\s*(?:10|11|Server|\d{4})?\b|PowerShell|Active\s*Directory|\bIntune\b|Microsoft\s*(?:365|Office|Teams|Outlook|Defender)/i,
  },
  {
    category: 'infrastructure',
    re: /\bCloud\b|AWS\b|Amazon\s*Web\s*Services|Google\s*Cloud|GCP\b|\bAzure\b(?!\s*AD)|datacenter|data\s*center|virtualisation|VMware|hyperviseur|\bCDN\b|on[- ]?premise|réseau\s*(?:d.entreprise|SD-WAN)|stockage\s*(?:objet|réseau|SAN|NAS)/i,
  },
];

function classifyArticle(title: string, description: string, feedCategory: string): string {
  const text = title + ' ' + description;
  for (const { category, re } of CATEGORY_PATTERNS) {
    if (re.test(text)) return category;
  }
  return feedCategory;
}

async function fetchRSSFeeds(): Promise<any[]> {
  const config = await getFeedsConfig();
  const enabledFeeds = config.feeds.filter((f) => f.enabled);
  const results: any[] = [];

  const fetchFeed = async (feed: FeedConfig) => {
    let feedData: any;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(feed.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechNewsHub/1.0)' },
      });
      clearTimeout(timer);
      const buffer = Buffer.from(await res.arrayBuffer());
      const head = buffer.subarray(0, 512).toString('binary');
      const encMatch = head.match(/encoding=["']([^"']+)["']/i);
      const httpCharset = res.headers.get('content-type')?.match(/charset=([^;\s]+)/i)?.[1];
      const rawEnc = (encMatch?.[1] ?? httpCharset ?? 'utf-8').toLowerCase().trim();
      const enc = (rawEnc === 'latin1' || rawEnc === 'iso-8859-1' || rawEnc === 'windows-1252')
        ? 'windows-1252' : rawEnc;
      let xmlStr: string;
      try { xmlStr = new TextDecoder(enc).decode(buffer); }
      catch { xmlStr = new TextDecoder('utf-8').decode(buffer); }
      feedData = await parser.parseString(xmlStr);
    } catch {
      return;
    }

    if (!feedData?.items || feedData.items.length === 0) {
      return;
    }

    const items = feedData.items.slice(0, config.settings.maxArticlesPerSource);

    for (const item of items) {
      const title = item.title || '';
      const link = item.link || '';

      // Filter by RSS category tag
      const cats: string[] = ([] as string[]).concat(item.categories || item.category || []);
      if (cats.some(c => AD_CATEGORY_RE.test(c))) continue;

      // Filter by URL slug
      if (AD_URL_RE.test(link)) continue;

      // Extract description before title/desc content check
      const desc = item.description || item['content:encoded'] || item.contentSnippet || '';
      const description = cleanDescription(desc);

      // Filter by title or description
      if (AD_TITLE_RE.test(title) || AD_TITLE_RE.test(description)) continue;

      const imageUrl = extractImageUrl(item as FeedEntry);

      let author = '';
      if (item.creator) {
        author = Array.isArray(item.creator) ? item.creator[0] : item.creator;
      } else if (item['dc:creator']) {
        author = Array.isArray(item['dc:creator']) ? item['dc:creator'][0] : item['dc:creator'];
      }

      const category = classifyArticle(decodeEntities(title), description, feed.category);

      results.push({
        id: `rss-${feed.name}-${link}-${item.pubDate}`,
        title: decodeEntities(title),
        description,
        link,
        pubDate: item.pubDate || new Date().toISOString(),
        category,
        source: feed.name,
        imageUrl,
        author: author || feed.name,
        contentSnippet: description,
        score: 0,
      });
    }
  };

  await Promise.allSettled(enabledFeeds.map(fetchFeed));

  return results;
}

async function enrichWithOgImages(articles: any[]): Promise<any[]> {
  const missing = articles.filter(a => !a.imageUrl);

  const fetchOgImage = async (article: any): Promise<void> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(article.link, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechNewsHub/1.0)' },
      });
      clearTimeout(timer);
      const html = await res.text();
      const m =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (m?.[1] && m[1].startsWith('http')) article.imageUrl = m[1];
    } catch { /* timeout or network error — skip */ }
  };

  // Batch of 8 concurrent fetches, max 10 articles
  const cap = missing.slice(0, 10);
  for (let i = 0; i < cap.length; i += 8) {
    await Promise.allSettled(cap.slice(i, i + 8).map(fetchOgImage));
  }
  return articles;
}

function calculateTrendingScores(articles: any[]): any[] {
  const now = new Date();
  return articles.map((article) => {
    const pubDate = new Date(article.pubDate);
    const hoursAgo = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
    let score = article.score || 0;

    // Decay factor: newer articles get a boost
    if (hoursAgo < 1) score += 50;
    else if (hoursAgo < 6) score += 30;
    else if (hoursAgo < 12) score += 15;
    else if (hoursAgo < 24) score += 5;

    article.isTrending = score > 40;
    article.score = score;
    return article;
  });
}

async function fetchAndCacheAll(cachePath: string): Promise<any[]> {
  let articles = await fetchRSSFeeds();
  articles = calculateTrendingScores(articles);

  const seen = new Set<string>();
  articles = articles.filter((a) => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  articles = await enrichWithOgImages(articles);

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  await fs.promises.writeFile(cachePath, JSON.stringify({ articles, timestamp: Date.now() }));
  return articles;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '60', 10);
  const query = searchParams.get('q') || '';
  const trending = searchParams.get('trending') === 'true';

  const cachePath = path.join(CACHE_DIR, 'articles.json');
  let articles: any[] = [];
  let isStale = false;

  try {
    const cacheData = await fs.promises.readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(cacheData);
    articles = parsed.articles;
    isStale = Date.now() - parsed.timestamp >= CACHE_TTL * 1000;
  } catch {
    // No cache yet
  }

  if (articles.length === 0) {
    // First ever load — must wait
    articles = await fetchAndCacheAll(cachePath);
  } else if (isStale) {
    // Serve stale immediately, refresh in background
    fetchAndCacheAll(cachePath).catch(console.error);
  }

  // Filter by category
  if (category !== 'all') {
    articles = articles.filter((a) => a.category === category);
  }

  // Filter by search query
  if (query) {
    const q = query.toLowerCase();
    articles = articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }

  // Filter to trending only
  if (trending) {
    articles = articles.filter((a) => a.isTrending);
  }

  // Sort: trending first, then by date (was inverted before)
  articles.sort((a, b) => {
    if (a.isTrending && !b.isTrending) return -1;
    if (!a.isTrending && b.isTrending) return 1;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  // Pagination
  const total = articles.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedArticles = articles.slice(start, start + limit);

  return NextResponse.json({
    articles: paginatedArticles,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    lastUpdated: new Date().toISOString(),
  });
}