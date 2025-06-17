import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import dayjs from "dayjs";
import { createCalendarEvent } from "@/lib/actions";
export async function POST(request) {
  const supabase = await createClient();
  const req = await request.json();
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

  console.log("Mentor Details:", mentorDetails);

  let eventId, meetLink;
  try {
    const info = await createCalendarEvent({
      summary: title,
      description: description,
      location: "Virtual Meeting",
      startDateTime: dayjs(start_time).format("YYYY-MM-DDTHH:mm:ssZ"),
      endDateTime: dayjs(end_time).format("YYYY-MM-DDTHH:mm:ssZ"),
      attendees: [{ email: mentorDetails.email }, { email: user.user.email }],
      externalRecorderEmail: "tools@bluerobins.com",
    });
    eventId = info.eventId;
    meetLink = info.meetLink;
  } catch (error) {
    console.log("Error creating event:", error);
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      by: user.user.id,
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

  if (project_id) {
    const data = await supabase
      .from("projects")
      .select("filled_spots")
      .eq("id", project_id)
      .single();

    if (data) {
      await supabase
        .from("projects")
        .update({
          filled_spots: (data.filled_spots ?? 0) + 1,
        })
        .eq("id", project_id);

      if (projectError) {
        console.log("Error updating project:", projectError);
      }
    }
  }

  return NextResponse.json({
    status: true,
    message: "Slot booked successfully",
    data,
  });
}
