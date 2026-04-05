import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticle, updateArticle } from "@/lib/store";
import { publishToDiscourse } from "@/lib/discourse";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (article.status === "published") {
    return NextResponse.json({ error: "Already published" }, { status: 400 });
  }

  try {
    const result = await publishToDiscourse(
      article.postTitle,
      article.postBody,
      article.postTags
    );

    const updated = await updateArticle(id, {
      status: "published",
      publishedAt: new Date().toISOString(),
      discourseTopicId: result.topicId,
      discourseUrl: result.url,
    });

    return NextResponse.json({ success: true, article: updated, discourse: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
