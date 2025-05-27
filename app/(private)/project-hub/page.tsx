import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";

import View from "./view";

export default async function SearchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  console.log("user", user);
  const isMentor = user.user_metadata.user_type === "mentor";
  const fetcher = supabase.from("projects").select("*");

  const { data: projects } = isMentor
    ? await fetcher.eq("mentor_user", user.id)
    : await fetcher;

  return <View projects={projects} isMentor={isMentor} />;
}
