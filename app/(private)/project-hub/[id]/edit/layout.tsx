import Sidebar from "@/components/siderbar";
import { LayoutDataProvider } from "../../useLayoutData";
import { createClient } from "@/utils/supabase/server";
async function fetchLayoutData(id: string) {
  // Simulates an API returning global data
  const supabase = await createClient();
  const projectPromise = supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  const notesPromise = supabase
    .from("project_notes")
    .select("*")
    .eq("project_id", id);
  
  const [{ data: projectData, error: projectError }, { data: notesData, error: notesError }] = await Promise.all([projectPromise, notesPromise]);
  
  if (projectError) {
      console.error("Error fetching project in layout:", projectError);
      return null;
  }
    if (notesError) {
        console.error("Error fetching notes in layout:", notesError);
        // Decide if you want to return partial data or null
    }

  return { ...projectData, notes: notesData || [] };
}
export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: any;
}>) {
  const layoutData = await fetchLayoutData(params.id);
  console.log("Layout Data", layoutData);
  return <LayoutDataProvider value={layoutData}>{children}</LayoutDataProvider>;
}
