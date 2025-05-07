import { calendar_v3, calendar } from "@googleapis/calendar";

export async function createGoogleMeetLink(
  accessToken: string
): Promise<string> {
  try {
    const calendarClient = calendar({
      version: "v3",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Create a calendar event with Google Meet
    const event = await calendarClient.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: "Quick Meeting",
        start: {
          dateTime: new Date().toISOString(),
        },
        end: {
          dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        },
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      },
      conferenceDataVersion: 1,
    });

    // Extract the Meet link from the event
    const meetLink = event.data.conferenceData?.entryPoints?.[0]?.uri;

    if (!meetLink) {
      throw new Error("Failed to generate Meet link");
    }

    return meetLink;
  } catch (error) {
    console.error("Error creating Google Meet link:", error);
    throw error;
  }
}
