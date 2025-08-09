"use client";
import Image from "next/image";
import logo from "../home/mascot.png";

// import ProjectCard from "@/app/components/ProjectCard";
import NewProjectCard from "@/app/components/NewProjectCard";
import PastProjectCard from "@/app/components/PastProjectCard";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
              (props.upcomingProjects ?? []).map((project: any) => (
                <NewProjectCard
                  key={project.id}
                  package_id={project.id}
                  userId={props.userId}
                  isMentor={isMentor}
                />
              ))
            ) : (
              (props.pastProjects ?? []).map((project: any) => (
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
