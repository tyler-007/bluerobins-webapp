"use client";
import Image from "next/image";
import logo from "../home/mascot.png";

// import ProjectCard from "@/app/components/ProjectCard";
import NewProjectCard from "@/app/components/NewProjectCard";
import PastProjectCard from "@/app/components/PastProjectCard";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function ProjectHubView(props: {
  allProjects: any;
  upcomingProjects: any;
  pastProjects: any;
  userId: string;
  isMentor: boolean;
  hideHeader?: boolean;
}) {
  const isMentor = props.isMentor;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [hideFull, setHideFull] = useQueryState(
    "hideFull",
    parseAsBoolean.withDefault(false)
  );

  const [topicsParam, setTopicsParam] = useQueryState("topics");
  const [mentorsParam, setMentorsParam] = useQueryState("mentors");
  const [sessionsParam, setSessionsParam] = useQueryState("sessions");

  const selectedTopics = useMemo(
    () => (topicsParam ? topicsParam.split(",").filter(Boolean) : []),
    [topicsParam]
  );
  const selectedMentors = useMemo(
    () => (mentorsParam ? mentorsParam.split(",").filter(Boolean) : []),
    [mentorsParam]
  );
  const selectedSessions = useMemo(
    () =>
      sessionsParam
        ? sessionsParam
            .split(",")
            .filter(Boolean)
            .map((s) => parseInt(s, 10))
            .filter((n) => !Number.isNaN(n))
        : [],
    [sessionsParam]
  );

  const allStudentProjects = useMemo(() => {
    const u = Array.isArray(props.upcomingProjects)
      ? props.upcomingProjects
      : [];
    const p = Array.isArray(props.pastProjects) ? props.pastProjects : [];
    return [...u, ...p];
  }, [props.upcomingProjects, props.pastProjects]);

  const facetOptions = useMemo(() => {
    const topicSet = new Set<string>();
    const mentorMap = new Map<string, string>();
    const sessionSet = new Set<number>();

    allStudentProjects.forEach((proj: any) => {
      (proj?.categories ?? []).forEach((t: string) => topicSet.add(t));
      if (proj?.mentor_user) {
        const label = proj?.mentor?.name || proj?.mentor_user;
        mentorMap.set(proj.mentor_user, label);
      }
      if (typeof proj?.sessions_count === "number") {
        sessionSet.add(proj.sessions_count);
      }
    });

    return {
      topics: Array.from(topicSet).sort((a, b) => a.localeCompare(b)),
      mentors: Array.from(mentorMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      sessions: Array.from(sessionSet.values()).sort((a, b) => a - b),
    } as const;
  }, [allStudentProjects]);

  const toggleCsvValue = useCallback(
    (
      currentCsv: string | null,
      value: string,
      setFn: (next: string | null) => void
    ) => {
      const parts = currentCsv ? currentCsv.split(",").filter(Boolean) : [];
      const exists = parts.includes(value);
      const next = exists
        ? parts.filter((p) => p !== value)
        : [...parts, value];
      setFn(next.length ? next.join(",") : null);
    },
    []
  );

  const clearAll = useCallback(() => {
    setTopicsParam(null);
    setMentorsParam(null);
    setSessionsParam(null);
    setHideFull(false);
  }, [setTopicsParam, setMentorsParam, setSessionsParam, setHideFull]);

  const projectMatchesFilters = useCallback(
    (proj: any) => {
      if (selectedTopics.length) {
        const topics: string[] = proj?.categories ?? [];
        const anyMatch = selectedTopics.some((t) => topics.includes(t));
        if (!anyMatch) return false;
      }
      if (selectedMentors.length) {
        if (!selectedMentors.includes(proj?.mentor_user)) return false;
      }
      if (selectedSessions.length) {
        if (!selectedSessions.includes(proj?.sessions_count)) return false;
      }
      if (hideFull) {
        const spots = Number(proj?.spots ?? 0);
        const filled = Number(proj?.filled_spots ?? 0);
        if (spots - filled < 1) return false;
      }
      return true;
    },
    [selectedTopics, selectedMentors, selectedSessions, hideFull]
  );

  const filteredUpcoming = useMemo(() => {
    if (isMentor) return props.allProjects ?? [];
    const list = Array.isArray(props.upcomingProjects)
      ? props.upcomingProjects
      : [];
    return list.filter(projectMatchesFilters);
  }, [props.allProjects, props.upcomingProjects, isMentor, projectMatchesFilters]);

  const filteredPast = useMemo(() => {
    if (isMentor) return [];
    const list = Array.isArray(props.pastProjects) ? props.pastProjects : [];
    // For past projects, hideFull is not typically relevant
    return list.filter((proj: any) => projectMatchesFilters({ ...proj, spots: 1 }));
  }, [props.pastProjects, isMentor, projectMatchesFilters]);

  return (
    <>
      <div className="flex flex-col gap-4 w-full p-6">
        {!props.hideHeader && (
          <div className="flex flex-row gap-4 items-center">
            <Image src={logo} alt="logo" width={48} height={48} />
            <h1 className="text-2xl font-bold ">Project Hub</h1>
            {isMentor && (
              <Button
                loadOnClick
                variant="outline"
                onClick={() => router.push("/project-hub/create")}
              >
                Create New Project
              </Button>
            )}
          </div>
        )}
        
        {/* Tab Navigation - Only for Students */}
        {!isMentor && (
          <div className="flex border-b">
            <button
              className={`px-4 py-2 ${activeTab === 'upcoming' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Projects ({props.upcomingProjects?.length || 0})
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'past' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('past')}
            >
              Past Projects ({props.pastProjects?.length || 0})
            </button>
          </div>
        )}
        
        {/* Filters - Only for Students (Dropdown style) */}
        {!isMentor && (
          <div className="flex flex-wrap gap-2 mt-1">
            {/* Topics */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  {(() => {
                    const summary = selectedTopics.slice(0, 2).join(", ");
                    const extra = Math.max(0, selectedTopics.length - 2);
                    return (
                      <span>
                        Topics{selectedTopics.length ? ": " : ""}
                        {summary}
                        {extra > 0 ? `, +${extra}` : ""}
                      </span>
                    );
                  })()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 sm:w-72 max-h-[60vh]">
                <div className="max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                  {facetOptions.topics.length ? (
                    facetOptions.topics.map((t) => (
                      <DropdownMenuCheckboxItem
                        key={t}
                        checked={selectedTopics.includes(t)}
                        onCheckedChange={() =>
                          toggleCsvValue(topicsParam, t, setTopicsParam)
                        }
                      >
                        {t}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No topics available</DropdownMenuItem>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTopicsParam(null)}>
                  Clear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mentors */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  {(() => {
                    const selectedLabels = facetOptions.mentors
                      .filter((m) => selectedMentors.includes(m.value))
                      .map((m) => m.label);
                    const summary = selectedLabels.slice(0, 2).join(", ");
                    const extra = Math.max(0, selectedLabels.length - 2);
                    return (
                      <span>
                        Mentors{selectedLabels.length ? ": " : ""}
                        {summary || (selectedMentors.length ? `${selectedMentors.length} selected` : "")}
                        {extra > 0 ? `, +${extra}` : ""}
                      </span>
                    );
                  })()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 sm:w-72 max-h-[60vh]">
                <div className="max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                  {facetOptions.mentors.length ? (
                    facetOptions.mentors.map(({ value, label }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={selectedMentors.includes(value)}
                        onCheckedChange={() =>
                          toggleCsvValue(mentorsParam, value, setMentorsParam)
                        }
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No mentors available</DropdownMenuItem>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setMentorsParam(null)}>
                  Clear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sessions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  {(() => {
                    const summary = selectedSessions.slice(0, 2).join(", ");
                    const extra = Math.max(0, selectedSessions.length - 2);
                    return (
                      <span>
                        Sessions{selectedSessions.length ? ": " : ""}
                        {summary}
                        {extra > 0 ? `, +${extra}` : ""}
                      </span>
                    );
                  })()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 sm:w-64 max-h-[60vh]">
                <div className="max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                  {facetOptions.sessions.length ? (
                    facetOptions.sessions.map((s) => (
                      <DropdownMenuCheckboxItem
                        key={s}
                        checked={selectedSessions.includes(s)}
                        onCheckedChange={() =>
                          toggleCsvValue(
                            sessionsParam,
                            String(s),
                            setSessionsParam
                          )
                        }
                      >
                        {s} Sessions
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No session options</DropdownMenuItem>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSessionsParam(null)}>
                  Clear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Availability */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <span>
                    Availability{hideFull ? ": Only with spots" : ""}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuCheckboxItem
                  checked={hideFull}
                  onCheckedChange={() => setHideFull(!hideFull)}
                >
                  Hide full projects
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setHideFull(false);
                  }}
                >
                  Clear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(selectedTopics.length || selectedMentors.length || selectedSessions.length || hideFull) && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </div>
        )}

        {/* Project Display */}
        <div className="flex flex-wrap gap-4">
          {isMentor ? (
            // Mentor view: all projects with NewProjectCard
            (props.allProjects ?? []).map((project: any) => (
              <NewProjectCard
                key={project.id}
                package_id={project.id}
                userId={props.userId}
                isMentor={isMentor}
              />
            ))
          ) : (
            // Student view: tabbed interface
            activeTab === 'upcoming' ? (
              (filteredUpcoming ?? []).map((project: any) => (
                <NewProjectCard
                  key={project.id}
                  package_id={project.id}
                  userId={props.userId}
                  isMentor={isMentor}
                  hideFilled={hideFull}
                />
              ))
            ) : (
              (filteredPast ?? []).map((project: any) => (
                <PastProjectCard
                  key={project.id}
                  projectId={project.id}
                  userId={props.userId}
                  isMentor={isMentor}
                />
              ))
            )
          )}
        </div>
      </div>
    </>
  );
}
