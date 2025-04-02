import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

export async function POST(request) {
  const supabase = await createClient();
  const req = await request.json();
  const { name } = req;
  if (!name)
    return NextResponse.json({ status: false, message: "Channel not found" });

  const { data: user } = await supabase.auth.getUser();
  console.log("user", user);

  const { data, error } = await supabase
    .from("channels")
    .select("id, name")
    .eq("name", name)
    .single();

  if (data) {
    return NextResponse.json({
      status: true,
      channel_id: data.id,
      name: data.name,
    });
  }

  // Check if user can create this channel
  const student = name?.split(":")[0]?.split("_")[1];
  const mentor = name?.split(":")[1]?.split("_")[1];

  console.log("STUDENT", student, mentor, user.user.id);
  if (!student || !mentor || student !== user.user.id) {
    return NextResponse.json({
      status: false,
      message: "You are not allowed to create this channel",
    });
  }

  const adminBase = createAdminClient();

  const { data: newData, error: newError } = await adminBase
    .from("channels")
    .insert({ name, type: "private" })
    .select("id, name")
    .single();

  const { error: memberError } = await adminBase
    .from("channel_members")
    .insert([
      { channel_id: newData.id, user_id: student },
      { channel_id: newData.id, user_id: mentor },
    ]);

  console.log("NEW DATA", newData, newError);
  console.log("MEMBER ERROR", memberError);

  return NextResponse.json({
    status: true,
    channel_id: newData.id,
    name: newData.name,
  });
}
