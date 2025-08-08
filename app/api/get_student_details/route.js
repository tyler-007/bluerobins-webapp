import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const adminBase = createAdminClient();

  const { data, error } = await adminBase
    .from("student_profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  return NextResponse.json(data);
}
