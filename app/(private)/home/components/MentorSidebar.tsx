"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import MentorProfileEdit from "../MentorProfileEdit";
import { TimeSlots } from "../TimeSlotItem";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MentorSidebar({
  profile,
  user,
  availability,
}: {
  profile: any;
  user: any;
  availability: any;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col bg-light border-l-2 border-gray-200 p-5 gap-5 transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[300px]"
      )}
    >
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-white rounded-full border border-gray-200"
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>
      <div
        className={cn(
          "transition-opacity duration-300",
          isCollapsed ? "opacity-0 hidden" : "opacity-100"
        )}
      >
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex flex-row gap-4 items-center">
            {profile?.photo_url ? (
              <Image
                src={profile?.photo_url ?? ""}
                alt="avatar"
                width={56}
                height={56}
                className="rounded-full min-w-16  object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 rounded-full bg-[#B1D1FA] items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold">
                {user?.user_metadata?.full_name}
              </span>

              <MentorProfileEdit
                triggerText="Edit Profile"
                initialStep={0}
                profile={profile}
                email={user?.email ?? ""}
                name={user?.user_metadata?.full_name}
                userId={user.id}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl flex flex-col flex-1 border border-gray-200 p-3 mt-5">
          <div className="flex flex-row gap-4 items-center justify-between">
            <span className="text-lg font-bold">Timings</span>
            <MentorProfileEdit
              triggerText="Edit Timings"
              initialStep={2}
              triggerClassName="-mt-0 -ml-0 justify-end"
              profile={profile}
              email={user?.email ?? ""}
              name={user?.user_metadata?.full_name}
              userId={user.id}
            />
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2 gap-y-1 items-center">
            <TimeSlots availability={availability?.Sunday} day="Sunday" />
            <TimeSlots availability={availability?.Monday} day="Monday" />
            <TimeSlots availability={availability?.Tuesday} day="Tuesday" />
            <TimeSlots availability={availability?.Wednesday} day="Wednesday" />
            <TimeSlots availability={availability?.Thursday} day="Thursday" />
            <TimeSlots availability={availability?.Friday} day="Friday" />
            <TimeSlots availability={availability?.Saturday} day="Saturday" />
          </div>
        </div>
      </div>
    </div>
  );
} 