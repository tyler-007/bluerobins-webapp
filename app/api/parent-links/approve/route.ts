import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { parent_id, student_id } = body;

  if (!parent_id || !student_id) {
    return NextResponse.json({ success: false, message: "Missing parent_id or student_id" }, { status: 400 });
  }
  const { error } = await supabase
    .from("parent_student_links")
    .update({ approved: true })
    .eq("parent_id", parent_id)
    .eq("student_id", student_id);

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: "Link approved." });
} 