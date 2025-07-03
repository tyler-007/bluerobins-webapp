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
import Image from "next/image";

import ProjectDetailsButton from "@/app/(private)/project-hub/ProjectDetailsButton";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { PricingInfoDialog } from "@/components/PricingInfoDialog";
import { Badge } from "@/components/ui/badge";
import { ChatView } from "@/views/ChatView";
import { parseAsBoolean, useQueryState } from "nuqs";
import Link from "next/link";

import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/components/shared/Avatar";
import { useUser } from "@/app/hooks/useUser";
import { addToCart } from "@/app/actions/cart";

type ProjectProps = any;
type UserProfileProps = any;

type ProjectCardProps = {
  package_id: number;
  userId: string;
  isMentor?: boolean;
  hideFilled?: boolean;
  projectDetails?: ProjectProps;
};

export default function NewProjectCard({
  package_id,
  userId,
  isMentor,
  hideFilled,
  projectDetails: projectDetailsFromProps,
}: ProjectCardProps) {
  const [projectDetails, setProjectDetails] = useState(
    projectDetailsFromProps
  );
  const [mentor, setMentor] = useState<UserProfileProps>();
  const [isLoading, setIsLoading] = useState(!projectDetailsFromProps);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectDetailsFromProps && package_id) {
        setIsLoading(true);
        const supabase = createClient();
        const { data: projectData, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", package_id)
          .single();

        if (error) {
          console.error("Error fetching project details:", error);
        } else {
          setProjectDetails(projectData);
        }
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [package_id, projectDetailsFromProps]);

  useEffect(() => {
    const fetchMentorDetails = async () => {
      if (projectDetails?.mentor_user) {
        const supabase = createClient();
        const { data: mentorData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", projectDetails.mentor_user)
          .single();

        if (error) {
          console.error("Error fetching mentor details:", error);
        } else {
          setMentor(mentorData);
        }
      }
    };

    fetchMentorDetails();
  }, [projectDetails]);

  const {
    agenda,
    categories: tags = [],
    cost_price,
    selling_price,
    title,
    mentor_user: mentor_user,
    description,
    filled_spots,
    prerequisites,
    session_day,
    session_time,
    sessions_count,
    spots,
    start_date,
    tools,
  } = projectDetails ?? {};

  const spotsLeft = spots - filled_spots;
  const price = isMentor ? cost_price : selling_price;
  const time = dayjs(session_time).format("hh:mm A");
  const startDate = dayjs(start_date).format("MMM D, YYYY");
  const endDate = dayjs(start_date)
    .add(sessions_count, "week")
    .format("MMM D, YYYY");

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isTesting, _] = useQueryState(
    "test",
    parseAsBoolean.withDefault(false)
  );
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { data: user } = useUser();

  const bookSlotAPI = async (
    order: any,
    package_id: number,
    title: string,
    sessions_count: number,
    mentor_user: string,
    startDate: string
  ) => {
    return fetch("/api/book_package", {
      method: "POST",
      body: JSON.stringify({
        count: sessions_count,
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
    if (!mentor_user) {
      toast({
        title: "Booking Unavailable",
        description: "This project doesn't have a mentor assigned yet and cannot be booked.",
        variant: "destructive",
      });
      return;
    }
    setNavigating(true);
    setShowPaymentDialog(true);
  };

  const handlePaymentError = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentSuccess = async (order: any, mentorUserId: string) => {
    try {
      await bookSlotAPI(
        order,
        package_id,
        title,
        sessions_count,
        mentorUserId,
        startDate
      );
    } finally {
      setShowPaymentDialog(false);
    }
  };

  const onEdit = () => {
    setNavigating(true);
    router.push(`/project-hub/${package_id}/edit`);
  };

  const avatarUrl = mentor?.photo_url?.trim() ? mentor.photo_url : mentor?.avatar;

  if (!projectDetails) {
    return (
      <div className="relative min-h-[300px] bg-white rounded-xl shadow-sm border border-gray-200 p-6 pb-2 w-[30%] min-w-[320px] max-w-sm flex flex-col justify-between "></div>
    );
  }

  if (hideFilled && !isMentor && spotsLeft < 1) {
    return null;
  }

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 pb-2 w-[30%] min-w-[320px] max-w-sm flex flex-col justify-between ">
      <div className="flex flex-col flex-1">
        <div className="flex">
          <h2 className="text-2xl font-bold mb-1 flex-1">{title}</h2>
          {isMentor && (
            <Button
              onClick={onEdit}
              variant="ghost"
              className="text-blue-500 flex -mt-1"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              <span className="text-sm">Edit</span>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag: string) => (
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
          <span className="text-base "> {sessions_count} Sessions </span>
          <Clock className="w-4 h-4" />
          <span className="text-base">
            Every {session_day} {time}
          </span>{" "}
          <Calendar className="w-4 h-4" />
          <span className="text-base">
            {dayjs(startDate).format("DD MMM")}{" "}
            {endDate && `to ${dayjs(endDate).format("DD MMM")}`}
          </span>
          {!isMentor && (
            <>
              {avatarUrl ? (
                <img
                  src={mentor?.photo_url}
                  alt={mentor?.name || "Mentor"}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.className = 'inline-block';
                    target.parentNode?.insertBefore(fallback, target.nextSibling);
                  }}
                  style={{ display: mentor?.photo_url ? undefined : 'none' }}
                />
              ) : null}
              {!mentor?.photo_url && (
                <Avatar
                  src={mentor?.avatar}
                  alt={mentor?.name || "Mentor"}
                  size="sm"
                  fallback={mentor?.name}
                />
              )}
              <Link className="text-blue-500" href={`/mentor/${mentor_user}`}>
                {mentor?.name}
              </Link>
              <div> </div>
              <span className="text-left text-blue-500 text-sm cursor-pointer hover:text-black transition-all duration-300 ">
                <ChatView
                  asChild
                  triggerClassName="border-none text-left text-blue-500 text-sm cursor-pointer hover:text-black transition-all duration-300 "
                  triggerText="Chat with mentor"
                  name={``}
                  mentorId={mentor_user}
                  senderId={userId}
                  receiverId={mentor_user}
                />
              </span>
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
          </div>
          <PricingInfoDialog
            sessionCount={sessions_count}
            triggerText="View Pricing Info"
            buttonProps={{
              className: "text-blue-500",
            }}
          />
        </>
      )}
      {!isMentor && (
        <>
          {spotsLeft > 0 ? (
            <div className="flex items-center bg-[#f0f7fa] p-3 pt-2 rounded-lg gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-black text-lg flex-1 mt-px">{price}</span>
              <Button
                variant="default"
                size="sm"
                className="text-sm rounded-md"
                onClick={onBuyPackage}
                disabled={!mentor_user}
              >
                Book Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-sm rounded-md ml-2"
                onClick={async () => {
                  if (!user) {
                    toast({ title: "Not logged in", description: "Please log in as a student to add to cart.", variant: "destructive" });
                    return;
                  }
                  const res = await addToCart({ studentId: user.id, projectId: String(package_id), mentorId: mentor_user });
                  if (res.success) {
                    toast({ title: "Added to Cart", description: "Project added to your cart." });
                  } else {
                    toast({ title: "Error", description: res.error || "Could not add to cart.", variant: "destructive" });
                  }
                }}
                disabled={!mentor_user}
              >
                Add to Cart
              </Button>
            </div>
          ) : (
            <div className="flex items-center bg-red-200 p-3 pt-2 rounded-lg gap-0">
              <span className="text-black text-lg flex-1 mt-px">
                All slots are booked
              </span>
            </div>
          )}
          <div className="w-full text-center mt-2">
            <ProjectDetailsButton
              onBuyPackage={onBuyPackage}
              project={{
                title,
                description,
                tags,
                mentor,
                sessions: sessions_count,
                startDate,
                endDate,
                time: session_time,
                day: session_day,
                agenda,
                tools,
                prerequisites,
              }}
            />
          </div>
        </>
      )}
      <PaymentDialog
        summary={
          <div className="flex flex-col gap-2">
            <span className="text-lg">
              You are about to pay
              <br />
              <b>${price}</b> for {title} <b>({sessions_count} sessions)</b>
              <br />
              with <b>{mentor?.name}</b>
            </span>
          </div>
        }
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        amount={isTesting ? 0.1 : price}
        onSuccess={(order) => handlePaymentSuccess(order, mentor_user)}
        onError={handlePaymentError}
        onCancel={handlePaymentCancel}
      />
      {!isMentor && spotsLeft > 0 && (
        <div className="absolute right-4 -top-[10px] rounded-xl border border-primary  bg-primary text-white px-3">
          {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} left
        </div>
      )}
      <Link href={`/project-hub/${package_id}`}>
        <Button variant="outline" className="w-full mt-2">Go to Full Project Page</Button>
      </Link>
    </div>
  );
}
