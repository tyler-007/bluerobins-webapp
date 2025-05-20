import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";

import View from "./MentorView";

export default async function SearchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const { data: new_mentors } = await supabase
    .from("mentor_profiles")
    .select("*, ...profiles(*)");
  const allMentors = [...(new_mentors ?? [])];

  return <View mentors={allMentors} />;
}
