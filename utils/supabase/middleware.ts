import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const OPEN_ROUTES = [
  "/sign-in",
  "/forgot-password",
  "/sign-up",
  "/",
  "/auth/callback",
];

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Don't redirect if we're on the auth callback route
    if (request.nextUrl.pathname === "/auth/callback") {
      return response;
    }

    // Redirect to home if authenticated and on root
    if (request.nextUrl.pathname === "/" && user) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // Redirect to sign-in if not authenticated and trying to access protected route
    if (!OPEN_ROUTES.includes(request.nextUrl.pathname) && !user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    console.error("Middleware error:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
