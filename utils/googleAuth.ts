import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/google/callback`
);

export async function getGoogleAccessToken(code: string): Promise<string> {
  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) {
      throw new Error("No access token received");
    }
    return tokens.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

export function getGoogleAuthUrl(): string {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/google/callback`,
  });
}
