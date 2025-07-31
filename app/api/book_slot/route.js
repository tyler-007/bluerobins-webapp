import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import dayjs from "dayjs";
import { createCalendarEvent } from "@/lib/actions";
export async function POST(request) {
  const supabase = await createClient();
  
  // Log request details for debugging
  console.log('Book slot API called');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  console.log('Request method:', request.method);
  
  // Handle empty or malformed request body
  let req;
  try {
    const bodyText = await request.text();
    console.log('Request body text:', bodyText);
    
    if (!bodyText || bodyText.trim() === '') {
      console.log('Empty request body received - likely a test request, ignoring');
      return NextResponse.json(
        {
          status: false,
          message: "Empty request body received",
        },
        { status: 400 }
      );
    }
    
    req = JSON.parse(bodyText);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json(
      {
        status: false,
        message: "Invalid request body - JSON parsing failed",
        error: error.message,
      },
      { status: 400 }
    );
  }
  
  // Validate required fields
  if (!req || typeof req !== 'object') {
    console.error('Invalid request object:', req);
    return NextResponse.json(
      {
        status: false,
        message: "Invalid request body - must be a valid JSON object",
      },
      { status: 400 }
    );
  }
  
  const {
    for_user,
    start_time,
    end_time,
    payment_id,
    project_id,
    details,
    title,
    description,
  } = req;
  const { data: user } = await supabase.auth.getUser();

  //May be get mentor email
  const mentorDetails = await supabase
    .from("profiles")
    .select("email")
    .eq("id", for_user)
    .single();

  // Only fallback for Google Calendar event creation
  // --- USER AUTHENTICATION & DEV FALLBACK DESIGN ---
  // 1. Try to get user from Supabase session (normal production flow)
  // 2. If not present (e.g. curl/local dev), use a hardcoded fallback user (DEV ONLY!)
  // 3. This allows local/manual/curl testing without auth, but should be removed in production
  let userId = user?.user?.id;
  let userEmail = user?.user?.email;
  if (!userId) {
    // #### DEV FALLBACK: Use a real UUID and email from your DB for local/curl testing only
    userId = "3afc3971-a83f-422e-9ee7-f3bc8f2bd208"; // <-- Replace with a real UUID from your DB
    userEmail = "mailtojainaayush@gmail.com";
    // #### END DEV FALLBACK
  }
  // --- END USER AUTHENTICATION & DEV FALLBACK DESIGN ---

  console.log("Mentor Details:", mentorDetails);

  let eventId, meetLink;
  try {
    const info = await createCalendarEvent({
      summary: title,
      description: description,
      location: "Virtual Meeting",
      startDateTime: dayjs(start_time).format("YYYY-MM-DDTHH:mm:ssZ"),
      endDateTime: dayjs(end_time).format("YYYY-MM-DDTHH:mm:ssZ"),
      attendees: [
        { email: mentorDetails.data?.email },
        { email: userEmail },
      ],
      externalRecorderEmail: "tools@bluerobins.com",
    });
    eventId = info.eventId;
    meetLink = info.meetLink;
  } catch (error) {
    console.log("Error creating event (fallback to booking only):", error);
    eventId = null;
    meetLink = null;
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      by: userId,
      for: for_user,
      start_time,
      end_time,
      payment_id,
      project_id,
      payment_status: "confirmed",
      payment_details: details,
      event_id: eventId,
      event_link: meetLink,
      title: title,
      description: description,
    })
    .select();

  if (error) {
    return NextResponse.json(
      {
        status: false,
        message: "Failed to book slot",
        error: error.message,
      },
      { status: 400 }
    );
  }

  // Trigger notification scheduling for this booking
  try {
    // Use the same userId and userEmail as above (with fallback)
    const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'session_booked',
        context: {
          userId: userId, // use fallback if needed
          sessionTime: start_time,
          bookingId: data?.[0]?.id,
          courseDetails: { title, description },
          phoneNumber: req.phone_number || null, // fallback if available
          email: userEmail,
        }
      })
    });
    const notifyJson = await notifyRes.json();
    console.log('[Booking] Notification trigger result:', notifyJson);
  } catch (notifyErr) {
    console.error('[Booking] Failed to trigger notification:', notifyErr);
  }

  if (project_id) {
    const projectData = await supabase
      .from("projects")
      .select("filled_spots")
      .eq("id", project_id)
      .single();

    if (projectData) {
      const updateRes = await supabase
        .from("projects")
        .update({
          filled_spots: (projectData.data?.filled_spots ?? 0) + 1,
        })
        .eq("id", project_id);
      if (updateRes.error) {
        console.log("Error updating project:", updateRes.error);
      }
    }
  }

  return NextResponse.json({
    status: true,
    message: "Slot booked successfully",
    data,
  });
}
