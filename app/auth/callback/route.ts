import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  console.log(">>>>> AUTH CB <<<<<<<<<");
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const userType = requestUrl.searchParams.get("user_type");
    const origin = requestUrl.origin;
    const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

    console.log("Callback URL params:", {
      code: code ? "present" : "missing",
      userType,
      url: request.url,
    });

    if (!code) {
      console.error("No code provided in callback");
      return NextResponse.redirect(`${origin}/`);
    }

    if (!userType) {
      console.error("No user type provided in callback");
      return NextResponse.redirect(`${origin}/`);
    }

    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${origin}/`);
    }

    if (session) {
      console.log("Updating user metadata with type:", userType);
      // Update the user's metadata with their type
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          user_type: userType,
        },
      });

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
        return NextResponse.redirect(`${origin}/`);
      }

      console.log("Successfully updated user type:", userType);
    }

    if (redirectTo) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    // Redirect parents to /parent, admins to /admin, others to /home
    if (userType === "parent") {
      return NextResponse.redirect(`${origin}/parent`);
    }
    if (userType === "admin") {
      return NextResponse.redirect(`${origin}/admin`);
    }
    return NextResponse.redirect(`${origin}/home`);
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${origin}/`);
  }
}
