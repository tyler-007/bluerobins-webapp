"use client";

import {
  Hash,
  User,
  Heart,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ProjectDetailsButton from "@/app/(private)/project-hub/ProjectDetailsButton";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShape, getShapeStream } from "@electric-sql/react";
import { getProjectShape, type ProjectProps } from "@/app/shapes/project";
import { getUserProfile, type UserProfileProps } from "@/app/shapes/profile";

type PastProjectCardProps = {
  projectId: number;
  userId: string;
  isMentor: boolean;
};

export default function PastProjectCard({
  projectId,
  userId,
  isMentor,
}: PastProjectCardProps) {
  const { toast } = useToast();
  const [hasShownInterest, setHasShownInterest] = useState(false);
  const router = useRouter();
  
  // Use Electric SQL to fetch project data
  const { data: projectData, isLoading } = useShape<ProjectProps>(getProjectShape(projectId));
  const project = projectData[0];

  // Use Electric SQL to fetch mentor data
  const { data: mentorData, isLoading: mentorLoading } = useShape<UserProfileProps>(
    getUserProfile(project?.mentor_user || "")
  );
  const mentor = project?.mentor_user ? mentorData[0] : null;
  
  useEffect(() => {
    const checkInterestStatus = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("project_interests")
          .select("id")
          .eq("project_id", projectId)
          .eq("student_id", userId)
          .single();

        if (!error && data) {
          setHasShownInterest(true);
        }
      } catch (error) {
        console.error("Error checking interest status:", error);
      }
    };

    if (!isMentor && projectId) {
      checkInterestStatus();
    }
  }, [projectId, userId, isMentor]);
  
  if (!project || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 w-80 relative">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const {
    title,
    description,
    categories: tags = [],
    selling_price: price,
    mentor_user,
    sessions_count,
    session_time,
    agenda,
    tools,
    prerequisites,
  } = project;

  const handleShowInterest = async (projectId: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_interests")
        .insert({
          project_id: projectId,
          student_id: userId
        });

      if (error) {
        console.error("Error recording interest:", error);
        toast({
          title: "Error",
          description: "Failed to record interest. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setHasShownInterest(true);
      toast({
        title: "Success",
        description: "Your interest has been recorded!",
      });
    } catch (error) {
      console.error("Error recording interest:", error);
      toast({
        title: "Error",
        description: "Failed to record interest. Please try again.",
        variant: "destructive",
      });
    }
  };

  const time = session_time ? dayjs(session_time).format("hh:mm A") : "";
  const startDate = session_time ? dayjs(session_time).format("MMM D, YYYY") : "";
  const day = session_time ? dayjs(session_time).format("dddd") : "";
  const endDate = session_time ? dayjs(session_time).add(sessions_count, "week").format("MMM D, YYYY") : "";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-80 relative">
      <div className="flex">
        <h2 className="text-2xl font-bold mb-1 flex-1">{title}</h2>
        {isMentor && (
          <Button
            onClick={() => router.push(`/project-hub/${projectId}/edit`)}
            variant="ghost"
            className="text-blue-500 flex -mt-1"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            <span className="text-sm">Edit</span>
          </Button>
        )}
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
        <span className="text-base "> {sessions_count} Sessions </span>
        {!isMentor && (
          <>
            <User className="w-5 h-5" strokeWidth={1.5} />
            <Link className="text-blue-500" href={`/mentor/${mentor_user}`}>
              {mentor?.name}
            </Link>
          </>
        )}
      </div>
      
      <div className="flex flex-1 items-end">
        <p className="text-gray-500 mb-3 max-h-12 line-clamp-2 text-sm leading-snug ">
          <span>{description}</span>
        </p>
      </div>

      {!isMentor && (
        <>
          <div className="flex items-center bg-[#f0f7fa] p-3 pt-2 rounded-lg gap-0">
            <span className="text-black text-lg flex-1 mt-px">${price}</span>
            <Button
              variant="outline"
              size="sm"
              className="text-sm rounded-md flex items-center gap-2"
              onClick={() => handleShowInterest(projectId)}
              disabled={hasShownInterest}
            >
              <Heart className="w-4 h-4" />
              {hasShownInterest ? "On the List" : "Show Interest"}
            </Button>
          </div>
                     <ProjectDetailsButton
             onBuyPackage={() => handleShowInterest(projectId)}
             project={{
               title,
               description,
               tags,
               mentor: mentor || { name: "Unknown", avatar: "" }, // Provide fallback for null mentor
               sessions: sessions_count,
               startDate,
               endDate,
               time: session_time,
               day: day,
               agenda,
               tools,
               prerequisites,
             }}
           />
        </>
      )}
    </div>
  );
}
