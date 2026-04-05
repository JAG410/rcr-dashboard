import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticles, getLastRun } from "@/lib/store";
import { runPipeline } from "@/lib/pipeline";

// Vercel Hobby plan max is 60s for serverless functions
export const maxDuration = 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [articles, lastRun] = await Promise.all([getArticles(), getLastRun()]);
    return NextResponse.json({ articles, lastRun });
  } catch (e) {
    console.error("[api/articles] GET error:", e);
    return NextResponse.json({ articles: [], lastRun: null });
  }
}

// POST = manual refresh
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const run = await runPipeline();
    const articles = await getArticles();
    return NextResponse.json({ articles, run });
  } catch (e) {
    console.error("[api/articles] POST error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message, articles: [] }, { status: 500 });
  }
}
