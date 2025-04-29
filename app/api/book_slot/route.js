import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

export async function POST(request) {
  const supabase = await createClient();
  const req = await request.json();
  const { by_user, for_user, start_time, end_time } = req;
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("bookings")
    .insert({ by: user.user.id, for: for_user, start_time, end_time })
    .select();

  return NextResponse.json({
    status: true,
    message: "Slot booked successfully",
  });
}
