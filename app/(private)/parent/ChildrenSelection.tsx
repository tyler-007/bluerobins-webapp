"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function ChildrenSelection({ parentId }: { parentId: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("student_profiles")
        .select("id, grade, institution_name, parent_name");
      console.log("Fetched students:", data, "Error:", error);
      setStudents(data || []);
    };
    fetchStudents();
  }, []);

  const handleToggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      // Upsert links for each selected student
      const inserts = selected.map((student_id) => ({
        parent_id: parentId,
        student_id,
        approved: false,
      }));
      if (inserts.length > 0) {
        const { error } = await supabase.from("parent_student_links").upsert(inserts, { onConflict: "parent_id,student_id" });
        if (error) {
          console.error("Upsert error:", error);
          throw error;
        }
      }
      toast({ title: "Request Sent", description: "Link requests sent for approval." });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast({ title: "Error", description: "Failed to send requests.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow min-w-[350px]">
      <h2 className="text-xl font-bold mb-4">Select Your Children</h2>
      <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
        {students.map((student) => (
          <label key={student.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(student.id)}
              onChange={() => handleToggle(student.id)}
              className="accent-blue-500"
            />
            <span>
              {student.parent_name || "(No Name)"} — Grade {student.grade || "-"} — {student.institution_name || "-"} — ID: {student.id}
            </span>
          </label>
        ))}
        {students.length === 0 && <div>No students found.</div>}
      </div>
      <Button type="submit" loading={loading} disabled={loading || selected.length === 0} className="w-full mt-2">
        Request Link
      </Button>
    </form>
  );
} 