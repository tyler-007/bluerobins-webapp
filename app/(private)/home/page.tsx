import Image from "next/image";
import logo from "./mascot.png";
import { MessageCircle, Video, BookOpen, Compass, User } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import { ChatView } from "@/views/ChatView";
import { useUser } from "@/app/hooks/useUser";
const ScheduleItem = ({
  title,
  description,
  time,
  date,
  mentorId,
}: {
  title: string;
  description: string;
  time: string;
  date: string;
  mentorId: string;
}) => {
  // const { data: user } = useUser();

  return (
    <div className="flex flex-col flex-1 gap-1 bg-white max-w-max rounded-2xl border border-gray-200 p-6 pt-4">
      <div className="flex flex-row gap-4 items-center justify-between">
        <span className="text-sm text-black">{date}</span>
        <span className="bg-[#f0f0f0] rounded-full px-4 py-1 text-sm">
          {time}
        </span>
      </div>
      <span className="text-lg font-bold mt-2">{title}</span>
      <span className="text-sm text-gray-500">{description}</span>
      <div className="flex flex-row flex-1 gap-4 items-center mt-4">
        <ChatView mentorId={mentorId} />
        {/* <ChatView <ChatView name={`s_${user?.id}:m_${mentor.user_id}`} /> /> */}
        {/* <button className="border-[#2953BE] border-[1.5px] text-[#2953BE] rounded-xl px-4 py-1 text-base flex flex-row gap-2 items-center">
          <MessageCircle className="w-5 h-5" />
          <span>Chat</span>
        </button> */}
        <button className="bg-[#2953BE] border-[#2953BE] border-[1.5px] gap-2  text-white rounded-xl px-4 py-1 text-base flex flex-row flex-1 items-center justify-center">
          <Video className="w-5 h-5" />
          <span>Join Meeting</span>
        </button>
      </div>
    </div>
  );
};

const ExploreItem = ({
  title,
  description,
  items,
  buttonLabel,
  Icon,
}: {
  title: string;
  description: string;
  Icon: React.ReactNode;
  items: { label: string }[];
  buttonLabel: string;
}) => {
  return (
    <div className="flex flex-col flex-1 gap-1 bg-white rounded-2xl border border-gray-200 p-6 pt-4">
      <div className="flex flex-row gap-4 items-center">
        <div className="bg-[#FFA50114] rounded-full w-8 h-8 flex items-center justify-center">
          {Icon}
        </div>
        <span className="text-lg font-bold">{title}</span>
      </div>
      <span className="text-sm text-gray-500">{description}</span>
      <div className="flex flex-col gap-4 mt-3">
        {items.map((item) => (
          <div className="flex bg-[#F4F6F7] px-5 py-2 rounded-xl text-foreground text-sm">
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex-1"></div>
      <button className="border-[#10A3E9] border-[1.5px] text-[#10A3E9] rounded-2xl px-4 py-1 text-base flex flex-row gap-2 items-center self-center mt-4">
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
};

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const myBookings = await supabase
    .from("bookings")
    .select("*")
    .eq("by", user.id);

  console.log("My Bookings:", myBookings, user);

  return (
    <div className="flex flex-row flex-1">
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-row gap-4 items-center">
          <Image src={logo} alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-bold ">
            Welcome back,{" "}
            <span className="text-primary">
              {user?.user_metadata?.full_name}
            </span>
          </h1>
        </div>
        <div className="flex flex-row gap-4 mt-7 items-center justify-between">
          <span>Upcoming Schedules</span>
          <span>See All</span>
        </div>
        <div className="flex flex-row flex-wrap gap-4">
          {myBookings.data?.map((booking) => (
            <ScheduleItem
              key={booking.id}
              mentorId={booking.for}
              title="Meeting with mentor"
              description="Research product discussion"
              time={dayjs(booking.start_time).format("h:mm A")}
              date={dayjs(booking.start_time).format("DD MMM YYYY")}
            />
          ))}
        </div>
        {/* <div className="flex flex-row gap-4 mt-6 items-center justify-between">
          <span>Explore</span>
          <span>See All</span>
        </div>
        <div className="flex flex-row gap-4">
          <ExploreItem
            buttonLabel="View Projects"
            title="Color essay workshop"
            items={[
              { label: "Nanoparticles & Parkison’s Research" },
              { label: "Diabetes Prediction ML Model" },
            ]}
            description="Research product discussion"
            Icon={<BookOpen className="w-5 h-5 text-[#FFA501]" />}
          />
          <ExploreItem
            buttonLabel="View Careers"
            title="Career lens"
            description="See what real people did to get where you want to go"
            Icon={<Compass className="w-5 h-5 text-[#FFA501]" />}
            items={[
              { label: "Biochemical Engineering Pathway" },
              { label: "Material Science Reasearch Center" },
            ]}
          />
        </div> */}
        {/* <h1>Home</h1> */}
      </div>
      <div className="flex w-96 flex-col bg-light border-l-2 border-gray-200 p-5 gap-5  ">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex flex-row gap-4 items-center">
            <div className="flex h-14 w-14 rounded-full bg-[#B1D1FA] items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold">
                {user?.user_metadata?.full_name}
              </span>
              <span className="text-[#2953BE]">{user?.email}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl flex-1 border border-gray-200"></div>
      </div>
    </div>
  );
}
