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

interface ApiSource {
  name: string;
  type: string;
  url?: string;
  category: string;
  enabled: boolean;
}

interface FeedsConfig {
  feeds: FeedConfig[];
  apiSources: ApiSource[];
  settings: {
    refreshInterval: number;
    maxArticlesPerSource: number;
    totalMaxArticles: number;
    trendingWindowHours: number;
  };
}

const CACHE_KEY = 'articles_cache';
const CACHE_TTL = 1800; // 30 minutes

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

async function fetchRSSFeeds(): Promise<any[]> {
  const config = await getFeedsConfig();
  const enabledFeeds = config.feeds.filter((f) => f.enabled);
  const results: any[] = [];

  const fetchFeed = async (feed: FeedConfig) => {
    let feedData: any;
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        }

        // Fetch raw bytes to handle non-UTF-8 encodings
        const res = await fetch(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechNewsHub/1.0)' },
        });
        const buffer = Buffer.from(await res.arrayBuffer());

        // Detect encoding: XML declaration takes priority, then HTTP Content-Type
        // Use binary (latin1) to read header so non-ASCII bytes aren't lost to 'ascii' ?-replacement
        const head = buffer.subarray(0, 512).toString('binary');
        const encMatch = head.match(/encoding=["']([^"']+)["']/i);
        const httpCharset = res.headers.get('content-type')?.match(/charset=([^;\s]+)/i)?.[1];
        const rawEnc = (encMatch?.[1] ?? httpCharset ?? 'utf-8').toLowerCase().trim();
        // Normalise: 'latin1' alias not recognised by TextDecoder; windows-1252 correctly
        // maps 0x80-0x9F (typographic quotes, em-dash…) unlike raw latin1 which leaves them
        // as XML-illegal control chars that parsers silently replace with '?'
        const enc = (rawEnc === 'latin1' || rawEnc === 'iso-8859-1' || rawEnc === 'windows-1252')
          ? 'windows-1252'
          : rawEnc;
        let xmlStr: string;
        try {
          xmlStr = new TextDecoder(enc).decode(buffer);
        } catch {
          xmlStr = new TextDecoder('utf-8').decode(buffer);
        }
        feedData = await parser.parseString(xmlStr);

        // Validate that we got a valid feed with items
        if (feedData?.items && feedData.items.length > 0) {
          break; // Success
        } else if (feedData?.items && feedData.items.length === 0) {
          console.warn(`Feed ${feed.name} returned 0 items`);
          break;
        }
      } catch (err: any) {
        if (attempt === maxRetries) {
          console.error(`Error fetching RSS feed ${feed.name} (attempt ${attempt + 1}):`, err?.message || err);
          return;
        }
        // Wait and retry on error
        console.warn(`Retry ${attempt + 1}/${maxRetries} for ${feed.name}:`, err?.message || err);
      }
    }

    if (!feedData?.items || feedData.items.length === 0) {
      return;
    }

    const items = feedData.items.slice(0, config.settings.maxArticlesPerSource);

    for (const item of items) {
      // Extract description from various fields
      let desc = item.description || item['content:encoded'] || item.contentSnippet || '';
      const imageUrl = extractImageUrl(item as FeedEntry);
      const description = cleanDescription(desc);

      // Extract author
      let author = '';
      if (item.creator) {
        author = Array.isArray(item.creator) ? item.creator[0] : item.creator;
      } else if (item['dc:creator']) {
        author = Array.isArray(item['dc:creator']) ? item['dc:creator'][0] : item['dc:creator'];
      }

      results.push({
        id: `rss-${feed.name}-${item.link}-${item.pubDate}`,
        title: decodeEntities(item.title || 'Untitled'),
        description,
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        category: feed.category as any,
        source: feed.name,
        imageUrl,
        author: author || feed.name,
        contentSnippet: description,
        score: 0,
      });
    }
  };

  // Fetch feeds in parallel (limit concurrency)
  const batchSize = 5;
  for (let i = 0; i < enabledFeeds.length; i += batchSize) {
    const batch = enabledFeeds.slice(i, i + batchSize);
    await Promise.all(batch.map(fetchFeed));
  }

  return results;
}

async function fetchHackerNews(): Promise<any[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      next: { revalidate: 1800 },
    });
    const ids: number[] = await res.json();
    const topIds = ids.slice(0, 30);

    const stories: any[] = [];
    for (const id of topIds) {
      const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
        next: { revalidate: 1800 },
      });
      const story = await storyRes.json();
      if (story && story.title && story.url && story.score > 50) {
        stories.push({
          id: `hn-${id}`,
          title: story.title,
          description: story.descendants ? `${story.descendants} comments` : '',
          link: story.url,
          pubDate: story.time ? new Date(story.time * 1000).toISOString() : new Date().toISOString(),
          category: 'infrastructure' as const,
          source: 'HackerNews',
          imageUrl: undefined,
          author: 'HackerNews',
          contentSnippet: story.descendants ? `${story.descendants} comments` : '',
          score: story.score || 0,
        });
      }
    }
    return stories;
  } catch (err) {
    console.error('Error fetching HackerNews:', err);
    return [];
  }
}

async function fetchRedditPosts(category: string, subreddit: string): Promise<any[]> {
  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=15`, {
      headers: { 'User-Agent': 'TechNewsHub/1.0 (+https://technews.local)' },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.error(`Reddit r/${subreddit} returned ${res.status}`);
      return [];
    }

    const data = await res.json();

    const posts: any[] = [];
    if (data?.[1]?.data?.children) {
      for (const child of data[1].data.children) {
        const post = child.data;
        if (post.title && post.url && post.url !== 'selfpost' && !post.url.startsWith('/r/')) {
          posts.push({
            id: `reddit-${post.id}`,
            title: post.title,
            description: post.selftext ? post.selftext.slice(0, 200) : '',
            link: `https://reddit.com${post.permalink}`,
            pubDate: new Date(post.created_utc * 1000).toISOString(),
            category: category as any,
            source: `r/${subreddit}`,
            imageUrl: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : undefined,
            author: post.author || 'reddit',
            contentSnippet: post.selftext ? post.selftext.slice(0, 200) : '',
            score: post.ups || 0,
          });
        }
      }
    }
    return posts;
  } catch (err) {
    console.error(`Error fetching Reddit r/${subreddit}:`, err);
    return [];
  }
}

async function enrichWithOgImages(articles: any[]): Promise<any[]> {
  const missing = articles.filter(a => !a.imageUrl && a.source !== 'HackerNews' && !a.source.startsWith('r/'));

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

  // Batch of 8 concurrent fetches, max 40 articles
  const cap = missing.slice(0, 40);
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '60', 10);
  const query = searchParams.get('q') || '';
  const trending = searchParams.get('trending') === 'true';

  // Check cache first
  const cachePath = path.join(process.cwd(), '.cache', 'articles.json');
  let articles: any[] = [];

  try {
    const cacheData = await fs.promises.readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(cacheData);
    const age = Date.now() - parsed.timestamp;

    if (age < CACHE_TTL * 1000) {
      articles = parsed.articles;
    }
  } catch {
    // No cache or expired, fetch fresh
  }

  // If no cache, fetch from all sources
  if (articles.length === 0) {
    const [rssArticles, hnArticles, redditDevOps, redditLinux, redditAI] = await Promise.all([
      fetchRSSFeeds(),
      fetchHackerNews(),
      fetchRedditPosts('devops', 'devops'),
      fetchRedditPosts('linux', 'linux'),
      fetchRedditPosts('ia', 'artificial'),
    ]);

    articles = [...rssArticles, ...hnArticles, ...redditDevOps, ...redditLinux, ...redditAI];

    // Calculate trending scores
    articles = calculateTrendingScores(articles);

    // Fetch og:image for articles missing a thumbnail
    articles = await enrichWithOgImages(articles);

    // Deduplicate by link
    const seen = new Set<string>();
    articles = articles.filter((a) => {
      const key = a.link;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Save to cache
    const cacheDir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    await fs.promises.writeFile(
      cachePath,
      JSON.stringify({ articles, timestamp: Date.now() })
    );
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