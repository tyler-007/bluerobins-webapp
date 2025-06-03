import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import OneTapComponent from "@/components/google-one-tap";
import ScheduleCalendar from "./components/ScheduleCalendar";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { session: initialSession },
  } = await supabase.auth.getSession();
  console.log("DATa2:", initialSession);
  return (
    <main className="min-h-screen p-8">
      <Link href="/sign-in">Sign In</Link>
    </main>
  );
}
