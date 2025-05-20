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

const MentorCard = ({ mentor }: { mentor: any }) => {
  return (
    <div className="flex flex-1 bg-white rounded-2xl border  border-gray-200 ">
      <div className="flex-1 grid grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1 p-6 auto-rows-max">
        <Image
          src={mentor.avatar}
          alt="mentor"
          width={64}
          height={64}
          className="rounded-full row-span-2"
        />
        {/* <div className="h-16 w-16 bg-red-400 rounded-full row-span-2"></div> */}
        <span className="text-xl font-bold self-end">{mentor.name}</span>
        {/* <span className="text-sm text-white bg-[#4A824C] justify-self-start px-2 py-1 rounded-lg self-end">
          95% Match
        </span> */}
        <span className="text-lg col-span-2 capitalize">{mentor.type}</span>
        <div className="col-span-3 mt-2">
          <span className="line-clamp-2">{mentor.bio}</span>
        </div>
        <div className="col-span-3 mt-2 flex flex-wrap gap-3">
          {(mentor.expertise ?? []).map((tag: string) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col border-l border-l-gray-200 w-1/4 min-h-[256px] p-4 pt-6 gap-3">
        {mentor.hourly_rate && (
          <span className="text-xl font-bold">${mentor.hourly_rate}/hour</span>
        )}
        <div className="flex-1"></div>
        <BookingFlow mentor={mentor} />
        <ChatView name={``} mentorId={mentor.id} />
        {/* <Button variant="mutedOutline">View profile</Button> */}
        {/* <GoogleMeetButton /> */}
      </div>
    </div>
  );
};

export default async function SearchPage(props: { mentors: any[] }) {
  return (
    <>
      <div className="flex flex-col gap-4 w-full p-6">
        <div className="flex flex-row gap-4 items-center">
          <Image src={logo} alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-bold ">Find your perfect mentor</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <ProjectCard
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
