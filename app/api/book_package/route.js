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

  const parentEmail = await supabase
    .from("student_profiles")
    .select("parent_email")
    .eq("id", by_user)
    .single();

  let bookingData = [];

  // Get existing eventId for project
  const existingEvent = await supabase
    .from("bookings")
    .select("event_id, event_link")
    .eq("project_id", project_id)
    .single();

  console.log("EXISTING EVENT:", existingEvent);

  for (let index = 0; index < count; index++) {
    const description = `Session ${index + 1} of ${count}`;
    const start_time = dayjs(startDate)
      .add(index, "week")
      .format("YYYY-MM-DDTHH:mm:ssZ");
    const end_time = dayjs(start_time)
      .add(1, "hour")
      .format("YYYY-MM-DDTHH:mm:ssZ");

    let eventId = existingEvent?.data?.event_id ?? "",
      meetLink = existingEvent?.data?.event_link ?? "";
    if (eventId) {
      console.log("EVENT ID EXISTS:", eventId);
      const attendees = [
        { email: studentDetails.data.email },
        { email: parentEmail.data.parent_email },
      ];
      const info = await addAttendeesToEvent({
        eventId,
        attendees,
      });
      console.log("INFO:", info);
      //add attendees to existing event
    } else {
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
            { email: parentEmail.data.parent_email },
          ],
          externalRecorderEmail: "tools@bluerobins.com",
        });
        if (info.error) throw info.error;
        eventId = info.eventId;
        meetLink = info.meetLink;
      } catch (error) {
        console.log("Error creating event:", error);
      }
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
  }

  return NextResponse.json({
    status: true,
    message: "Slot booked successfully",
    data: bookingData,
  });
}
