import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request) {
  const supabase = await createClient();

  const { type, timezone } = await request.json();

  const { data: user } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //May be get mentor email
  const key = type === "mentor" ? "mentor_profiles" : "student_profiles";

  await supabase.from(key).update({ timezone }).eq("id", user.user.id).select();
  return NextResponse.json({ message: "Timezone updated" });
}
