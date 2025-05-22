"use client";

import { useProfile } from "@/app/hooks/useProfile";
import { ChatView } from "@/views/ChatView";
import { Video } from "lucide-react";
import Link from "next/link";
const ScheduleItem = ({
  title,
  description,
  time,
  date,
  mentorId,
  studentId,
  userType,
  eventLink,
}: {
  title?: string;
  description: string;
  time: string;
  date: string;
  mentorId: string;
  studentId: string;
  userType: string;
  eventLink?: string;
}) => {
  const profileId = userType === "mentor" ? studentId : mentorId;
  const { data: profile } = useProfile(profileId);
  // const { data: user } = useUser();

  return (
    <div className="flex flex-col flex-1 gap-1 bg-white max-w-max rounded-2xl border border-gray-200 p-6 pt-4">
      <div className="flex flex-row gap-4 items-center justify-between">
        <span className="text-sm text-black">{date}</span>
        <span className="bg-[#f0f0f0] rounded-full px-4 py-1 text-sm">
          {time}
        </span>
      </div>
      <span className="text-lg font-bold mt-2">
        {title ?? `Meeting with ${profile?.name ?? "Mentor"}`}
      </span>
      {/* <span className="text-sm text-gray-500">{description}</span> */}
      <div className="flex flex-row flex-1 gap-4 items-center mt-4">
        <ChatView name={`s_${studentId}:m_${mentorId}`} />
        {eventLink ? (
          <button className="bg-[#2953BE] border-[#2953BE] border-[1.5px] gap-2  text-white rounded-xl px-4 py-1 text-base flex flex-row flex-1 items-center justify-center">
            <Link
              href={eventLink}
              target="_blank"
              className="flex flex-row gap-2 items-center justify-center"
            >
              <Video className="w-5 h-5" />
              <span>Join Meeting</span>
            </Link>
          </button>
        ) : (
          <span>Link not available</span>
        )}
      </div>
    </div>
  );
};

export default ScheduleItem;
