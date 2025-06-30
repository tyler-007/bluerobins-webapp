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

type EventUpdateInput = {
  eventId: string;
  startDateTime: string;
  endDateTime: string;
  host?: string;
};

// Add utility function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Add retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<T> {
  let retries = 0;
  let currentDelay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} retries:`, error);
        throw error;
      }

      // Check if it's a quota exceeded error
      const isQuotaError = error?.response?.data?.error?.errors?.some(
        (e: any) => e.reason === "quotaExceeded"
      );

      if (isQuotaError) {
        console.log(
          `Quota exceeded (attempt ${retries + 1}/${maxRetries}), retrying in ${currentDelay}ms...`
        );
        await delay(currentDelay);
        currentDelay *= 2; // Exponential backoff
        retries++;
      } else {
        throw error;
      }
    }
  }
}

function isValidISODateTime(dateTime: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  return isoRegex.test(dateTime);
}

export async function createCalendarEvent(
  eventData: EventInput
): Promise<EventResult> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    console.warn(
      "Google service account credentials not found. Skipping calendar event creation."
    );
    return {
      success: true,
      eventId: null,
      meetLink: "",
    };
  }

  try {
    console.log("Creating calendar event");
    // Parse the service account credentials from environment variable
    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "{}"
    );

    console.log("Service Account Email:", credentials.client_email);
    console.log("Delegated Email:", credentials.delegated_email);
    console.log("Project ID:", credentials.project_id);

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error("Invalid service account credentials");
    }

    // The host will be either specified host, delegated email, or service account email
    const hostEmail = credentials.delegated_email || credentials.client_email;
    console.log("Using host email:", hostEmail);

    // Create a JWT client using the service account impersonating the host
    const jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
      subject: hostEmail, // Impersonate the host
    });

    console.log("About to authorize jwtClient");
    try {
      // Authorize the client
      const auth = await jwtClient.authorize();
      console.log("JWT Authorization successful");
    } catch (authError: any) {
      console.error("JWT Authorization failed:", {
        error: authError.message,
        code: authError.code,
        status: authError.status,
        details: authError.response?.data,
      });
      throw authError;
    }

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
      guestsCanSeeOtherGuests: false,
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      guestsCanModify: true,
      guestsCanInviteOthers: true,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "email", minutes: 15 },
        ],
      },
    };

    console.log("About to insert event");
    // Single API call to create the event with all settings
    try {
      const response = await retryWithBackoff(async () => {
        return await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
          sendUpdates: "all",
          conferenceDataVersion: 1,
        });
      });
      console.log("Event created successfully:", response.data.id);

      let meetLink = "";
      if (response.data.conferenceData?.conferenceId) {
        meetLink =
          response.data.conferenceData.entryPoints?.find(
            (ep: any) => ep.entryPointType === "video"
          )?.uri || "";
      }

      return {
        success: true,
        eventId: response.data.id,
        meetLink: meetLink,
      };
    } catch (error: any) {
      console.error("Detailed API Error:", {
        message: error.message,
        code: error.code,
        status: error.status,
        response: error.response?.data,
        errors: error.response?.data?.error?.errors,
        quota: error.response?.data?.error?.errors?.find(
          (e: any) => e.reason === "quotaExceeded"
        ),
      });
      throw error;
    }
  } catch (error) {
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

export async function updateEvent(
  eventData: EventUpdateInput
): Promise<EventResult> {
  try {
    console.log("Updating calendar event with data:", {
      eventId: eventData.eventId,
      startDateTime: eventData.startDateTime,
      endDateTime: eventData.endDateTime,
    });

    // Parse the service account credentials from environment variable
    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "{}"
    );

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error("Invalid service account credentials");
    }

    // The host will be either specified host, delegated email, or service account email
    const hostEmail =
      eventData.host || credentials.delegated_email || credentials.client_email;
    console.log("Using host email:", hostEmail);

    // Create a JWT client using the service account impersonating the host
    const jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
      subject: hostEmail, // Impersonate the host
    });

    console.log("About to authorize jwtClient");
    try {
      // Authorize the client
      const auth = await jwtClient.authorize();
      console.log("JWT Authorization successful");
    } catch (authError: any) {
      console.error("JWT Authorization failed:", {
        error: authError.message,
        code: authError.code,
        status: authError.status,
        details: authError.response?.data,
      });
      throw authError;
    }

    // Create a Google Calendar API client
    console.log("About to initialize calendar");
    const calendar = google.calendar({ version: "v3", auth: jwtClient });

    // First, get the current event to preserve its details
    const currentEvent = await retryWithBackoff(async () => {
      const response = await calendar.events.get({
        calendarId: "primary",
        eventId: eventData.eventId,
      });
      return response.data;
    });

    // Extract the Meet link if it exists
    let meetLink = "";
    if (currentEvent.conferenceData?.conferenceId) {
      meetLink =
        currentEvent.conferenceData.entryPoints?.find(
          (ep: any) => ep.entryPointType === "video"
        )?.uri || "";
    }

    // Try a minimal update first - just the start and end times
    const minimalUpdate = {
      start: {
        dateTime: eventData.startDateTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: "UTC",
      },
    };

    console.log("Attempting minimal update with:", minimalUpdate);

    // Update the event with retry logic
    const response = await retryWithBackoff(async () => {
      return await calendar.events.patch({
        calendarId: "primary",
        eventId: eventData.eventId,
        requestBody: minimalUpdate,
        sendUpdates: "all",
      });
    });

    console.log("Event updated successfully:", response.data.id);

    return {
      success: true,
      eventId: response.data.id,
      meetLink: meetLink,
    };
  } catch (error) {
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
