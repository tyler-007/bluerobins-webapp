import { NextRequest, NextResponse } from "next/server";
import { generateSessionPlan } from "@/lib/research-spark";
import type { GenerateSessionPlanOptions } from "@/lib/research-spark/types";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let project_description = "";
    let options: GenerateSessionPlanOptions | undefined = undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      project_description = String((body?.project_description ?? body?.description ?? "")).trim();
      options = body?.options as GenerateSessionPlanOptions | undefined;
    } else {
      // treat raw body as the description (text/plain or others)
      project_description = (await req.text()).trim();
    }

    if (!project_description) {
      return NextResponse.json({ error: "Missing project_description (string) in body or raw text." }, { status: 400 });
    }

    const finalPlan = await generateSessionPlan(project_description, options);
    return NextResponse.json({ finalPlan });
  } catch (e: any) {
    console.error("[research-spark] Error:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}



