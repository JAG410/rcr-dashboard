import { fetchAllFeeds } from "./sources";
import { evaluateAndFormat } from "./processor";
import { getSeenUrls, addSeenUrls, saveArticles, logRun } from "./store";
import { Article, PipelineRun } from "./types";

const RELEVANCE_THRESHOLD = 7;
// Process only a small batch per run to stay within Vercel's timeout
const MAX_TO_EVALUATE = 5;

export async function runPipeline(): Promise<PipelineRun> {
  console.log("[pipeline] Starting article refresh...");

  // 1. Get seen URLs to avoid duplicates
  let seenUrls: Set<string>;
  try {
    seenUrls = await getSeenUrls();
  } catch (e) {
    console.error("[pipeline] Failed to get seen URLs, starting fresh:", e);
    seenUrls = new Set();
  }

  // 2. Fetch from all RSS feeds
  const rawArticles = await fetchAllFeeds(seenUrls);
  console.log(`[pipeline] Found ${rawArticles.length} new articles`);

  if (rawArticles.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      articlesFound: 0,
      articlesPassed: 0,
      articlesStored: 0,
    };
  }

  // Mark all as seen immediately
  try {
    await addSeenUrls(rawArticles.map((a) => a.url));
  } catch (e) {
    console.error("[pipeline] Failed to save seen URLs:", e);
  }

  // 3. Only evaluate a small batch to stay within timeout
  const toEvaluate = rawArticles.slice(0, MAX_TO_EVALUATE);
  console.log(`[pipeline] Evaluating ${toEvaluate.length} of ${rawArticles.length} articles`);

  const candidates: Article[] = [];

  // Process all at once (small batch)
  const results = await Promise.allSettled(
    toEvaluate.map(async (raw) => {
      try {
        const result = await evaluateAndFormat(raw);
        if (!result) return null;
        if (!result.relevant || result.relevance_score < RELEVANCE_THRESHOLD) {
          console.log(`[pipeline] [${result.relevance_score}/10] SKIP: ${raw.title.slice(0, 50)}`);
          return null;
        }
        console.log(`[pipeline] [${result.relevance_score}/10] PASS: ${raw.title.slice(0, 50)}`);
        const article: Article = {
          id: raw.id,
          title: raw.title,
          url: raw.url,
          summary: raw.summary,
          source: raw.source,
          published: raw.published,
          fetchedAt: new Date().toISOString(),
          fullText: "",
          relevanceScore: result.relevance_score,
          relevanceReason: result.reason,
          categories: result.categories,
          postTitle: result.post_title,
          postBody: result.post_body,
          postTags: result.post_tags,
          status: "pending",
        };
        return article;
      } catch (e) {
        console.error(`[pipeline] Error evaluating "${raw.title}":`, e);
        return null;
      }
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      candidates.push(r.value);
    }
  }

  // 4. Save to store
  if (candidates.length > 0) {
    await saveArticles(candidates);
  }

  const run: PipelineRun = {
    timestamp: new Date().toISOString(),
    articlesFound: rawArticles.length,
    articlesPassed: candidates.length,
    articlesStored: candidates.length,
  };

  try {
    await logRun(run);
  } catch (e) {
    console.error("[pipeline] Failed to log run:", e);
  }

  console.log(`[pipeline] Done. Found: ${run.articlesFound}, Passed: ${run.articlesPassed}`);
  return run;
}
