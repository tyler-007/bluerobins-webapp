import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

export async function POST(request) {
  const supabase = await createClient();
  const req = await request.json();
  const { identifier } = req;
  if (!identifier)
    return NextResponse.json({ status: false, message: "Channel not found" });

  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("channels")
    .select("id, identifier")
    .eq("identifier", identifier)
    .single();

  if (data) {
    return NextResponse.json({
      status: true,
      channel_id: data.id,
      identifier: data.identifier,
    });
  }

  // Check if user can create this channel
  const student = identifier?.split(":")[0]?.split("_")[1];
  const mentor = identifier?.split(":")[1]?.split("_")[1];

  if (!student || !mentor || student !== user.user.id) {
    return NextResponse.json({
      status: false,
      message: "You are not allowed to create this channel",
    });
  }

  const adminBase = createAdminClient();

  const { data: newData, error: newError } = await adminBase
    .from("channels")
    .upsert({ identifier, type: "private" }, { onConflict: "identifier" })
    .select("id, identifier")
    .single();

  if (newError && newError.code !== "23505") {
    console.error("Error inserting channel:", newError);
    return NextResponse.json({
      status: false,
      message: "Error creating channel",
    });
  }

  const { error: memberError } = await adminBase
    .from("channel_members")
    .insert([
      { channel_id: newData.id, user_id: student },
      { channel_id: newData.id, user_id: mentor },
    ]);

  if (memberError && memberError.code !== "23505") {
    // console.error("Error inserting channel members:", memberError);
  }

  return NextResponse.json({
    status: true,
    channel_id: newData.id,
    identifier: newData.identifier,
    name: newData.name,
  });
}
