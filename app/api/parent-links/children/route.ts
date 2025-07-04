import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const parent_id = searchParams.get("parent_id");
  if (!parent_id) {
    return NextResponse.json({ success: false, message: "Missing parent_id" }, { status: 400 });
  }
  // Get all approved children for this parent
  const { data: links, error } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", parent_id)
    .eq("approved", true);
  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  const studentIds = (links || []).map((l: any) => l.student_id);
  if (studentIds.length === 0) {
    return NextResponse.json({ success: true, children: [] });
  }
  // Fetch child profile data
  const { data: students, error: studentError } = await supabase
    .from("student_profiles")
    .select("id, grade, institution_name, parent_name")
    .in("id", studentIds);
  if (studentError) {
    return NextResponse.json({ success: false, message: studentError.message }, { status: 500 });
  }
  // Optionally, fetch names from profiles table
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", studentIds);
  const nameMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => {
    nameMap[p.id] = p.name || "(No Name)";
  });
  const children = (students || []).map((s: any) => ({ ...s, name: nameMap[s.id] || "(No Name)" }));
  return NextResponse.json({ success: true, children });
} 