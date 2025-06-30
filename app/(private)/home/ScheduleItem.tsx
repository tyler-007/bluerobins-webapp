"use client";

import { useProfile } from "@/app/hooks/useProfile";
import { ChatView } from "@/views/ChatView";
import dayjs from "dayjs";
import { Clock, Video } from "lucide-react";
import Link from "next/link";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectNotesClient } from "../project-hub/[id]/components/ProjectNotesClient";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NotesDialog = ({
  projectId,
  studentId,
  mentorId,
  currentWeek,
  sessionDate,
  userType,
}: {
  projectId: string;
  studentId: string;
  mentorId: string;
  currentWeek: number;
  sessionDate: string;
  userType: "student" | "mentor";
}) => {
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotes = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("project_notes")
        .select("*")
        .eq("project_id", projectId)
        .order("week_number", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching notes:", error);
      } else {
        setNotes(data || []);
      }
    };
    fetchNotes();
  }, [projectId]);

  return (
    <ProjectNotesClient
      projectId={projectId}
      studentId={studentId}
      mentorId={mentorId}
      notes={notes}
      currentWeek={currentWeek}
      sessionDate={sessionDate}
      userType={userType}
    />
  );
};

const ScheduleItem = ({
  title,
  description,
  eventId,
  mentorId,
  studentId,
  userType,
  eventLink,
  start_time,
  bookingId,
  projectId,
  weekNumber,
}: {
  title?: string;
  description: string;
  start_time: string;
  eventId: string;
  mentorId: string;
  studentId: string;
  userType: string;
  eventLink?: string;
  bookingId: string;
  projectId: string;
  weekNumber: number;
}) => {
  const profileId = userType === "mentor" ? studentId : mentorId;
  const senderId = userType === "mentor" ? mentorId : studentId;
  const receiverId = userType === "mentor" ? studentId : mentorId;
  const { data: profile } = useProfile(profileId);
  const time = dayjs(start_time).format("h:mm A");
  const date = dayjs(start_time).format("DD MMM YYYY");
  // const { data: user } = useUser();
  const showJoin = false;
  const isMentor = userType === "mentor";
  console.log(
    "eventId",
    eventId,
    start_time,
    "age",
    dayjs(start_time).format("h:mm A")
  );
  return (
    <div className="flex flex-col flex-1 gap-1 bg-white max-w-max rounded-2xl border border-gray-200 p-6 pt-4 min-w-[330px]">
      <div className="flex flex-row gap-4 items-center justify-between">
        <span className="text-sm text-black">{date}</span>
        <span className="bg-[#f0f0f0] rounded-full px-4 py-1 text-sm">
          {dayjs(start_time).format("h:mm A")}
        </span>
      </div>
      <span className="text-lg font-bold">{title ?? `One on One Meeting`}</span>
      {description && (
        <span className="text-sm text-gray-500">{description}</span>
      )}
      {profile?.name && (
        <span className="text-sm text-gray-500">
          with {profile?.name ?? "Mentor"}
        </span>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-2">View Notes</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Weekly Notes for "{title}"</DialogTitle>
          </DialogHeader>
          <NotesDialog
            projectId={projectId}
            studentId={studentId}
            mentorId={mentorId}
            currentWeek={weekNumber}
            sessionDate={start_time}
            userType={userType as "student" | "mentor"}
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-row flex-1 gap-4 items-center justify-between mt-4">
        <ChatView
          name={`s_${studentId}:m_${mentorId}`}
          senderId={senderId}
          receiverId={receiverId}
        />
        {!eventLink && (
          <button className="bg-[#2953BE] border-[#2953BE] border-[1.5px] gap-2  text-white rounded-xl px-4 py-1 text-base flex flex-row flex-1 items-center justify-center">
            <Clock className="w-5 h-5" />
            <span>Schedule</span>
          </button>
        )}
        {eventLink ? (
          showJoin ? (
            <button className="bg-[#2953BE] border-[#2953BE] border-[1.5px] gap-2  text-white rounded-xl px-4 py-1 text-base flex flex-row flex-1 items-center justify-center">
              <Link
                href={eventLink}
                target="_blank"
                className="flex flex-row gap-2 items-center justify-center"
              >
                <Video className="w-5 h-5" />
                <span>Join </span>
              </Link>
            </button>
          ) : isMentor ? (
            <RescheduleDialog
              start_time={start_time}
              eventId={eventId}
              bookingId={bookingId}
            />
          ) : // <button className="bg-[#2953BE] border-[#2953BE] border-[1.5px] gap-2  text-white rounded-xl px-4 py-1 text-base flex flex-row flex-1 items-center justify-center">
          //   <Clock className="w-5 h-5" />
          //   <span>Reschedule</span>
          // </button>
          null
        ) : null}
      </div>
    </div>
  );
};

export default ScheduleItem;
