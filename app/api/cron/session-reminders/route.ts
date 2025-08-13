import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notify } from "@/lib/notifications/orchestrator";

export async function GET() {
  const supabase = createAdminClient();
  const now = new Date();

  // Fetch all upcoming bookings
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, by, title, start_time")
    .gte("start_time", now.toISOString());

  if (error) {
    console.error("Error fetching bookings for cron job:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }

  if (!bookings) {
    return NextResponse.json({ success: true, message: "No upcoming bookings." });
  }

  // Process each booking
  for (const booking of bookings) {
    const sessionTime = new Date(booking.start_time);
    const timeDiff = sessionTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Only process bookings within the next 24 hours
    if (hoursDiff <= 0 || hoursDiff > 24) {
      continue;
    }

    // Generate notification ranges every 30 minutes up to 24 hours
    const notificationRanges = Array.from(
      { length: 48 },
      (_, i) => (i + 1) * 0.5
    );

    for (const hours of notificationRanges) {
      if (hoursDiff <= hours) {
        // We've found the right notification window
        const message = `Your class for '${
          booking.title
        }' is starting in about ${hours} hours.`;

        await notify({
          eventType: "session_reminder",
          userId: booking.by,
          context: {
            message,
            bookingId: booking.id,
          },
        });

        break; // Stop checking other ranges for this booking
      }
    }
  }

  return NextResponse.json({ success: true, message: "Session reminders processed." });
} 