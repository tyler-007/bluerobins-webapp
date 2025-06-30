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
import { markAsCompleted } from "@/app/actions/bookings";
import { useToast } from "@/components/ui/use-toast";
import { RatingDialog } from "./components/RatingDialog";
import { Check } from "lucide-react";

const NotesDialog = ({
  projectId,
  studentId,
  mentorId,
  currentWeek,
  sessionDate,
  userType,
  weekNumber,
  status,
}: {
  projectId: string;
  studentId: string;
  mentorId: string;
  currentWeek: number;
  sessionDate: string;
  userType: "student" | "mentor";
  weekNumber: number;
  status?: string;
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
  status,
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
  status?: string;
}) => {
  const profileId = userType === "mentor" ? studentId : mentorId;
  const senderId = userType === "mentor" ? mentorId : studentId;
  const receiverId = userType === "mentor" ? studentId : mentorId;
  const { data: profile } = useProfile(profileId);
  const time = dayjs(start_time).format("h:mm A");
  const date = dayjs(start_time).format("DD MMM YYYY");
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRating, setIsRating] = useState(false);
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

  const handleMarkAsCompleted = async () => {
    setIsCompleting(true);
    const result = await markAsCompleted(bookingId);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Session marked as completed.",
      });
    }
    setIsCompleting(false);
  };

  return (
    <div className="flex flex-col flex-1 gap-1 bg-white max-w-max rounded-2xl border border-gray-200 p-6 pt-4 min-w-[330px]">
      <div className="flex flex-row gap-4 items-center justify-between">
        <span className="text-sm text-black">{date}</span>
        <div className="flex items-center gap-2">
          {status === "completed" && (
            <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
              Completed
            </span>
          )}
          <span className="bg-[#f0f0f0] rounded-full px-4 py-1 text-sm">
            {dayjs(start_time).format("h:mm A")}
          </span>
        </div>
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
            weekNumber={weekNumber}
            status={status}
          />
        </DialogContent>
      </Dialog>

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <ChatView
            name={`s_${studentId}:m_${mentorId}`}
            senderId={senderId}
            receiverId={receiverId}
          />
          {isMentor && (
            <>
              {eventLink ? (
                <RescheduleDialog
                  start_time={start_time}
                  eventId={eventId}
                  bookingId={bookingId}
                />
              ) : (
                <Button variant="outline" className="w-full flex-1">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>Schedule</span>
                </Button>
              )}
            </>
          )}

          {!isMentor && (
            <>
              {status === "completed" ? null : (
                <Button asChild className="w-full flex-1">
                  {eventLink ? (
                    <Link
                      href={eventLink}
                      target="_blank"
                      className="flex flex-row gap-2 items-center justify-center"
                    >
                      <Video className="w-5 h-5" />
                      <span>Join</span>
                    </Link>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 mr-2" />
                      <span>Schedule</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {isMentor && status !== "completed" && (
          <Button
            onClick={handleMarkAsCompleted}
            disabled={isCompleting}
            loading={isCompleting}
            variant="outline"
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
        )}

        {!isMentor && status === "completed" && (
          <>
            <Button
              onClick={() => setIsRating(true)}
              variant="outline"
              className="w-full"
            >
              Rate Session
            </Button>
            <RatingDialog
              open={isRating}
              onOpenChange={setIsRating}
              bookingId={bookingId}
              mentorId={mentorId}
              studentId={studentId}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleItem;
