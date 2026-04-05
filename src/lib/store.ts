import { Redis } from "@upstash/redis";
import { Article, PipelineRun } from "./types";

const redis = new Redis({
  url: process.env.STORAGE_REDIS_URL || process.env.KV_REST_API_URL || "",
  token: process.env.STORAGE_REDIS_TOKEN || process.env.KV_REST_API_TOKEN || "",
});

const ARTICLES_KEY = "rcr:articles";
const SEEN_KEY = "rcr:seen";
const RUNS_KEY = "rcr:runs";
const MAX_ARTICLES = 20;
const EXPIRY_DAYS = 7;

export async function getArticles(): Promise<Article[]> {
  const articles: Article[] = (await redis.get(ARTICLES_KEY)) || [];
  return articles
    .filter((a) => {
      const age = Date.now() - new Date(a.fetchedAt).getTime();
      return age < EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, MAX_ARTICLES);
}

export async function getArticle(id: string): Promise<Article | null> {
  const articles = await getArticles();
  return articles.find((a) => a.id === id) || null;
}

export async function saveArticles(newArticles: Article[]): Promise<void> {
  const existing = await getArticles();
  const existingIds = new Set(existing.map((a) => a.id));
  const toAdd = newArticles.filter((a) => !existingIds.has(a.id));
  const merged = [...existing, ...toAdd]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, MAX_ARTICLES);
  await redis.set(ARTICLES_KEY, JSON.stringify(merged));
}

export async function updateArticle(
  id: string,
  updates: Partial<Article>
): Promise<Article | null> {
  const articles: Article[] = (await redis.get(ARTICLES_KEY)) || [];
  const idx = articles.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  articles[idx] = { ...articles[idx], ...updates };
  await redis.set(ARTICLES_KEY, JSON.stringify(articles));
  return articles[idx];
}

export async function dismissArticle(id: string): Promise<void> {
  const articles: Article[] = (await redis.get(ARTICLES_KEY)) || [];
  await redis.set(
    ARTICLES_KEY,
    JSON.stringify(articles.filter((a) => a.id !== id))
  );
}

export async function getSeenUrls(): Promise<Set<string>> {
  const seen: string[] = (await redis.get(SEEN_KEY)) || [];
  return new Set(seen);
}

export async function addSeenUrls(urls: string[]): Promise<void> {
  const seen: string[] = (await redis.get(SEEN_KEY)) || [];
  const merged = [...new Set([...seen, ...urls])].slice(-500);
  await redis.set(SEEN_KEY, JSON.stringify(merged));
}

export async function logRun(run: PipelineRun): Promise<void> {
  const runs: PipelineRun[] = (await redis.get(RUNS_KEY)) || [];
  runs.push(run);
  await redis.set(RUNS_KEY, JSON.stringify(runs.slice(-20)));
}

export async function getLastRun(): Promise<PipelineRun | null> {
  const runs: PipelineRun[] = (await redis.get(RUNS_KEY)) || [];
  return runs.length > 0 ? runs[runs.length - 1] : null;
}
