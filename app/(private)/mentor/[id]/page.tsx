import { createClient } from "@/utils/supabase/server";
import View from "./view";
import { redirect } from "next/navigation";

export default async function MentorPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const { data: profile } = await supabase
    .from("mentor_profiles")
    .select("*, ...profiles!projects_mentor_user_fkey1(name)")
    .eq("id", id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("mentor_user", id);

  return <View id={id} profile={profile} userId={user?.user?.id ?? ""} />;
}
