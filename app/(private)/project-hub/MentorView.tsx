import { Search, GraduationCap, Filter, BookOpen, Video } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import MentorItem from "@/components/MentorItem";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import logo from "../home/mascot.png";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Chip from "@/components/chip";
import { Button } from "@/components/ui/button";
import { ChatView } from "@/views/ChatView/index";
import { BookingFlow } from "@/views/BookingFlow/index";
import { GoogleMeetButton } from "@/components/GoogleMeetButton";
import ProjectCard from "@/app/components/ProjectCard";

export default async function SearchPage(props: { mentors: any[] }) {
  const isMentor = false;
  return (
    <>
      <div className="flex flex-col gap-4 w-full p-6">
        <div className="flex flex-row gap-4 items-center">
          <Image src={logo} alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-bold ">Find your perfect mentor</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <ProjectCard
            isMentor={isMentor}
            title="Data Science Project"
            description="Explore how artificial intelligence is transforming learning experiences"
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
        </div>
      </div>
      {/* <div className="flex min-w-80 relative flex-col  p-5 gap-5  ">
        <div className="bg-white fixed top-4 right-6 w-72 bottom-4  rounded-2xl p-6 border border-gray-200"></div>
      </div> */}
    </>
  );
}
