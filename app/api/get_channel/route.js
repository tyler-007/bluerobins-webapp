import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

export async function POST(request) {
  const supabase = createClient();
  const req = await request.json();
  const { id, name, student_id, mentor_id } = req;
  if (id)
    return NextResponse.json({
      status: true,
      channel_id: id,
    });
  if (!!name) {
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
    return NextResponse.json({ status: false, message: "Channel not found" });
  }

  if (!!student_id && !!mentor_id) {
    const { data, error } = await supabase
      .from("channels")
      .select("id, name")
      .eq("student_id", student_id)
      .eq("mentor_id", mentor_id)
      .single();
    if (data) {
      return NextResponse.json({
        status: true,
        channel_id: data.id,
        name: data.name,
      });
    } else {
      const { data, error } = await supabase
        .from("channels")
        .insert({ name: `${student_id}:${mentor_id}`, student_id, mentor_id })
        .select("id, name")
        .single();
      return NextResponse.json({
        status: true,
        channel_id: data.id,
        name: data.name,
      });
    }
  }

  return NextResponse.json({ status: false, message: "Channel not found" });
}
