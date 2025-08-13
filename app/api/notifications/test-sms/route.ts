import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/notifications/sms";

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json();
    if (!to || !body) {
      return NextResponse.json({ success: false, error: "Missing 'to' or 'body'" }, { status: 400 });
    }
    const result = await sendSMS({ to, body });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
} 