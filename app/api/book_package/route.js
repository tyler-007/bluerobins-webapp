import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import dayjs from "dayjs";
import { createCalendarEvent } from "@/lib/actions";
export async function POST(request) {
  const supabase = await createClient();
  const req = await request.json();
  const {
    count,
    for_user,
    startDate,
    payment_id,
    package_id: project_id,
    details,
    title,
  } = req;
  const { data: user } = await supabase.auth.getUser();
  console.log("USER:", user);
  const by_user = req.by_user || user?.user?.id;
  console.log("BY_USER:", by_user);

  const projectData = await supabase
    .from("projects")
    .select("filled_spots, spots")
    .eq("id", project_id)
    .single();

  console.log("PROJECT DATA:", projectData, count);

  if (projectData.data.spots <= projectData.data.filled_spots) {
    console.log("No spots available");
    return NextResponse.json({
      status: false,
      message: "No spots available",
    });
  }

  if (projectData) {
    await supabase
      .from("projects")
      .update({
        filled_spots: (projectData.data.filled_spots ?? 0) + 1,
      })
      .eq("id", project_id);
  }

  //May be get mentor email
  const mentorDetails = await supabase
    .from("profiles")
    .select("email")
    .eq("id", for_user)
    .single();

  const studentDetails = await supabase
    .from("profiles")
    .select("email")
    .eq("id", by_user)
    .single();

  console.log("Mentor Details:", mentorDetails);
  let bookingData = [];
  for (let index = 0; index < count; index++) {
    console.log("PROCESSING INDEX:", index);
    const description = `Session ${index + 1} of ${count}`;
    const start_time = dayjs(startDate)
      .add(index, "week")
      .format("YYYY-MM-DDTHH:mm:ssZ");
    const end_time = dayjs(start_time)
      .add(1, "hour")
      .format("YYYY-MM-DDTHH:mm:ssZ");
    let eventId = "",
      meetLink = "";
    try {
      const info = await createCalendarEvent({
        summary: title,
        description: description,
        location: "Virtual Meeting",
        startDateTime: dayjs(start_time).format("YYYY-MM-DDTHH:mm:ssZ"),
        endDateTime: dayjs(end_time).format("YYYY-MM-DDTHH:mm:ssZ"),
        attendees: [
          { email: mentorDetails.data.email },
          { email: studentDetails.data.email },
        ],
        externalRecorderEmail: "tools@bluerobins.com",
      });
      if (info.error) throw info.error;
      eventId = info.eventId;
      meetLink = info.meetLink;
    } catch (error) {
      console.log("Error creating event:", error);
    }

    console.log("TRYING TO BOOK EVENT:", meetLink);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        by: by_user,
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
    bookingData.push(data);

    // Trigger notification scheduling for this session booking
    try {
      const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'session_booked',
          context: {
            userId: by_user,
            sessionTime: start_time,
            bookingId: data?.[0]?.id,
            courseDetails: { title, description },
            phoneNumber: studentDetails.data?.phone_number,
            email: studentDetails.data?.email,
          }
        })
      });
      const notifyJson = await notifyRes.json();
      console.log('[BookPackage] Notification trigger result:', notifyJson);
    } catch (notifyErr) {
      console.error('[BookPackage] Failed to trigger notification:', notifyErr);
    }
  }

  console.log("PROJECT_ID:", project_id);

  return NextResponse.json({
    status: true,
    message: "Slot booked successfully",
    data: bookingData,
  });
}
