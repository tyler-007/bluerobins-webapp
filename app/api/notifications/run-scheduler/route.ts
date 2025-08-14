import { NextRequest, NextResponse } from "next/server";
import { processScheduledNotifications } from "@/lib/notifications/scheduler";

export async function GET(request: NextRequest) {
  try {
    console.log("[Scheduler API] Starting notification processing...");

    // Process scheduled notifications (includes unread chat reminders)
    await processScheduledNotifications();

    console.log("[Scheduler API] Notification processing completed");

    return NextResponse.json({
      status: "success",
      message: "Notifications processed successfully",
    });
  } catch (error) {
    console.error("[Scheduler API] Error processing notifications:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
