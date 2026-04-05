import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticles, getLastRun } from "@/lib/store";
import { runPipeline } from "@/lib/pipeline";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [articles, lastRun] = await Promise.all([getArticles(), getLastRun()]);
  return NextResponse.json({ articles, lastRun });
}

// POST = manual refresh
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const run = await runPipeline();
  const articles = await getArticles();
  return NextResponse.json({ articles, run });
}
