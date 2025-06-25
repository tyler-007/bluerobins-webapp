"use client";

import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const noteSchema = z.object({
  note_text: z.string().min(10, "Note must be at least 10 characters long."),
  week_number: z.number().int().min(1),
});

type NoteFormValues = z.infer<typeof noteSchema>;

// This action will handle saving the note to the database
async function saveNote(noteData: {
  note_text: string;
  week_number: number;
  project_id: string;
  mentor_id: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication error. You must be logged in to save a note.");
  }

  const { data: existingNote, error: fetchError } = await supabase
    .from("project_notes")
    .select("id")
    .eq("project_id", noteData.project_id)
    .eq("student_id", user.id)
    .eq("week_number", noteData.week_number)
    .eq("author_type", "student")
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error("Error checking for existing note:", fetchError);
    throw new Error("Could not save note.");
  }
  
  const { error } = await supabase.from("project_notes").upsert({
    id: existingNote?.id,
    project_id: noteData.project_id,
    student_id: user.id,
    mentor_id: noteData.mentor_id,
    week_number: noteData.week_number,
    note_text: noteData.note_text,
    author_type: 'student',
    visibility: 'shared',
  });

  if (error) {
    console.error("Error saving note:", error);
    throw new Error("Failed to save note.");
  }
}

export const ProjectNotesClient = ({
  projectId,
  studentId,
  mentorId,
  notes,
  currentWeek = 1,
}: {
  projectId: string;
  studentId: string;
  mentorId: string;
  notes: any[];
  currentWeek?: number;
}) => {
  const router = useRouter();
  const studentNoteForCurrentWeek = notes.find(
    (n) => n.week_number === currentWeek && n.author_type === 'student'
  );

  const isNoteLocked = studentNoteForCurrentWeek?.locked === true;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      note_text: studentNoteForCurrentWeek?.note_text || "",
      week_number: currentWeek,
    },
  });

  const handleSaveNote = async (data: NoteFormValues) => {
    try {
      await saveNote({ ...data, projectId, mentorId });
      toast({ title: "Success", description: "Your note has been saved." });
      router.refresh(); // Re-fetches data on the server and re-renders
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Week {currentWeek} Note</CardTitle>
          <CardDescription>
            {isNoteLocked
              ? "This note is locked and can no longer be edited."
              : "Add or edit your note for the current week. You can edit it for up to 24 hours."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSaveNote)} className="space-y-4">
            <Controller
              name="note_text"
              control={control}
              render={({ field }) => (
                <div>
                  <Textarea
                    {...field}
                    rows={6}
                    placeholder={
                      isNoteLocked
                        ? "This note is locked."
                        : "Write your weekly reflection, progress, and any questions you have for your mentor..."
                    }
                    disabled={isNoteLocked}
                  />
                  {errors.note_text && <p className="text-sm text-red-500 mt-1">{errors.note_text.message}</p>}
                </div>
              )}
            />
            <Button type="submit" disabled={isSubmitting || isNoteLocked}>
              {isSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">Past Notes</h3>
        <div className="space-y-4">
          {notes
            .sort((a, b) => b.week_number - a.week_number)
            .map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <CardTitle>
                  Week {note.week_number} - {note.author_type === 'student' ? 'Your Note' : 'Mentor Feedback'}
                </CardTitle>
                <CardDescription>
                  {new Date(note.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{note.note_text}</p>
              </CardContent>
            </Card>
          ))}
          {notes.length === 0 && <p>No notes have been added yet.</p>}
        </div>
      </div>
    </div>
  );
}; 