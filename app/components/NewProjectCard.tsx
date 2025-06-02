"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Edit2Icon,
  Edit3,
  Hash,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Chip from "@/components/chip";
import ProjectDetailsButton from "@/app/(private)/project-hub/ProjectDetailsButton";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useState } from "react";
import dayjs from "dayjs";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";
import { PricingInfoDialog } from "@/components/PricingInfoDialog";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  package_id: number;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  sessions: number;
  mentor: { name: string; avatar: string };
  time: string;
  day: string;
  startDate: string;
  endDate: string;
  mentor_user: string;
  spotsLeft: number;
  spots: number;
  price: number;
  agenda: { description: string }[];
  tools: { title: string; url: string }[];
  prerequisites: { title: string; url: string }[];
  isMentor?: boolean;
}

export default function NewProjectCard({
  package_id,
  title,
  description,
  tags,
  duration,
  isMentor,
  mentor,
  sessions,
  time,
  mentor_user,
  day,
  startDate,
  endDate,
  spotsLeft,
  spots,
  price,
  agenda,
  tools,
  prerequisites,
}: ProjectCardProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  console.log("NAME:", mentor);
  const bookSlotAPI = async (
    order: any,
    mentor_user: string,
    startDate: string,
    session_number: number,
    package_id: number,
    title: string,
    description: string
  ) => {
    const start_time = dayjs(startDate)
      .add(session_number, "day")
      .format("YYYY-MM-DDTHH:mm:ssZ");
    const end_time = dayjs(start_time)
      .add(1, "hour")
      .format("YYYY-MM-DDTHH:mm:ssZ");

    return fetch("/api/book_slot", {
      method: "POST",
      body: JSON.stringify({
        for_user: mentor_user,
        title: title,
        description: `Session ${session_number + 1} of ${sessions}`,
        start_time,
        end_time,
        payment_id: order.id,
        package_id,
        details: order,
      }),
    });
  };

  const onBuyPackage = async () => {
    setNavigating(true);
    setShowPaymentDialog(true);
    console.log("Buy Packagessss:");
  };

  const handlePaymentError = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentSuccess = async (order: any) => {
    const session_count = sessions;
    const bookingsAPI = new Array(session_count).fill(0).map((_, index) => {
      return bookSlotAPI(
        order,
        mentor_user,
        startDate,
        index,
        package_id,
        title,
        description
      );
    });

    const res = await Promise.all(bookingsAPI);
    console.log("Bookings API", res);
    // setShowPaymentDialog(false);
  };

  const onEdit = () => {
    setNavigating(true);
    router.push(`/project-hub/${package_id}/edit`);
  };

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 pb-2 w-[30%] min-w-[320px] max-w-sm flex flex-col justify-between ">
      <div className="flex flex-col flex-1">
        <h2 className="text-2xl font-bold mb-1">{title}</h2>

        <div className="flex gap-2 mb-2">
          {tags.map((tag) => (
            <Badge
              className="text-sm rounded border-blue-500 text-blue-500 bg-[#f0f7fa]"
              variant="outline"
              key={tag}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-2 mt-2 mb-4">
          <Hash className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-base"> {sessions} Sessions </span>
          <Clock className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-base">
            Every {day} {time}
          </span>{" "}
          <Calendar className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-base">
            {dayjs(startDate).format("DD MMM")} to{" "}
            {dayjs(endDate).format("DD MMM")}
          </span>
          {!isMentor && (
            <>
              <Users className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-base">{mentor.name}</span>
              <div> </div>
              {/* <Button variant="ghost" size="sm" className="text-blue-500">
                View Details
              </Button> */}
              <span className="text-blue-500 text-sm cursor-pointer hover:text-black transition-all duration-300 ">
                Chat with mentor
              </span>
            </>
          )}
        </div>
        <div className="flex flex-1 items-end">
          <p className="text-gray-500 mb-3 max-h-12 line-clamp-2 text-sm leading-snug ">
            <span>{description}</span>
          </p>
        </div>

        {/* <div className="grid grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-medium">{sessions} Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>{startDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span>{day}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>{time}</span>
          </div>
        </div> */}

        {/* <div className="text-base mb-2 mt-2">
          
          <span className="font-medium">
            {startDate} to {endDate}
          </span>
        </div> */}
      </div>
      {isMentor && (
        <>
          <div className="flex items-center bg-[#f0f7fa] p-3 pt-2 rounded-lg gap-2">
            <Users className="w-4 h-4" />
            <span className="text-black text-base font-normal flex-1">
              {spots - spotsLeft} / {spots} Enrolled
            </span>
            {/* <Button variant="default" size="sm" className="text-sm rounded-md">
          Invite
        </Button> */}
          </div>
          <PricingInfoDialog
            sessionCount={sessions}
            triggerText="View Pricing Info"
            buttonProps={{
              className: "text-blue-500",
            }}
          />
        </>
      )}
      {!isMentor && (
        <>
          <div className="flex items-center bg-[#f0f7fa] p-3 pt-2 rounded-lg gap-0">
            <DollarSign className="w-5 h-5" />
            <span className="text-black text-lg flex-1 mt-px">{price}</span>
            <Button
              variant="default"
              size="sm"
              className="text-sm rounded-md"
              onClick={onBuyPackage}
            >
              Book Now
            </Button>
          </div>
          <ProjectDetailsButton
            onBuyPackage={onBuyPackage}
            project={{
              title,
              description,
              tags,
              mentor,
              sessions,
              startDate,
              endDate,
              time,
              day,
              agenda,
              tools,
              prerequisites,
            }}
          />
        </>
      )}

      {isMentor && (
        <div className="absolute top-5  right-5">
          <Button
            onClick={onEdit}
            variant="ghost"
            className="text-blue-500 flex"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            <span className="text-base">Edit</span>
          </Button>
        </div>
      )}
    </div>
  );
}
