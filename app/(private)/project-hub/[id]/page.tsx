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
import dayjs from "dayjs";

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
    .select("*, mentor_user") // Ensure mentor_user is selected
    .eq("id", projectId)
    .single();

  // Fetch project notes
  const { data: notes, error: notesError } = await supabase
    .from("project_notes")
    .select("*")
    .eq("project_id", projectId)
    .order("week_number", { ascending: true })
    .order("created_at", { ascending: true });

  // Fetch booking information to check if the user is enrolled
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("project_id", projectId)
    .eq("by", user.id)
    .maybeSingle();

  if (projectError || !project) {
    console.error("Error fetching project:", projectError);
    return notFound();
  }
  
  if (bookingError) {
    console.error("Error checking enrollment:", bookingError);
    // Decide if you want to block the page or just hide notes
  }

  const isEnrolled = !!booking;
  
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

  const sessionTime = dayjs(`${projectStartDate.toISOString().split('T')[0]} ${project.session_time}`, "YYYY-MM-DD HH:mm").toDate();

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
            mentorId={project.mentor_user}
            notes={notes || []}
            currentWeek={currentWeek}
            sessionDate={sessionTime.toISOString()}
            userType={user.id === project.mentor_user ? "mentor" : "student"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 