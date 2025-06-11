import { createClient } from "@/utils/supabase/server";
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

  const isMentor = user.user_metadata.user_type === "mentor";
  const fetcher = supabase
    .from("projects")
    .select("*, mentor:profiles(name, avatar)");

  const { data: projects } = isMentor
    ? await fetcher.eq("mentor_user", user.id)
    : await fetcher;

  return <View projects={projects} isMentor={isMentor} userId={user.id} />;
}
