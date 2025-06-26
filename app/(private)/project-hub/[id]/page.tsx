import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectNotesClient } from "./components/ProjectNotesClient";

// Placeholder for Project Details UI
const ProjectDetails = ({ project }: { project: any }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>
          Project overview and key details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{project.description}</p>
        {/* We can add more project details here */}
      </CardContent>
    </Card>
  );
};

export default async function ProjectViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*, mentor_user_id") // Ensure mentor_user_id is selected
    .eq("id", projectId)
    .single();

  // Fetch project notes
  const { data: notes, error: notesError } = await supabase
    .from("project_notes")
    .select("*")
    .eq("project_id", projectId)
    .order("week_number", { ascending: true })
    .order("created_at", { ascending: true });

  if (projectError || !project) {
    console.error("Error fetching project:", projectError);
    return notFound();
  }
  
  if (notesError) {
    console.error("Error fetching notes:", notesError);
    // We can still render the page even if notes fail to load
  }

  // Determine the current week of the project.
  // This is a placeholder logic. You might have a more sophisticated way to calculate this.
  const projectStartDate = project.start_date ? new Date(project.start_date) : new Date();
  const today = new Date();
  const weeksSinceStart = Math.ceil((today.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const currentWeek = Math.max(1, weeksSinceStart);

  return (
    <div className="p-4 md:p-8">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="notes">Weekly Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <ProjectDetails project={project} />
        </TabsContent>
        <TabsContent value="notes">
          <ProjectNotesClient
            projectId={projectId}
            studentId={user.id}
            mentorId={project.mentor_user_id}
            notes={notes || []}
            currentWeek={currentWeek}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 