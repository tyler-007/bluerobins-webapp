"use client";

import { Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Chip from "@/components/chip";
import ProjectDetailsButton from "@/app/(private)/project-hub/ProjectDetailsButton";
import { toast } from "@/components/ui/use-toast";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useState } from "react";
import dayjs from "dayjs";
import { createCalendarEvent } from "@/lib/actions";
import { redirect } from "next/navigation";

interface ProjectCardProps {
  package_id: number;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  sessions: number;
  time: string;
  day: string;
  startDate: string;
  endDate: string;
  mentor_user: string;
  spotsLeft: number;
  price: number;
  agenda: { description: string }[];
  tools: { title: string; url: string }[];
  prerequisites: { title: string; url: string }[];
  isMentor?: boolean;
}

export default function ProjectCard({
  package_id,
  title,
  description,
  tags,
  duration,
  isMentor,
  sessions,
  time,
  mentor_user,
  day,
  startDate,
  endDate,
  spotsLeft,
  price,
  agenda,
  tools,
  prerequisites,
}: ProjectCardProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [navigating, setNavigating] = useState(false);
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

  const onBuyPackage = async (order: any) => {
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
    setShowPaymentDialog(false);
  };

  const onEdit = () => {
    setNavigating(true);
    redirect(`/project-hub/${package_id}/edit`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-[30%] min-w-[320px] max-w-sm flex flex-col justify-between ">
      <div>
        <h2 className="text-2xl font-bold mb-1">{title}</h2>

        <p className="text-gray-500 mb-3 text-base leading-snug line-clamp-2">
          <span>{description}</span>
        </p>
        <div className="flex gap-2 mb-4">
          {tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>

        <div className="grid grid-cols-2">
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
        </div>

        <div className="text-base mb-2 mt-2">
          {/* Time duration :{" "} */}
          <span className="font-medium">
            {startDate} to {endDate}
          </span>
        </div>
        {!spotsLeft ? null : isMentor ? (
          <div className="flex items-center  gap-2 font-medium">
            <Users className="w-5 h-5" />
            <span>
              {spotsLeft} Student{spotsLeft === 1 ? "" : "s"}
            </span>
            <div className="flex-1"></div>
            <span className="text-gray-500 text-sm">Price: ${price}</span>
          </div>
        ) : (
          <div className="flex items-center  gap-2 text-green-600 font-medium">
            <Users className="w-5 h-5" />
            <span>
              {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
            </span>
          </div>
        )}
      </div>
      <div className="border-t pt-4 mt-2 flex flex-col gap-2">
        {!isMentor && (
          <div className="flex items-center justify-between">
            <span className="text-lg">Price:</span>
            <span className="text-2xl font-bold">${price}</span>
          </div>
        )}
        {isMentor ? (
          <Button
            loading={navigating}
            className="w-full mt-2 text-lg py-6"
            onClick={onEdit}
          >
            Edit Details
          </Button>
        ) : (
          <>
            <Button className="w-full mt-2 text-lg py-6" onClick={onBuyPackage}>
              Buy Package
            </Button>
            <ProjectDetailsButton
              project={{
                title,
                description,
                tags: ["Tag 1", "Tag 2", "Tag 3"],
                duration,
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
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          amount={price}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      </div>
    </div>
  );
}
