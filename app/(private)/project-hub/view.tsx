import Image from "next/image";
import logo from "../home/mascot.png";

import ProjectCard from "@/app/components/ProjectCard";
import dayjs from "dayjs";
export default async function SearchPage(props: {
  projects: any[];
  isMentor: boolean;
}) {
  const isMentor = props.isMentor;

  return (
    <>
      <div className="flex flex-col gap-4 w-full p-6">
        <div className="flex flex-row gap-4 items-center">
          <Image src={logo} alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-bold ">Find your perfect mentor</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          {props.projects.map((project) => (
            <ProjectCard
              key={project.id}
              package_id={project.id}
              mentor_user={project.mentor_user}
              isMentor={isMentor}
              title={project.title}
              description={project.description}
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
          {/* <ProjectCard
            isMentor={isMentor}
            title="Data Science Project"
            description="Explore how artificial intelligence is transforming learning experiences…"
            tags={["Data science", "8 weeks"]}
            duration="8 weeks"
            sessions={8}
            time="4:00 PM"
            day="Tuesdays"
            startDate="May 14"
            endDate="June 10"
            spotsLeft={1}
            price={839}
          />
          <ProjectCard
            isMentor={isMentor}
            title="Data Science Project"
            description="Explore how artificial intelligence is transforming learning experiences…"
            tags={["Data science", "8 weeks"]}
            duration="8 weeks"
            sessions={8}
            time="4:00 PM"
            day="Tuesdays"
            startDate="May 14"
            endDate="June 10"
            spotsLeft={1}
            price={839}
          />
          <ProjectCard
            isMentor={isMentor}
            title="Data Science Project"
            description="Explore how artificial intelligence is transforming learning experiences…"
            tags={["Data science", "8 weeks"]}
            duration="8 weeks"
            sessions={8}
            time="4:00 PM"
            day="Tuesdays"
            startDate="May 14"
            endDate="June 10"
            spotsLeft={1}
            price={839}
          /> */}
        </div>
      </div>
      {/* <div className="flex min-w-80 relative flex-col  p-5 gap-5  ">
        <div className="bg-white fixed top-4 right-6 w-72 bottom-4  rounded-2xl p-6 border border-gray-200"></div>
      </div> */}
    </>
  );
}
