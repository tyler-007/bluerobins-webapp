import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

export async function GET(request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const channel_id = searchParams.get("id");
  const reader = searchParams.get("reader");

  if (!channel_id) {
    return NextResponse.json(
      { status: false, error: "Missing channel_id" },
      { status: 400 }
    );
  }

  // Fetch all messages for the channel
  const { data: messages, error } = await supabase
    .from("channel_messages")
    .select("*")
    .eq("channel_id", channel_id);

  if (error) {
    return NextResponse.json(
      { status: false, error: error.message },
      { status: 500 }
    );
  }

  // Call /messages/read to mark as read (fallback until frontend handles it directly)
  if (reader) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id,
          reader,
          // Send IDs of unread messages, or leave array empty so API does channel-wide update
          message_ids: messages
            ?.filter(m => m.from_user !== reader && m.read_by !== reader)
            .map(m => String(m.id)) || []
        }),
      });
    } catch (err) {
      console.error("Failed to call /messages/read:", err);
    }
  }

  return NextResponse.json({ status: true, data: messages });
}
