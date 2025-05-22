import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

export async function GET(request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const reader = searchParams.get("reader");
  const { data, error } = await supabase
    .from("channel_messages")
    .select("*")
    .eq("channel_id", id);

  console.log("reader", id, reader);
  if (reader) {
    const { data: updatedData, error: updateError } = await supabase
      .from("channel_messages")
      .update({ read_by: reader })
      .eq("channel_id", id) // .is("read_by", null)
      .neq("from_user", reader);

    console.error("Error updating read status:", updatedData, updateError);

    // return NextResponse.json({ status: true, data: updatedData });
  }

  return NextResponse.json({ status: true, data: data });
}
