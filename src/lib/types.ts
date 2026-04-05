export interface Article {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  published: string;
  fetchedAt: string;
  fullText: string;
  relevanceScore: number;
  relevanceReason: string;
  categories: string[];
  postTitle: string;
  postBody: string;
  postTags: string[];
  status: "pending" | "published" | "dismissed";
  publishedAt?: string;
  discourseTopicId?: number;
  discourseUrl?: string;
}

export interface PipelineRun {
  timestamp: string;
  articlesFound: number;
  articlesPassed: number;
  articlesStored: number;
}
