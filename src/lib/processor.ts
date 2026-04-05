import Anthropic from "@anthropic-ai/sdk";
import { RawArticle } from "./sources";

const SYSTEM_PROMPT = `You are the content curator for Command Legacy, a professional online community (Discourse forum) built for police first-line supervisors — corporals, sergeants, and field training officers (FTOs).

Your job is to evaluate news articles and transform them into engaging forum posts for the "Roll Call Room" — a daily briefing space where officers start their day with relevant industry news.

AUDIENCE: Active-duty police supervisors who are practical, time-pressed, and value information that helps them lead, train, and stay current.

TONE: Professional but approachable. Think "experienced sergeant briefing the squad" — not academic, not clickbait.

RULES:
- Never provide legal advice or suggest tactical responses
- Keep posts informational and discussion-oriented
- Be respectful of law enforcement while encouraging thoughtful dialogue`;

interface EvalResult {
  relevant: boolean;
  relevance_score: number;
  reason: string;
  categories: string[];
  post_title: string;
  post_body: string;
  post_tags: string[];
}

export async function evaluateAndFormat(article: RawArticle): Promise<EvalResult | null> {
  const client = new Anthropic();

  const prompt = `Evaluate this article for the Roll Call Room AND format it as a post if relevant.

**Title:** ${article.title}
**Source:** ${article.source}
**Summary:** ${article.summary}

Respond with EXACTLY this JSON (no markdown fencing):
{
  "relevant": true/false,
  "relevance_score": 1-10,
  "reason": "one sentence why this is/isn't relevant for patrol supervisors",
  "categories": ["tag1", "tag2"],
  "post_title": "Reframed title for supervisor audience (or empty if not relevant)",
  "post_body": "Full markdown post body with: opening hook, 3-5 bullet key takeaways, discussion prompt, source link (or empty if not relevant)",
  "post_tags": ["tag1", "tag2"]
}

Score 7+ = post-worthy. Consider: use of force, legal updates, officer wellness, leadership, technology, training, community policing, staffing, policy changes.

Reject: heavy political bias, clickbait, celebrity gossip, content that could compromise officer safety.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: "text"; text: string }).text.trim();
    const cleaned = text.startsWith("```")
      ? text.split("\n").slice(1).join("\n").replace(/```$/, "").trim()
      : text;
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(`[processor] Failed for: ${article.title}`, e);
    return null;
  }
}
