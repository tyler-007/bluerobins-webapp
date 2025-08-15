import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const adminBase = createAdminClient();
  const students = searchParams.get("studentId").split(",");

  const { data, error } = await adminBase
    .from("student_profiles")
    .select("id, timezone, ...profiles!projects_mentor_user_fkey(name, avatar)")
    .in("id", students);

  return NextResponse.json(data);
}
