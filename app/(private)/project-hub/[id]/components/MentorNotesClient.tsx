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
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

const noteSchema = z.object({
  note_text: z.string().min(10, "Note must be at least 10 characters long."),
});

type NoteFormValues = z.infer<typeof noteSchema>;

async function saveMentorNote(noteData: {
  note_text: string;
  week_number: number;
  project_id: string;
  student_id: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication error. You must be logged in to save feedback.");
  }

  const { data: existingNote } = await supabase
    .from("project_notes")
    .select("id")
    .eq("project_id", noteData.project_id)
    .eq("mentor_id", user.id)
    .eq("week_number", noteData.week_number)
    .eq("author_type", "mentor")
    .eq("student_id", noteData.student_id)
    .single();

  const { error } = await supabase.from("project_notes").upsert({
    id: existingNote?.id,
    project_id: noteData.project_id,
    student_id: noteData.student_id,
    mentor_id: user.id,
    week_number: noteData.week_number,
    note_text: noteData.note_text,
    author_type: 'mentor',
    visibility: 'shared',
  });

  if (error) {
    console.error("Error saving mentor note:", error);
    throw new Error("Failed to save note.");
  }
}

export const MentorNotesClient = ({
  project,
  notes,
  userId,
}: {
  project: any;
  notes: any[];
  userId: string;
}) => {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);

  const studentsInProject = useMemo(() => {
    if (!notes) return [];
    const studentMap = new Map();
    notes.forEach(note => {
        if(note.author_type === 'student' && !studentMap.has(note.student_id)) {
            // In a real app, you'd fetch student profile info (name, avatar) here.
            // For now, we'll just use the ID.
            studentMap.set(note.student_id, { id: note.student_id, name: `Student ${note.student_id.substring(0, 6)}` });
        }
    });
    return Array.from(studentMap.values());
  }, [notes]);

  const notesForSelectedStudent = useMemo(() => {
    return notes.filter(note => note.student_id === selectedStudentId);
  }, [notes, selectedStudentId]);
  
  // This would be more robust in a real app
  const currentWeek = 1;
  
  const mentorNoteForCurrentWeek = notesForSelectedStudent.find(
      (n) => n.week_number === currentWeek && n.author_type === 'mentor'
  );

  const isNoteLocked = mentorNoteForCurrentWeek?.locked === true;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note_text: "" },
  });

  React.useEffect(() => {
    if (mentorNoteForCurrentWeek) {
      reset({ note_text: mentorNoteForCurrentWeek.note_text });
    } else {
      reset({ note_text: "" });
    }
  }, [mentorNoteForCurrentWeek, reset]);

  const handleSaveNote = async (data: NoteFormValues) => {
      if (!selectedStudentId) {
          toast({ title: "Error", description: "Please select a student.", variant: "destructive"});
          return;
      }
    try {
      await saveMentorNote({
        ...data,
        project_id: project.id,
        student_id: selectedStudentId,
        week_number: currentWeek,
      });
      toast({ title: "Success", description: "Your feedback has been saved." });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>View Student Notes & Add Feedback</CardTitle>
                <CardDescription>Select a student to view their notes and provide your feedback for the week.</CardDescription>
            </CardHeader>
            <CardContent>
                <Select onValueChange={setSelectedStudentId} defaultValue={selectedStudentId || undefined}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a student..." />
                    </SelectTrigger>
                    <SelectContent>
                        {studentsInProject.map(student => (
                            <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        {selectedStudentId && (
            <>
            <Card>
                <CardHeader>
                  <CardTitle>Add Feedback for Week {currentWeek}</CardTitle>
                   <CardDescription>
                    {isNoteLocked
                      ? "This feedback is locked and can no longer be edited."
                      : "Add or edit your feedback for the selected student."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(handleSaveNote)} className="space-y-4">
                        <Controller name="note_text" control={control} render={({ field }) => (
                            <div>
                                <Textarea {...field} rows={5} placeholder={isNoteLocked ? "This feedback is locked." :`Write your feedback for ${studentsInProject.find(s=>s.id===selectedStudentId)?.name}...`} disabled={isNoteLocked} />
                                {errors.note_text && <p className="text-sm text-red-500 mt-1">{errors.note_text.message}</p>}
                            </div>
                        )} />
                        <Button type="submit" disabled={isSubmitting || isNoteLocked}>{isSubmitting ? "Saving..." : "Save Feedback"}</Button>
                    </form>
                </CardContent>
            </Card>

            <div>
                <h3 className="text-xl font-semibold mb-4">Note History</h3>
                <div className="space-y-4">
                {notesForSelectedStudent
                    .sort((a, b) => b.week_number - a.week_number || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((note) => (
                    <Card key={note.id} className={note.author_type === 'mentor' ? 'border-blue-200' : ''}>
                        <CardHeader>
                        <CardTitle>
                            Week {note.week_number} - {note.author_type === 'student' ? 'Student Note' : 'Your Feedback'}
                        </CardTitle>
                        <CardDescription>{new Date(note.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent><p className="whitespace-pre-wrap">{note.note_text}</p></CardContent>
                    </Card>
                ))}
                {notesForSelectedStudent.length === 0 && <p>No notes found for this student.</p>}
                </div>
            </div>
            </>
        )}
    </div>
  );
}; 