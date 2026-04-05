import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

// Vercel Cron calls this route daily
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await runPipeline();
  return NextResponse.json({ success: true, run });
}
