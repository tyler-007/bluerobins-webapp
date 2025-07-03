import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Mark a booking as completed
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { bookingId } = body;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId);

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to mark as completed." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

// Save a review for a booking
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { bookingId, studentId, mentorId, rating, feedback } = body;
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    student_id: studentId,
    mentor_id: mentorId,
    rating,
    feedback,
  });

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to save review." }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
} 