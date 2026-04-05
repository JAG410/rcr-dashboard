import { fetchAllFeeds } from "./sources";
import { evaluateAndFormat } from "./processor";
import { getSeenUrls, addSeenUrls, saveArticles, logRun } from "./store";
import { Article, PipelineRun } from "./types";

const RELEVANCE_THRESHOLD = 7;

export async function runPipeline(): Promise<PipelineRun> {
  console.log("[pipeline] Starting article refresh...");

  // 1. Get seen URLs to avoid duplicates
  const seenUrls = await getSeenUrls();

  // 2. Fetch from all RSS feeds
  const rawArticles = await fetchAllFeeds(seenUrls);
  console.log(`[pipeline] Found ${rawArticles.length} new articles`);

  // Mark all as seen immediately
  await addSeenUrls(rawArticles.map((a) => a.url));

  // 3. Evaluate each through AI (process in batches of 5 to avoid rate limits)
  const candidates: Article[] = [];
  const batchSize = 5;

  for (let i = 0; i < rawArticles.length; i += batchSize) {
    const batch = rawArticles.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (raw) => {
        const result = await evaluateAndFormat(raw);
        if (!result) return null;
        if (!result.relevant || result.relevance_score < RELEVANCE_THRESHOLD) {
          console.log(
            `[pipeline] [${result.relevance_score}/10] SKIP: ${raw.title.slice(0, 50)}`
          );
          return null;
        }
        console.log(
          `[pipeline] [${result.relevance_score}/10] PASS: ${raw.title.slice(0, 50)}`
        );
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
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        candidates.push(r.value);
      }
    }
  }

  // 4. Save top candidates to KV store
  await saveArticles(candidates);

  const run: PipelineRun = {
    timestamp: new Date().toISOString(),
    articlesFound: rawArticles.length,
    articlesPassed: candidates.length,
    articlesStored: candidates.length,
  };
  await logRun(run);
  console.log(
    `[pipeline] Done. Found: ${run.articlesFound}, Passed: ${run.articlesPassed}`
  );
  return run;
}
