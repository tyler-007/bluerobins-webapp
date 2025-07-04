"use client";
import Image from "next/image";
import logo from "../home/mascot.png";

// import ProjectCard from "@/app/components/ProjectCard";
import NewProjectCard from "@/app/components/NewProjectCard";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProjectHubView(props: {
  projects: any;
  userId: string;
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
          {(props.projects ?? []).map((project: any) => (
            <NewProjectCard
              key={project.id}
              package_id={project.id}
              userId={props.userId}
              isMentor={props.isMentor}
              projectDetails={project}
            />
          ))}
        </div>
      </div>
    </>
  );
}
