"use client";

import { Button } from "@/components/ui/button";
import { ChatView } from "@/views/ChatView";
// import { MentorProfile } from "@/types/mentor-profile";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { TimeSlots } from "@/app/(private)/home/TimeSlotItem";
import ProjectCard from "@/app/components/NewProjectCard";
import dayjs from "dayjs";

export default function MentorView({
  id,
  profile,
  userId,
  projects,
}: {
  id: string;
  profile: {
    id: string;
    name: string;
    bio: string;
    expertise: string[];
    hourly_rate: number;
    photo_url: string;
    availability: {
      Sunday: { start: string; end: string }[];
      Monday: { start: string; end: string }[];
      Tuesday: { start: string; end: string }[];
      Wednesday: { start: string; end: string }[];
      Thursday: { start: string; end: string }[];
      Friday: { start: string; end: string }[];
      Saturday: { start: string; end: string }[];
    };
  };
  projects?: any[] | null;
  userId: string;
}) {
  console.log("MENTOR PROFILE: SB", profile);
  profile = profile ?? {};
  return (
    <div className="grid grid-cols-[1fr_320px] w-full h-full gap-1 bg-gradient-primary">
      <div className="p-6 max-h-full overflow-y-auto flex flex-col ">
        <div className="flex flex-col gap-8 w-full max-w-2xl self-center">
          <div className="p-4 py-3  flex flex-col flex-shrink-0 rounded-2xl bg-white/80 gap-2">
            <h3 className="text-xl font-bold">About</h3>
            <div className="h-px bg-blue-200 -mx-4"></div>
            <p className="text-sm text-gray-500">{profile?.bio}</p>
          </div>
          <div className="p-4 py-3  flex flex-col flex-shrink-0 rounded-2xl bg-white/80 gap-2">
            <h3 className="text-xl font-bold">Areas Of Expertise</h3>
            <div className="h-px bg-blue-200 -mx-4"></div>
            <div className="flex flex-wrap gap-2">
              {(profile.expertise ?? []).map((expertise) => (
                <Badge
                  className="text-sm rounded border-blue-500 text-blue-500 bg-[#f0f7fa]"
                  variant="outline"
                  key={expertise}
                >
                  {expertise}
                </Badge>
              ))}
            </div>
          </div>
          <div className="p-4 py-3  flex flex-col flex-shrink-0 rounded-2xl bg-white/80 gap-2">
            <h3 className="text-xl font-bold">Availability</h3>
            <div className="h-px bg-blue-200 -mx-4"></div>
            <div className="flex flex-wrap gap-2">
              <div className="grid grid-cols-[auto_1fr] gap-2 gap-y-1 items-center">
                <TimeSlots
                  availability={profile.availability?.Sunday}
                  day="Sunday"
                />
                <TimeSlots
                  availability={profile.availability?.Monday}
                  day="Monday"
                />
                <TimeSlots
                  availability={profile.availability?.Tuesday}
                  day="Tuesday"
                />
                <TimeSlots
                  availability={profile.availability?.Wednesday}
                  day="Wednesday"
                />
                <TimeSlots
                  availability={profile.availability?.Thursday}
                  day="Thursday"
                />
                <TimeSlots
                  availability={profile.availability?.Friday}
                  day="Friday"
                />
                <TimeSlots
                  availability={profile.availability?.Saturday}
                  day="Saturday"
                />
              </div>
            </div>
          </div>
        </div>
        {/* <div className="flex flex-row gap-4 mt-7 items-center justify-between"></div>
        <div className="flex flex-wrap gap-4">
          {(projects ?? [])?.map((project) => (
            <ProjectCard
              key={project.id}
              package_id={project.id}
              userId={userId ?? ""}
              isMentor={true}
            />
          ))}
        </div> */}
      </div>

      <div className="bg-[#EDF1FB] p-8 pl-6">
        <div className="border-2 bg-white flex flex-col gap-4 relative rounded-2xl overflow-clip pb-8">
          <div className="h-32 bg-gradient-to-b from-[#2953BE] to-[#10A3E9]"></div>
          <div className=" self-center -mt-14 w-20 h-20 overflow-clip rounded-full bg-gray-200">
            <Image
              src={profile.photo_url}
              alt={profile.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-center px-8">{profile.name}</h2>
          <div className="h-px w-full bg-blue-200"></div>
          <span className="text-xl font-bold text-center ">
            ${profile.hourly_rate}/hour
          </span>
          {/* <Button
            className="text-sm py-2 text-white"
            onClick={() => console.log("Open Schedule")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button> */}
          <ChatView
            senderId={userId}
            receiverId={profile.id}
            mentorId={profile.id}
            triggerText="Start a Chat"
          ></ChatView>
          {/* <div className="border-2 border-red-500"></div> */}
        </div>
      </div>
    </div>
  );
}
