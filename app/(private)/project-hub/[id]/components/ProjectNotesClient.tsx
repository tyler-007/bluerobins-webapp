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
import dayjs from "dayjs";

const noteSchema = z.object({
  note_text: z.string().optional(),
  week_number: z.number().int().min(1),
});

type NoteFormValues = z.infer<typeof noteSchema>;

// This action will handle saving the note to the database
async function saveNote(noteData: {
  note_text: string;
  week_number: number;
  project_id: string;
  student_id: string;
  mentor_id: string;
  user_type: "student" | "mentor";
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication error.");
  }

  // Find the specific note for this user and week
  const { data: existingNote } = await supabase
    .from("project_notes")
    .select("id")
    .eq("project_id", noteData.project_id)
    .eq("week_number", noteData.week_number)
    .eq("author_type", noteData.user_type)
    .maybeSingle();

  const dataToUpsert = {
    id: existingNote?.id,
    project_id: noteData.project_id,
    student_id: noteData.student_id,
    mentor_id: noteData.mentor_id,
    week_number: noteData.week_number,
    note_text: noteData.note_text,
    author_type: noteData.user_type,
    visibility: "shared",
  };

  const { error } = await supabase.from("project_notes").upsert(dataToUpsert);

  if (error) {
    console.error("Error saving note:", error);
    throw new Error("Failed to save note. Please contact support.");
  }
}

export const ProjectNotesClient = ({
  projectId,
  studentId,
  mentorId,
  notes,
  currentWeek = 1,
  sessionDate,
  userType,
}: {
  projectId: string;
  studentId: string;
  mentorId: string;
  notes: any[];
  currentWeek?: number;
  sessionDate: string;
  userType: "student" | "mentor";
}) => {
  const router = useRouter();

  // Find the specific notes for the current week
  const studentNoteForCurrentWeek = notes.find(
    (n) => n.week_number === currentWeek && n.author_type === "student"
  );
  const mentorNoteForCurrentWeek = notes.find(
    (n) => n.week_number === currentWeek && n.author_type === "mentor"
  );

  const sessionLockDate = dayjs(sessionDate).add(1, "day");
  const isLocked = dayjs().isAfter(sessionLockDate);
  const isStudent = userType === "student";

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<NoteFormValues>({
    defaultValues: {
      note_text:
        (isStudent
          ? studentNoteForCurrentWeek?.note_text
          : mentorNoteForCurrentWeek?.note_text) || "",
      week_number: currentWeek,
    },
  });

  const handleSaveNote = async (data: NoteFormValues) => {
    try {
      await saveNote({
        note_text: data.note_text || "",
        week_number: data.week_number,
        project_id: projectId,
        mentor_id: mentorId,
        student_id: studentId,
        user_type: userType,
      });
      toast({ title: "Success", description: "Your note has been saved." });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Group notes by week for easier rendering
  const pastNotesByWeek = notes.reduce((acc, note) => {
    if (note.week_number === currentWeek) return acc;
    if (!acc[note.week_number]) {
      acc[note.week_number] = {};
    }
    acc[note.week_number][note.author_type] = note;
    return acc;
  }, {} as Record<number, { student?: any; mentor?: any }>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Week {currentWeek} Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Student's Note</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap mt-1">
              {studentNoteForCurrentWeek?.note_text || "No note from student yet."}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Mentor's Note</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap mt-1">
              {mentorNoteForCurrentWeek?.note_text || "No feedback from mentor yet."}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Your Note</CardTitle>
          <CardDescription>
            {isLocked
              ? "This week's notes are locked."
              : "Your note will be locked 24 hours after the session."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSaveNote)} className="space-y-4">
            <Controller
              name="note_text"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  rows={5}
                  placeholder="Enter your note here..."
                  disabled={isLocked}
                />
              )}
            />
            <Button type="submit" disabled={isSubmitting || isLocked}>
              {isSubmitting ? "Saving..." : "Save Your Note"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4">Past Notes</h3>
        <div className="space-y-4">
          {Object.keys(pastNotesByWeek)
            .sort((a, b) => Number(b) - Number(a))
            .map((week) => {
              const studentNote = pastNotesByWeek[Number(week)]?.student;
              const mentorNote = pastNotesByWeek[Number(week)]?.mentor;
              return (
                <Card key={week}>
                  <CardHeader>
                    <CardTitle>Week {week} Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Student's Note</h4>
                      <p className="whitespace-pre-wrap text-sm text-gray-700 mt-1">
                        {studentNote?.note_text || "No note added."}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Mentor's Note</h4>
                      <p className="whitespace-pre-wrap text-sm text-gray-700 mt-1">
                        {mentorNote?.note_text || "No note added."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}; 