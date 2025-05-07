import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/utils/googleAuth";
import { createGoogleMeetLink } from "@/utils/googleMeet";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Get access token
    const accessToken = await getGoogleAccessToken(code);

    // Create Meet link
    const meetLink = await createGoogleMeetLink(accessToken);

    return NextResponse.json({ meetLink });
  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json(
      { error: "Failed to process authentication" },
      { status: 500 }
    );
  }
}
