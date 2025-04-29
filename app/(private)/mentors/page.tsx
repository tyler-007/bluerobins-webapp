import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import mentors from "./data";
import View from "./view";

export default async function SearchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const { data: new_mentors } = await supabase
    .from("mentors")
    .select("*, ...profiles(*)");
  // console.log("new_mentors", new_mentors);
  const allMentors = [...(new_mentors ?? []), ...mentors];

  return <View mentors={allMentors} />;
}
