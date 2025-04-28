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
const MentorCard = ({ mentor }: { mentor: any }) => {
  return (
    <div className="flex flex-1 bg-white rounded-2xl border  border-gray-200 ">
      <div className="flex-1 grid grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1 p-6 auto-rows-max">
        <div className="h-16 w-16 bg-red-400 rounded-full row-span-2"></div>
        <span className="text-xl font-bold self-end">John Doe</span>
        <span className="text-sm text-white bg-[#4A824C] justify-self-start px-2 py-1 rounded-lg self-end">
          95% Match
        </span>
        <span className="text-lg col-span-2">Software Engineer</span>
        <div className="col-span-3 mt-2">
          <span className="line-clamp-2">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ut dolorem
            nesciunt illum nulla dicta aut sit consequuntur commodi inventore
            nisi? Assumenda veritatis animi id velit laborum est corrupti vel
            voluptate.
          </span>
        </div>
        <div className="col-span-3 mt-2 flex flex-wrap gap-3">
          <Chip>AI Research</Chip>
          <Chip>Deep Learning</Chip>
          <Chip>Art & Design</Chip>
          <Chip>Software Engineering</Chip>
          <Chip>Product Design</Chip>
        </div>
      </div>
      <div className="flex flex-col border-l border-l-gray-200 w-1/4 min-h-[256px] p-4 pt-6 gap-3">
        <span className="text-xl font-bold">$200/hour</span>
        <div className="flex-1"></div>
        <BookingFlow mentor={mentor} />
        <ChatView name={`test`} />
        <Button variant="mutedOutline">View profile</Button>
      </div>
    </div>
  );
};

export default async function SearchPage(props: { mentors: any[] }) {
  const filteredGraduates = props.mentors.filter(
    (mentor) => mentor.type === "graduate"
  );

  // console.log("GF", props.mentors, filteredGraduates);
  const filteredProfessors = props.mentors.filter(
    (mentor) => mentor.type === "professor"
  );

  return (
    <>
      <div className="flex flex-col gap-4 w-full p-6">
        <div className="flex flex-row gap-4 items-center">
          <Image src={logo} alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-bold ">Find your perfect mentor</h1>
        </div>
        <Input
          placeholder="Search by expertise, interest or mentor name"
          className="w-full py-6 text-xl"
        />
        <div className="flex flex-row gap-4 mt-2 items-center">
          <span>All</span>
          <span>Popular</span>
          <span>Recent</span>
        </div>
        <div className="flex flex-1 flex-row gap-4 relative">
          {/* <div className="flex flex-col fixed bottom-0 top-[200px] w-[320px] gap-1 bg-white rounded-2xl border border-gray-200 p-6 pt-4" /> */}
          <div className="flex flex-col flex-1 gap-4 -mb-6 overflow-y-auto border-gray-200 ">
            {filteredGraduates.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-w-80 relative flex-col  p-5 gap-5  ">
        <div className="bg-white fixed top-4 right-6 w-72 bottom-4  rounded-2xl p-6 border border-gray-200"></div>
      </div>
    </>
  );
}
