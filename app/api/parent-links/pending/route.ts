import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  // Fetch all pending parent-child links
  const { data: links, error } = await supabase
    .from("parent_student_links")
    .select("id, parent_id, student_id, created_at, parent:parent_id(id, name, email), student:student_id(id, parent_name, grade, institution_name)")
    .eq("approved", false);

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, pending: links });
} 