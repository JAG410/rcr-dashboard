import Parser from "rss-parser";
import crypto from "crypto";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "CommandLegacy-RCR/1.0" },
});

export interface RawArticle {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  published: string;
}

const RSS_FEEDS = [
  { name: "Police1", url: "https://www.police1.com/rss/" },
  { name: "Officer.com", url: "https://www.officer.com/rss" },
  { name: "PoliceChief Magazine", url: "https://www.policechiefmagazine.org/feed/" },
  { name: "Force Science", url: "https://www.forcescience.com/feed/" },
  { name: "Police Magazine", url: "https://www.policemag.com/rss" },
  { name: "Law Enforcement Today", url: "https://www.lawenforcementtoday.com/feed/" },
  { name: "The Marshall Project", url: "https://www.themarshallproject.org/rss/all" },
  { name: "IACP Blog", url: "https://www.theiacp.org/sites/default/files/RSS/IACPBlog.xml" },
];

function makeId(url: string): string {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 12);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

export async function fetchAllFeeds(
  seenUrls: Set<string>,
  maxPerFeed = 10
): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        const items: RawArticle[] = [];
        for (const entry of (parsed.items || []).slice(0, maxPerFeed)) {
          const url = entry.link || "";
          if (!url || seenUrls.has(url)) continue;
          const title = (entry.title || "").trim();
          if (!title) continue;
          items.push({
            id: makeId(url),
            title,
            url,
            summary: stripHtml(entry.contentSnippet || entry.content || ""),
            source: feed.name,
            published: entry.pubDate || entry.isoDate || "",
          });
        }
        return items;
      } catch {
        console.error(`[sources] Error fetching ${feed.name}`);
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  return articles;
}
