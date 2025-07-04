import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const student_id = searchParams.get("student_id");
  if (!student_id) {
    return NextResponse.json({ success: false, message: "Missing student_id" }, { status: 400 });
  }

  // Fetch bookings for progress
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("project_id, status, projects(title)")
    .eq("by", student_id);
  if (bookingsError) {
    return NextResponse.json({ success: false, message: bookingsError.message }, { status: 500 });
  }
  // Group progress by project
  const progressByProject: any = {};
  (bookings || []).forEach((booking: any) => {
    if (!booking.project_id) return;
    if (!progressByProject[booking.project_id]) {
      progressByProject[booking.project_id] = { completed: 0, total: 0, title: booking.projects?.title || "" };
    }
    progressByProject[booking.project_id].total++;
    if (booking.status === "completed") {
      progressByProject[booking.project_id].completed++;
    }
  });

  // Fetch notes for weekly logs
  const { data: notes, error: notesError } = await supabase
    .from("project_notes")
    .select("*")
    .eq("student_id", student_id)
    .in("visibility", ["shared", "mentor_only"]);
  if (notesError) {
    return NextResponse.json({ success: false, message: notesError.message }, { status: 500 });
  }
  // Group notes by week
  const weeklyLogs: any = {};
  (notes || []).forEach((note: any) => {
    if (!weeklyLogs[note.week_number]) weeklyLogs[note.week_number] = [];
    weeklyLogs[note.week_number].push({
      author_type: note.author_type,
      note_text: note.note_text,
      created_at: note.created_at,
    });
  });

  // Fetch reviews for session feedback
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*, bookings(title)")
    .eq("student_id", student_id);
  if (reviewsError) {
    return NextResponse.json({ success: false, message: reviewsError.message }, { status: 500 });
  }
  const sessionFeedback = (reviews || []).map((review: any) => ({
    rating: review.rating,
    feedback: review.feedback,
    title: review.bookings?.title || "Session Review",
    created_at: review.created_at,
  }));

  return NextResponse.json({
    success: true,
    progress: progressByProject,
    weeklyLogs,
    sessionFeedback,
  });
} 