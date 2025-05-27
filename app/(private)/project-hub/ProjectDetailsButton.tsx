"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Clock, Calendar, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProjectDetailsButton({
  project,
}: {
  project: {
    title: string;
    description: string;
    tags: string[];
    sessions: number;
    startDate: string;
    endDate: string;
    time: string;
    day: string;
    agenda: { description: string }[];
    tools: { title: string; url: string }[];
    prerequisites: { title: string; url: string }[];
  };
  userId?: string;
  name?: string;
  email?: string;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const onClose = (open: boolean) => {
    setOpen(open);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetTrigger asChild>
        <Button onClick={() => setOpen(true)} variant="outline">
          View Details
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "outline-none p-0 transition-all duration-300 min-w-screen max-w-none sm:max-w-none w-[30vw] bg-white"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="w-full flex border-b p-4 items-center justify-between">
            <h1 className="text-2xl font-bold">Project Details</h1>
            <Button
              className="mr-6"
              onClick={() => {
                console.log("Buy Package");
              }}
            >
              Buy Package
            </Button>
          </div>
          <div className="grid gap-4 p-4">
            <h2 className="text-xl font-bold">{project.title}</h2>
            <div className="text-lg -mt-3">
              {/* Time duration :{" "} */}
              <span className="font-medium">
                {project.startDate} to {project.endDate}
              </span>
            </div>
            <p className="text-base text-gray-500 -mt-3">
              {project.description}
            </p>
            <div className="grid grid-cols-2 text-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{project.sessions} Sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>{project.startDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span>{project.day}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>{project.time}</span>
              </div>
            </div>
            <h2 className="text-xl font-bold">Session Details</h2>
            <div className="grid grid-cols-[auto_1fr] gap-2 -mt-3 text-lg">
              {project.agenda.map((agenda, index) => (
                <Fragment key={index}>
                  <span className="font-medium">Session {index + 1}:</span>
                  <span>{agenda.description}</span>
                </Fragment>
              ))}
            </div>
            <h2 className="text-xl font-bold">Prerequisites</h2>
            <div className="flex flex-wrap gap-2 -mt-3">
              {project.prerequisites
                .sort((a, b) => (a.url ? 1 : -1) - (b.url ? 1 : -1))
                .map(({ title, url }, index) =>
                  url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Badge className="cursor-pointer text-primary bg-transparent border border-primary hover:bg-secondary/80 flex items-center gap-2 px-4 text-base">
                        {title}
                        <ExternalLink className="w-5 h-5" />
                      </Badge>
                    </a>
                  ) : (
                    <Badge className=" hover:bg-secondary/80 flex items-center gap-2 px-4 text-base">
                      {title}
                    </Badge>
                  )
                )}
            </div>
            <h2 className="text-xl font-bold">Tools & Resources</h2>
            <div className="flex flex-wrap gap-2 -mt-3">
              {project.tools
                .sort((a, b) => (a.url ? 1 : -1) - (b.url ? 1 : -1))
                .map(({ title, url }, index) =>
                  url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Badge className="cursor-pointer text-primary bg-transparent border border-primary hover:bg-secondary/80 flex items-center gap-2 px-4 text-base">
                        {title}
                        <ExternalLink className="w-5 h-5" />
                      </Badge>
                    </a>
                  ) : (
                    <Badge className=" hover:bg-secondary/80 flex items-center gap-2 px-4 text-base">
                      {title}
                    </Badge>
                  )
                )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
