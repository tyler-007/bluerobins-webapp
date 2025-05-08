import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/utils/googleAuth";
import { createGoogleMeetLink } from "@/utils/googleMeet";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, accessToken: existingToken } = body;

    let accessToken = existingToken;

    // If no existing token is provided, get a new one using the auth code
    if (!accessToken && code) {
      accessToken = await getGoogleAccessToken(code);
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "No valid access token available" },
        { status: 400 }
      );
    }

    // Create Meet link
    const meetLink = await createGoogleMeetLink(accessToken);

    // Return both the meet link and the token info
    return NextResponse.json({
      meetLink,
      accessToken,
      expiresIn: 3600, // Google OAuth tokens typically expire in 1 hour
    });
  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json(
      { error: "Failed to process authentication" },
      { status: 500 }
    );
  }
}
