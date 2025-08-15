import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import View from "./view";
import dayjs from "dayjs";

export default async function SearchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const isMentor = user.user_metadata.user_type === "mentor";
  
  if (isMentor) {
    // For mentors: fetch all projects in one query
    const { data: allProjects, error } = await supabase
      .from("projects")
      .select("*, mentor:profiles!projects_mentor_user_fkey1(name, avatar)")
      .eq("deleted", false)
      .eq("mentor_user", user.id);

    if (error) {
      console.error("Error fetching projects:", error);
    }

    return <View 
      allProjects={allProjects}
      upcomingProjects={[]} 
      pastProjects={[]}
      isMentor={isMentor} 
      userId={user.id} 
    />;
  } else {
    // For students: keep existing tabbed logic
    // Fetch upcoming projects
    let upcomingQuery = supabase
      .from("projects")
      .select("*, mentor:profiles!projects_mentor_user_fkey1(name, avatar)")
      .eq("deleted", false)
      .gte("session_time", new Date().toISOString());

    const { data: upcomingProjects, error: upcomingError } = await upcomingQuery;
    if (upcomingError) {
      console.error("Error fetching upcoming projects:", upcomingError);
    }

    // Fetch past projects
    let pastQuery = supabase
      .from("projects")
      .select("*, mentor:profiles!projects_mentor_user_fkey1(name, avatar)")
      .eq("deleted", false)
      .lt("session_time", new Date().toISOString());
    
    const { data: pastProjects, error: pastError } = await pastQuery;
    if (pastError) {
      console.error("Error fetching past projects:", pastError);
    }

    return <View 
      allProjects={[]}
      upcomingProjects={upcomingProjects} 
      pastProjects={pastProjects}
      isMentor={isMentor} 
      userId={user.id} 
    />;
  }
}
