"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAsCompleted(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId);

  if (error) {
    console.error("Error updating booking status:", error);
    return {
      success: false,
      error: "Failed to mark as completed.",
    };
  }

  revalidatePath("/home"); // Revalidate the home page to show the updated status

  return {
    success: true,
    data,
  };
}

export async function saveReview({
  bookingId,
  studentId,
  mentorId,
  rating,
  feedback,
}: {
  bookingId: string;
  studentId: string;
  mentorId: string;
  rating: number;
  feedback: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    student_id: studentId,
    mentor_id: mentorId,
    rating,
    feedback,
  });

  if (error) {
    console.error("Error saving review:", error);
    return {
      success: false,
      error: "Failed to save review.",
    };
  }

  return {
    success: true,
    data,
  };
} 