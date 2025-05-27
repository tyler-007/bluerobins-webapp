import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  console.log(">>>>> AUTH CB <<<<<<<<<");
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const userType = requestUrl.searchParams.get("user_type");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  console.log(">>>>> code", code);

  if (code) {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session && userType) {
      // Update the user's metadata with their type
      await supabase.auth.updateUser({
        data: {
          user_type: userType,
        },
      });
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/home`);
}
