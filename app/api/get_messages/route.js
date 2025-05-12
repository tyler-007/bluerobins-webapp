import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

export async function GET(request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const { data, error } = await supabase
    .from("channel_messages")
    .select("*")
    .eq("channel_id", id);

  return NextResponse.json({ status: true, data: data });
}
