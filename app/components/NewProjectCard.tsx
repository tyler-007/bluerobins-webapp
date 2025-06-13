"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  Edit3,
  Hash,
  Users,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import ProjectDetailsButton from "@/app/(private)/project-hub/ProjectDetailsButton";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { PricingInfoDialog } from "@/components/PricingInfoDialog";
import { Badge } from "@/components/ui/badge";
import { ChatView } from "@/views/ChatView";
import { parseAsBoolean, useQueryState } from "nuqs";
import Link from "next/link";

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
  userId: string;
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
  userId,
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
  const [isTesting, _] = useQueryState(
    "test",
    parseAsBoolean.withDefault(false)
  );
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const bookSlotAPI = async (
    order: any,
    package_id: number,
    title: string,
    session_count: number,
    mentor_user: string,
    startDate: string
  ) => {
    return fetch("/api/book_package", {
      method: "POST",
      body: JSON.stringify({
        count: session_count,
        for_user: mentor_user,
        title: title,
        startDate,

        payment_id: order.id,
        package_id,
        details: order,
      }),
    });
  };

  const onBuyPackage = async () => {
    setNavigating(true);
    setShowPaymentDialog(true);
  };

  const handlePaymentError = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentSuccess = async (order: any) => {
    const session_count = sessions;

    await bookSlotAPI(
      order,
      package_id,
      title,
      session_count,
      mentor_user,
      startDate
    );
  };

  const onEdit = () => {
    setNavigating(true);
    router.push(`/project-hub/${package_id}/edit`);
  };

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 pb-2 w-[30%] min-w-[320px] max-w-sm flex flex-col justify-between ">
      <div className="flex flex-col flex-1">
        <div className="flex">
          <h2 className="text-2xl font-bold mb-1 flex-1">{title}</h2>
          <Button
            onClick={onEdit}
            variant="ghost"
            className="text-blue-500 flex -mt-1"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            <span className="text-sm">Edit</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
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

        <div className="grid grid-cols-[auto_1fr] gap-2 items-center mt-2 mb-4">
          <Hash className="w-4 h-4" />
          <span className="text-base "> {sessions} Sessions </span>
          <Clock className="w-4 h-4" />
          <span className="text-base">
            Every {day} {time}
          </span>{" "}
          <Calendar className="w-4 h-4" />
          <span className="text-base">
            {dayjs(startDate).format("DD MMM")} to{" "}
            {dayjs(endDate).format("DD MMM")}
          </span>
          {!isMentor && (
            <>
              <User className="w-5 h-5" strokeWidth={1.5} />
              <Link href={`/mentor/${mentor_user}`}>{mentor?.name}</Link>
              <div> </div>
              {/* <Button variant="ghost" size="sm" className="text-blue-500">
                View Details
              </Button> */}
              <ChatView
                triggerClassName="text-left text-blue-500 text-sm cursor-pointer hover:text-black transition-all duration-300 "
                triggerText="Chat with mentor"
                name={``}
                mentorId={mentor_user}
                senderId={userId}
                receiverId={mentor_user}
              />
              {/* <span className="text-blue-500 text-sm cursor-pointer hover:text-black transition-all duration-300 ">
                Chat with mentor
              </span> */}
            </>
          )}
        </div>
        <div className="flex flex-1 items-end">
          <p className="text-gray-500 mb-3 max-h-12 line-clamp-2 text-sm leading-snug ">
            <span>{description}</span>
          </p>
        </div>
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
          {/* <div className="flex justify-between"> */}
          <PricingInfoDialog
            sessionCount={sessions}
            triggerText="View Pricing Info"
            buttonProps={{
              className: "text-blue-500",
            }}
          />
          {/* </div> */}
        </>
      )}
      {!isMentor && (
        <>
          {spotsLeft > 0 ? (
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
          ) : (
            <div className="flex items-center bg-red-200 p-3 pt-2 rounded-lg gap-0">
              <span className="text-black text-lg flex-1 mt-px">
                All slots are booked
              </span>
            </div>
          )}
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
      <PaymentDialog
        summary={
          <div className="flex flex-col gap-2">
            <span className="text-lg">
              You are about to pay
              <br />
              <b>${price}</b> for {title} <b>({sessions} sessions)</b>
              <br />
              with <b>{mentor?.name}</b>
            </span>
          </div>
        }
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        amount={isTesting ? 0.1 : price}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={handlePaymentCancel}
      />
      {!isMentor && spotsLeft > 0 && (
        <div className="absolute right-4 -top-[10px] rounded-xl border border-primary  bg-primary text-white px-3">
          {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} left
        </div>
      )}
    </div>
  );
}
