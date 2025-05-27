"use server";

import { google } from "googleapis";
import { JWT } from "google-auth-library";

type EventInput = {
  summary: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  attendees: { email: string }[];
  host?: string;
  externalRecorder?: string;
};

type EventResult = {
  success: boolean;
  eventId?: string | null;
  error?: string;
  meetLink?: string;
};

export async function createCalendarEvent(
  eventData: EventInput
): Promise<EventResult> {
  try {
    console.log("Creating calendar event");
    // Parse the service account credentials from environment variable
    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "{}"
    );

    console.log("Credentials:", credentials.delegated_email);

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error("Invalid service account credentials");
    }

    // The host will be either specified host, delegated email, or service account email
    const hostEmail = credentials.delegated_email || credentials.client_email;

    // Create a JWT client using the service account impersonating the host
    const jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
      subject: hostEmail, // Impersonate the host
    });
    console.log("JWT");

    console.log("About to authorize jwtClient");
    // Authorize the client
    await jwtClient.authorize();

    // Create a Google Calendar API client
    console.log("About to initialize calendar");
    const calendar = google.calendar({ version: "v3", auth: jwtClient });
    // console.log("Calendar:", calendar);

    // Generate special instructions for the external recorder if specified
    const externalRecorderEmail = eventData.externalRecorder?.trim();
    let recorderInstructions = "";

    if (externalRecorderEmail) {
      console.log("EREEEEE");
      // Create instructions for the external recorder
      recorderInstructions = `
SPECIAL INSTRUCTIONS FOR RECORDING (for ${externalRecorderEmail}):
1. The meeting host will not join, but you need to record the meeting
2. Join using the Google Meet link in the calendar invitation
3. As soon as you join, click "Ask to present" (screen icon at bottom)
4. Once presenting, you'll have access to "More options" (three dots)
5. Click on "Record meeting" to start recording
6. For backup, consider using screen recording software

NOTE: All recordings will be saved to the host's Google Drive, not yours.
`;
    }

    // Prepare the event data with the description (we'll add the Meet link later)
    const initialDescription = `
${eventData.description || ""}
${recorderInstructions}
    `.trim();

    // Filter out any invalid attendees (empty emails)
    const validAttendees = eventData.attendees.filter(
      (attendee) =>
        attendee.email &&
        attendee.email.trim() !== "" &&
        attendee.email.includes("@")
    );

    // Prepare the event data
    const event = {
      summary: eventData.summary,
      location: eventData.location || "",
      description: initialDescription,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: "UTC",
      },
      attendees: validAttendees.length > 0 ? validAttendees : undefined,

      addConference: true,
      hideAttendees: true,
      // CRITICAL: Hide attendee emails from each other - set explicitly to false
      guestsCanSeeOtherGuests: false,
      // Configure the most permissive meeting settings
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      // Critical settings for meeting access
      guestsCanModify: true, // Allow guests to modify event
      guestsCanInviteOthers: true, // Allow guests to invite others
      // Add transparency setting to ensure privacy
      //   transparency: "private",
      // Add email reminders for 1 day before and 15 minutes before
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "email", minutes: 15 }, // 15 minutes before
        ],
      },
    };

    console.log("About to insert event:", event);
    // Insert the event into the calendar
    const response = await calendar.events.insert({
      calendarId: "primary", // Use 'primary' for the primary calendar of the authenticated user
      requestBody: event,
      sendUpdates: "none", // Don't send notifications yet - we'll update the description first
      conferenceDataVersion: 1, // Enable conference data creation
      //   supportsAttachments: true,
    });

    let meetLink = "";

    // Get the Google Meet link from the created event
    if (response.data.conferenceData?.conferenceId) {
      meetLink =
        response.data.conferenceData.entryPoints?.find(
          (ep: any) => ep.entryPointType === "video"
        )?.uri || "";
    }

    // If we have a Meet link, update the event description to include it
    if (meetLink && response.data.id) {
      try {
        // Create an enhanced description with the Meet link
        const enhancedDescription = `
${initialDescription}

---
Join with Google Meet: ${meetLink}
        `.trim();

        console.log("About to patch event:");
        // Update the event with the enhanced description and conference settings
        // IMPORTANT: Explicitly set guestsCanSeeOtherGuests to false again
        await calendar?.events?.patch?.({
          calendarId: "primary",
          eventId: response.data.id,
          requestBody: {
            description: enhancedDescription,
            guestsCanSeeOtherGuests: false, // Explicitly set again to ensure it takes effect
            conferenceData: {
              conferenceId: response.data.conferenceData?.conferenceId,
              // Configure the most permissive conference settings
              // conferenceProperties: {
              //   allowedConferenceSolutionTypes: ["hangoutsMeet"],
              //   allowExternalInvitees: true,
              //   autoCreateMeetingEnabled: true,
              //   createMeetingWithoutHost: true,
              // },
            },
          },
          conferenceDataVersion: 1,
          sendUpdates: "none", // Still don't send updates yet
        });

        console.log("About to patch event 2 :");
        // Now make a final update with ONLY the privacy setting to ensure it's applied
        await calendar.events.patch({
          calendarId: "primary",
          eventId: response.data.id,
          requestBody: {
            guestsCanSeeOtherGuests: false, // Set one more time to be absolutely sure
          },
          sendUpdates: "all", // Now send the notifications with everything set
        });
      } catch (updateError) {
        console.error("Error updating event with Meet link:", updateError);
        // Continue even if this fails, as the Meet link will still be in the calendar event
      }
    } else {
      // If we couldn't get the Meet link, send the notifications for the original event
      // but make sure to set guestsCanSeeOtherGuests to false again
      console.log("About to patch event3:");
      try {
        await calendar.events.patch({
          calendarId: "primary",
          eventId: response.data.id!,
          requestBody: {
            guestsCanSeeOtherGuests: false, // Explicitly set again
          },
          sendUpdates: "all",
        });
      } catch (sendError) {
        console.error("Error sending notifications:", sendError);
      }
    }

    return {
      success: true,
      eventId: response.data.id,
      meetLink: meetLink,
    };
  } catch (error) {
    console.error(
      "Error creating calendar event:",
      JSON.stringify(error, null, 2),
      error
    );
    // Provide more detailed error information
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific Google API errors
      const googleError = (error as any).response?.data?.error;
      if (googleError) {
        errorMessage = `Google API Error: ${googleError.message || googleError.status}`;

        // Log detailed error for debugging
        console.error(
          "Detailed Google API Error:",
          JSON.stringify(googleError, null, 2)
        );
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
