export interface DiscourseResult {
  topicId: number;
  topicSlug: string;
  url: string;
}

export async function publishToDiscourse(
  title: string,
  body: string,
  tags: string[]
): Promise<DiscourseResult> {
  const baseUrl = process.env.DISCOURSE_URL?.replace(/\/$/, "");
  const apiKey = process.env.DISCOURSE_API_KEY;
  const username = process.env.DISCOURSE_API_USERNAME || "system";
  const categoryId = parseInt(process.env.DISCOURSE_CATEGORY_ID || "1", 10);

  if (!baseUrl || !apiKey) {
    throw new Error("DISCOURSE_URL and DISCOURSE_API_KEY must be configured");
  }

  const resp = await fetch(`${baseUrl}/posts.json`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Api-Username": username,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      raw: body,
      category: categoryId,
      tags: tags.slice(0, 5),
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Discourse API error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  return {
    topicId: data.topic_id,
    topicSlug: data.topic_slug,
    url: `${baseUrl}/t/${data.topic_slug}/${data.topic_id}`,
  };
}
