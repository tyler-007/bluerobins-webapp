import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import OneTapComponent from "@/components/google-one-tap";
import ScheduleCalendar from "./components/ScheduleCalendar";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <Link href="/sign-in">Sign In</Link>
    </main>
  );
}
