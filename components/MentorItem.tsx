"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  Landmark,
  BicepsFlexed,
  Clock,
  Calendar,
  MessageCircle,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { cn, getTagStyle } from "@/lib/utils";

export default function MentorItem({
  mentor,
  className,
}: {
  className?: string;
  mentor: any;
}) {
  const expertise =
    mentor?.expertise_areas?.split?.(",") ?? mentor?.expertise_areas ?? [];
  return (
    <Card className={cn("flex flex-col p-4 gap-1", className)}>
      <div className="flex gap-2 mb-2">
        <Avatar src={mentor.avatar} alt="Avatar" size="lg" />
        <div className="flex flex-col justify-center">
          <span className="text-base font-bold">{mentor.name}</span>
          <div className="flex gap-1 items-center">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-500 mt-px">
              {mentor.avg_rating} ({mentor.rating_count} reviews)
            </span>
          </div>
          {/* <span>Mentor Description</span> */}
        </div>
      </div>
      <div className="flex flex-col h-[72px] gap-2">
        <div className="flex gap-3">
          <div className="w-4 h-4 grid place-items-center mt-px">
            <Landmark className="w-4" />
          </div>
          <span className="text-sm mt-1">{mentor.university}</span>
        </div>
        <div className="flex gap-3">
          <div className="w-4 h-4 grid place-items-center mt-px">
            <BicepsFlexed className="w-4" />
          </div>
          <span className="text-sm mt-1">
            Specializing in {expertise.slice(0, 2).join(" and ")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 mt-4">
        {expertise.map((tag: string, idx: number) => {
          const style = getTagStyle(tag, idx);
          return (
            <span
              key={idx}
              className={cn("text-xs px-3 py-1.5 rounded-full font-semibold")}
              style={style}
            >
              {tag}
            </span>
          );
        })}
      </div>
      <div className="flex-1" />
      <div className="flex justify-between items-center mb-4 text-sm">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{mentor.availability}</span>
        </div>
        <div className="font-semibold">${mentor.hourly_rate}/hour</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="text-sm py-2 bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-600 hover:text-white"
          onClick={() => console.log("Open Chat")}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
        </Button>
        <Button
          className="text-sm py-2 bg-[#B78727] hover:bg-[#9b7421] text-white"
          onClick={() => console.log("Open Schedule")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Schedule
        </Button>
      </div>
    </Card>
  );
}
