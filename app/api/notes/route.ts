import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Helper to check if 24 hours have passed
function isLocked(createdAt: string, locked: boolean): boolean {
  if (locked) return true;
  const created = new Date(createdAt);
  const now = new Date();
  return now.getTime() - created.getTime() > 24 * 60 * 60 * 1000;
}

// GET: Fetch notes for a project (optionally filter by week, author)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const week = searchParams.get("week");
  const authorType = searchParams.get("authorType");
  if (!projectId) return NextResponse.json({ success: false, error: "Missing projectId" }, { status: 400 });
  const supabase = await createClient();
  let query = supabase.from("project_notes").select("*").eq("project_id", projectId);
  if (week) query = query.eq("week_number", Number(week));
  if (authorType) query = query.eq("author_type", authorType);
  const { data, error } = await query.order("week_number", { ascending: true }).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, notes: data });
}

// POST: Add or update (upsert) a note
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, studentId, mentorId, week_number, note_text, author_type } = body;
  if (!projectId || !week_number || !author_type) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }
  const supabase = await createClient();
  // Find existing note
  const { data: existingNote } = await supabase
    .from("project_notes")
    .select("id, created_at, locked")
    .eq("project_id", projectId)
    .eq("week_number", week_number)
    .eq("author_type", author_type)
    .maybeSingle();
  // If note exists, check lock
  if (existingNote) {
    // If locked or 24h passed, set locked and reject
    if (isLocked(existingNote.created_at, existingNote.locked)) {
      // Set locked=true if not already
      if (!existingNote.locked) {
        await supabase.from("project_notes").update({ locked: true }).eq("id", existingNote.id);
      }
      return NextResponse.json({ success: false, error: "Note is locked and cannot be edited." }, { status: 403 });
    }
  }
  const dataToUpsert: any = {
    id: existingNote?.id,
    project_id: projectId,
    week_number,
    note_text,
    author_type,
    visibility: "shared",
    locked: false,
  };
  if (studentId) dataToUpsert.student_id = studentId;
  if (mentorId) dataToUpsert.mentor_id = mentorId;
  const { error } = await supabase.from("project_notes").upsert(dataToUpsert);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH: Edit a note (optional, upsert in POST covers this)
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { noteId, note_text } = body;
  if (!noteId || !note_text) {
    return NextResponse.json({ success: false, error: "Missing noteId or note_text" }, { status: 400 });
  }
  const supabase = await createClient();
  // Fetch note
  const { data: note } = await supabase.from("project_notes").select("created_at, locked").eq("id", noteId).maybeSingle();
  if (!note) return NextResponse.json({ success: false, error: "Note not found" }, { status: 404 });
  if (isLocked(note.created_at, note.locked)) {
    if (!note.locked) {
      await supabase.from("project_notes").update({ locked: true }).eq("id", noteId);
    }
    return NextResponse.json({ success: false, error: "Note is locked and cannot be edited." }, { status: 403 });
  }
  const { error } = await supabase
    .from("project_notes")
    .update({ note_text })
    .eq("id", noteId);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 