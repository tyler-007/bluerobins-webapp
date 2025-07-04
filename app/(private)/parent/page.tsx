"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ParentOnboarding from "./ParentOnboarding";
import ChildrenSelection from "./ChildrenSelection";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [childrenLinks, setChildrenLinks] = useState<any[]>([]);
  const [childrenProfiles, setChildrenProfiles] = useState<any[]>([]);
  const [notesByChild, setNotesByChild] = useState<any>({});
  const [pendingLinks, setPendingLinks] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndLinks = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/");
        return;
      }
      setUser(userData.user);
      // Fetch parent profile
      const { data: parentProfile } = await supabase
        .from("parent_profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .single();
      setProfile(parentProfile);
      // Fetch children links (approved and pending)
      let approvedLinks: any[] = [];
      let pending: any[] = [];
      if (parentProfile) {
        const { data: links } = await supabase
          .from("parent_student_links")
          .select("*")
          .eq("parent_id", parentProfile.id);
        approvedLinks = (links || []).filter((l) => l.approved === true);
        pending = (links || []).filter((l) => l.approved === false);
        setChildrenLinks(approvedLinks);
        setPendingLinks(pending);
      }
      setLoading(false);
    };
    fetchUserAndLinks();
  }, [router]);

  useEffect(() => {
    const fetchProfilesAndNotes = async () => {
      if (childrenLinks.length > 0) {
        const supabase = createClient();
        const studentIds = childrenLinks.map((l) => l.student_id);
        const { data: students } = await supabase
          .from("student_profiles")
          .select("id, grade, institution_name, parent_name")
          .in("id", studentIds);
        setChildrenProfiles(students || []);
        // Fetch notes for each child
        const notesObj: any = {};
        for (const student of students || []) {
          const { data: notes } = await supabase
            .from("project_notes")
            .select("*")
            .eq("student_id", student.id)
            .in("visibility", ["shared", "mentor_only"]);
          // Group notes by week
          const grouped = (notes || []).reduce((acc: any, note: any) => {
            acc[note.week_number] = acc[note.week_number] || [];
            acc[note.week_number].push(note);
            return acc;
          }, {});
          notesObj[student.id] = grouped;
        }
        setNotesByChild(notesObj);
      } else {
        setChildrenProfiles([]);
        setNotesByChild({});
      }
    };
    fetchProfilesAndNotes();
  }, [childrenLinks]);

  if (loading) return <div className="p-8">Loading...</div>;

  // If no parent profile, show onboarding
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ParentOnboarding userId={user.id} email={user.email} />
      </div>
    );
  }

  // If no links at all, show children selection
  if ((!childrenLinks || childrenLinks.length === 0) && (!pendingLinks || pendingLinks.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ChildrenSelection parentId={profile.id} />
      </div>
    );
  }

  // If pending links, show pending message
  if (pendingLinks && pendingLinks.length > 0 && (!childrenLinks || childrenLinks.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <h2 className="text-2xl font-bold mb-6">Pending Approval</h2>
        <div className="flex flex-col gap-4 w-full max-w-xl">
          {pendingLinks.map((link) => (
            <div key={link.student_id} className="bg-white rounded-lg p-4 border shadow">
              <span>Request pending for student ID: {link.student_id}</span>
            </div>
          ))}
        </div>
        <div className="text-gray-500 mt-8">Your request is pending admin approval.</div>
      </div>
    );
  }

  // Show approved children and their notes (full-width, no sidebar)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <h2 className="text-2xl font-bold mb-6">Your Children & Weekly Logs</h2>
      <div className="flex flex-col gap-8 w-full max-w-2xl">
        {childrenProfiles.map((child) => (
          <Card key={child.id} className="w-full">
            <CardHeader>
              <CardTitle>{child.parent_name || "(No Name)"}</CardTitle>
              <CardDescription>
                Grade: {child.grade} | Institution: {child.institution_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notesByChild[child.id] && Object.keys(notesByChild[child.id]).length > 0 ? (
                Object.entries(notesByChild[child.id]).map(([week, notes]: any) => (
                  <div key={week} className="mb-4">
                    <div className="font-semibold mb-1">Week {week}</div>
                    {notes.map((note: any) => (
                      <div key={note.id} className="mb-2 pl-2 border-l-2 border-blue-200">
                        <div className="text-sm font-medium">
                          {note.author_type === "student" ? "👨‍🎓 Student note" : "👩‍🏫 Mentor feedback"}
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap text-sm">{note.note_text}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(note.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No notes yet.</div>
              )}
            </CardContent>
          </Card>
        ))}
        {childrenProfiles.length === 0 && <div className="text-gray-500">No approved children yet.</div>}
      </div>
    </div>
  );
} 