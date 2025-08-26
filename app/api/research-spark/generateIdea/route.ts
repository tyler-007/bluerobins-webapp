import { NextRequest, NextResponse } from "next/server";
import { generateIdeas } from "@/lib/research-spark";
import type { Brief } from "@/lib/research-spark/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brief, mentor_bio } = body as { brief?: Brief; mentor_bio?: string[] };

    if (!brief || !mentor_bio) {
      return NextResponse.json({ error: "Missing brief or mentor_bio" }, { status: 400 });
    }

    const results = await generateIdeas(brief, mentor_bio);
    return NextResponse.json({ results });
  } catch (e: any) {
    console.error("[research-spark] Error:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}


