"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import ScheduleItem from "./ScheduleItem";

interface SessionListProps {
  sessions: any[];
  initialCount: number;
  userType: string;
  title: string;
}

export default function SessionList({ sessions, initialCount, userType, title }: SessionListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sessions?.length) {
    return null;  // Return nothing so parent can handle empty state
  }

  const displayedSessions = isExpanded ? sessions : sessions.slice(0, initialCount);

  return (
    <>
      <div className="mt-7">
        <div className="flex flex-row gap-4 items-center">
          <span className="text-2xl font-bold">{title}</span>
          {sessions.length > initialCount && (
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 ml-4"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View More ({sessions.length - initialCount})
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-row flex-wrap gap-4">
        {displayedSessions.map((session) => (
          <ScheduleItem
            key={session.id}
            bookingId={session.id}
            mentorId={session.for}
            eventId={session.event_id}
            eventLink={session.event_link}
            userType={userType}
            studentId={session.by}
            title={session.title}
            description={session.description}
            start_time={session.start_time}
          />
        ))}
        {isExpanded && sessions.length > initialCount && (
          <Button
            variant="outline"
            onClick={() => setIsExpanded(false)}
            className="w-full mt-4 flex items-center justify-center gap-2"
          >
            <ChevronUp className="w-4 h-4" />
            Collapse
          </Button>
        )}
      </div>
    </>
  );
}