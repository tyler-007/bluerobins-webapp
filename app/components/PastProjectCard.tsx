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

type PastProjectCardProps = {
  project: {
    id: number;
    title: string;
    description: string;
    categories: string[];
    mentor_user: string;
    mentor: { name: string; avatar?: string };
    selling_price: number;
    sessions_count: number;
    type_of_project: string;
    session_time?: string;
    agenda?: string;
    tools?: string[];
    prerequisites?: string[];
  };
  userId: string;
  isMentor: boolean;
};

export default function PastProjectCard({
  project,
  userId,
  isMentor,
}: PastProjectCardProps) {
  const { toast } = useToast();
  const [hasShownInterest, setHasShownInterest] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    const checkInterestStatus = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("project_interests")
          .select("id")
          .eq("project_id", project.id)
          .eq("student_id", userId)
          .single();

        if (!error && data) {
          setHasShownInterest(true);
        }
      } catch (error) {
        console.error("Error checking interest status:", error);
      }
    };

    if (!isMentor) {
      checkInterestStatus();
    }
  }, [project.id, userId, isMentor]);
  
  if (!project) return null;

  const {
    title,
    description,
    categories: tags = [],
    selling_price: price,
    mentor_user,
    mentor,
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-80 relative">
      <div className="flex">
        <h2 className="text-2xl font-bold mb-1 flex-1">{title}</h2>
        {isMentor && (
          <Button
            onClick={() => router.push(`/project-hub/${project.id}/edit`)}
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
               onClick={() => handleShowInterest(project.id)}
               disabled={hasShownInterest}
             >
                               <Heart className="w-4 h-4" />
                {hasShownInterest ? "On the List" : "Show Interest"}
             </Button>
          </div>
          <ProjectDetailsButton
            onBuyPackage={() => handleShowInterest(project.id)}
            project={{
              title,
              description,
              tags,
              mentor,
              sessions: sessions_count,
              startDate: session_time ? dayjs(session_time).format("MMM D, YYYY") : "",
              endDate: session_time ? dayjs(session_time).add(sessions_count, "week").format("MMM D, YYYY") : "",
              time: session_time || "",
              day: session_time ? dayjs(session_time).format("dddd") : "",
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
