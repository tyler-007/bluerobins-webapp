"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  ExternalLink,
  Users,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProjectDetailsButton({
  onBuyPackage,
  project,
}: {
  onBuyPackage: () => Promise<void>;
  project: {
    title: string;
    description: string;
    tags: string[];
    sessions: number;
    startDate: string;
    mentor: { name: string; avatar: string };
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
  const [open, setOpen] = useState(false);

  const onClose = () => {
    setOpen(false);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="ghost"
          className="text-blue-500"
        >
          View Details
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "outline-none p-0 transition-all duration-300 min-w-screen max-w-none sm:max-w-none w-[30vw] bg-white overflow-y-auto"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="w-full flex border-b p-4 items-center justify-between sticky top-0 bg-white">
            <h1 className="text-2xl font-bold">Project Details</h1>
            <Button className="mr-6" onClick={onBuyPackage}>
              Book Now
            </Button>
            <button
              onClick={() => {
                onClose();
              }}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="grid gap-4 p-8">
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
            <div className="flex flex-col bg-blue-200 p-3 pt-2 my-2 rounded-xl gap-1">
              <span className="text-black">Mentor</span>
              <div className="flex flex-row items-center gap-2">
                <Image
                  src={project.mentor?.avatar}
                  alt="mentor"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-primary">{project.mentor?.name}</span>
              </div>
            </div>
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
              {(project.prerequisites ?? [])
                .sort((a, b) => (a.url ? 1 : -1) - (b.url ? 1 : -1))
                .map(({ title, url }, index) =>
                  url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={index}
                    >
                      <Badge className="cursor-pointer text-primary bg-transparent border border-primary hover:bg-secondary/80 flex items-center gap-2 px-4 text-base">
                        {title}
                        <ExternalLink className="w-5 h-5" />
                      </Badge>
                    </a>
                  ) : (
                    <Badge
                      key={index}
                      className=" hover:bg-secondary/80 flex items-center gap-2 px-4 text-base"
                    >
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
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={index}
                    >
                      <Badge className="cursor-pointer text-primary bg-transparent border border-primary hover:bg-secondary/80 flex items-center gap-2 px-4 text-base">
                        {title}
                        <ExternalLink className="w-5 h-5" />
                      </Badge>
                    </a>
                  ) : (
                    <Badge
                      key={index}
                      className=" hover:bg-secondary/80 flex items-center gap-2 px-4 text-base"
                    >
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
