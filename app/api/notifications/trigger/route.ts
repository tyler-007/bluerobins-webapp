import { NextRequest, NextResponse } from "next/server";
import { notify } from "@/lib/notifications/orchestrator";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[API] /api/notifications/trigger body:", body);
  try {
    const notifyResult = await notify(body);
    console.log("[API] notify result:", notifyResult);
    return NextResponse.json({ success: true, notifyResult });
  } catch (error) {
    console.error("[API] notify error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
} 