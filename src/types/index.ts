export interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category: Category;
  source: string;
  imageUrl?: string;
  author?: string;
  contentSnippet?: string;
  isTrending?: boolean;
  score?: number;
}

export type Category = 'ia' | 'devops' | 'linux' | 'windows' | 'infrastructure' | 'cybersecurite' | 'all';

export interface FeedConfig {
  name: string;
  url: string;
  category: Exclude<Category, 'all'>;
  enabled?: boolean;
}