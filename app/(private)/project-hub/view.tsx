"use client";
import Image from "next/image";
import logo from "../home/mascot.png";

import ProjectCard from "@/app/components/ProjectCard";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProjectHubView(props: {
  projects: any;
  isMentor: boolean;
  hideHeader?: boolean;
}) {
  const isMentor = props.isMentor;
  const router = useRouter();

  console.log("PROJECTS:", props.projects);

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
        <div className="flex flex-wrap gap-4">
          {props.projects.map((project: any) => (
            <ProjectCard
              key={project.id}
              package_id={project.id}
              mentor_user={project.mentor_user}
              isMentor={isMentor}
              title={project.title}
              description={project.description}
              mentor={project.mentor}
              tags={project.categories}
              duration={`${project.sessions_count} weeks`}
              sessions={project.sessions_count}
              time={dayjs(project.session_time).format("hh:mm A")}
              day={project.session_day}
              startDate={dayjs(project.start_date).format("MMM D, YYYY")}
              endDate={dayjs(project.start_date)
                .add(project.sessions_count, "week")
                .format("MMM D, YYYY")}
              spotsLeft={
                isMentor ? project.spots : project.spots - project.filled_spots
              }
              price={isMentor ? project.cost_price : project.selling_price}
              agenda={project.agenda}
              tools={project.tools}
              prerequisites={project.prerequisites}
            />
          ))}
        </div>
      </div>
    </>
  );
}
