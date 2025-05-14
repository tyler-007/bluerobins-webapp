import Image from "next/image";
import logo from "./mascot.png";
import { MessageCircle, Video, BookOpen, Compass, User } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import { ChatView } from "@/views/ChatView";
import { useUser } from "@/app/hooks/useUser";
import { useProfile } from "@/app/hooks/useProfile";
import ScheduleItem from "./ScheduleItem";
import StudentProfileEdit from "./StudentProfileEdit";
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

const TimeSlots = ({
  availability,
  day,
}: {
  availability: any;
  day: string;
}) => {
  return (
    <>
      <span>{day}</span>
      {!availability?.length ? (
        <span>Unavailable</span>
      ) : (
        (availability ?? []).map((item: any, index: number) => (
          <>
            {index > 0 && <div />}
            <span>
              {item.start} - {item.end}
            </span>
          </>
        ))
      )}
      <div className="flex col-span-2 h-1"></div>
    </>
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

  const userType = user?.user_metadata?.user_type;
  const isMentor = userType === "mentor";
  const filterKey = isMentor ? "for" : "by";

  const myBookings = await supabase
    .from("bookings")
    .select("*")
    .eq(filterKey, user.id);

  const { data: bookingConfig } = await supabase
    .from("booking_configs")
    .select("*")
    .eq("user_id", "f9f39868-8211-4118-8284-4d1b1cc1a322")
    .single();

  const availability = bookingConfig?.availability;

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
              userType={userType}
              studentId={booking.by}
              description="Research product discussion"
              time={dayjs(booking.start_time).format("h:mm A")}
              date={dayjs(booking.start_time).format("DD MMM YYYY")}
            />
          ))}
        </div>
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
              <StudentProfileEdit />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl flex-1 border border-gray-200 p-3">
          {isMentor && (
            <>
              <span className="text-lg font-bold">Timings</span>
              <div className="grid grid-cols-[auto_1fr] gap-2 gap-y-1">
                <TimeSlots availability={availability?.sunday} day="Sunday" />
                <TimeSlots availability={availability?.monday} day="Monday" />
                <TimeSlots availability={availability?.tuesday} day="Tuesday" />
                <TimeSlots
                  availability={availability?.wednesday}
                  day="Wednesday"
                />
                <TimeSlots
                  availability={availability?.thursday}
                  day="Thursday"
                />
                <TimeSlots availability={availability?.friday} day="Friday" />
                <TimeSlots
                  availability={availability?.saturday}
                  day="Saturday"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
