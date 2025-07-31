import { NextRequest, NextResponse } from "next/server";
import { notify } from "@/lib/notifications/orchestrator";
import { updateUserPreferences } from "@/lib/notifications/preferences";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, emailType, eventType, context } = body;

    if (action === 'set-preferences') {
      // Set user preferences
      const result = await updateUserPreferences(userId, {
        email_opt_in: body.email_opt_in,
        sms_opt_in: body.sms_opt_in,
        push_opt_in: body.push_opt_in,
      });
      
      return NextResponse.json(result);
    }

    if (action === 'test-notification') {
      // Test sending a notification with preference checking
      const result = await notify({
        eventType: eventType || 'random_project_recommendation',
        userId,
        context: context || {},
        emailType, // 'promotional' or 'transactional'
      });
      
      return NextResponse.json({
        success: true,
        result,
        message: `Test notification sent with emailType: ${emailType}`,
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action. Use "set-preferences" or "test-notification"' 
    });

  } catch (error) {
    console.error('[Test Preferences] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Notification Preferences Test Endpoint",
    usage: {
      "Set Preferences": {
        method: "POST",
        body: {
          action: "set-preferences",
          userId: "user-uuid",
          email_opt_in: true,
          sms_opt_in: false,
          push_opt_in: true
        }
      },
      "Test Notification": {
        method: "POST", 
        body: {
          action: "test-notification",
          userId: "user-uuid",
          emailType: "promotional", // or "transactional"
          eventType: "random_project_recommendation",
          context: {}
        }
      }
    }
  });
} 