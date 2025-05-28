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
import StudentOnboarding from "./StudentOnboarding";
import MentorProfileEdit from "./MentorProfileEdit";
import { Button } from "@/components/ui/button";
import ProjectHubView from "../project-hub/view";
import ProjectCard from "@/app/components/ProjectCard";
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
        <span className="text-sm text-gray-500">Unavailable</span>
      ) : (
        (availability ?? []).map((item: any, index: number) => (
          <>
            {index > 0 && <div />}
            <span>
              {dayjs(`2024-01-01T${item.start}`).format("h:mm A")} -{" "}
              {dayjs(`2024-01-01T${item.end}`).format("h:mm A")}
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

  const profileKey = isMentor ? "mentor_profiles" : "student_profiles";

  console.log("PROFILE KEY:", profileKey, user.id);

  const [profileResult, bookingsResult, projectsResult] =
    await Promise.allSettled([
      supabase.from(profileKey).select("*").eq("id", user.id).single(),
      supabase
        .from("bookings")
        .select("*")
        .gte("start_time", dayjs().format("YYYY-MM-DDTHH:mm:ssZ"))
        .order("start_time", { ascending: true })
        .eq(filterKey, user.id),
      supabase.from("projects").select("*").eq("mentor_user", user.id),
    ]);

  const profile =
    profileResult.status === "fulfilled" ? profileResult.value.data : null;
  const myBookings =
    bookingsResult.status === "fulfilled" ? bookingsResult.value.data : [];
  const projects =
    projectsResult.status === "fulfilled" ? projectsResult.value.data : [];

  // const availability = bookingConfig?.availability;
  const availability = profile?.availability;
  console.log("myBookings:", myBookings);

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
          <span className="text-2xl font-bold">Upcoming Schedules</span>
          {/* {!!myBookings?.length && <span>See All</span>} */}
        </div>
        <div className="flex flex-row flex-wrap gap-4">
          {myBookings?.length ? (
            myBookings?.map((booking) => (
              <ScheduleItem
                key={booking.id}
                mentorId={booking.for}
                eventLink={booking.event_link}
                userType={userType}
                studentId={booking.by}
                description="Research product discussion"
                time={dayjs(booking.start_time).format("h:mm A")}
                date={dayjs(booking.start_time).format("DD MMM YYYY")}
              />
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 border-dashed border-blue-500 border-2 rounded-2xl">
              <span>No upcoming schedules</span>
            </div>
          )}
        </div>
        {isMentor && (
          <>
            <div className="flex flex-row gap-4 mt-7 items-center justify-between">
              <span className="text-2xl font-bold">Project Hubs</span>
              <a href="/project-hub/create">
                <Button loadOnClick variant="outline">
                  Create New
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap gap-4">
              {projects?.map((project) => (
                <ProjectCard
                  key={project.id}
                  package_id={project.id}
                  mentor_user={project.mentor_user}
                  mentor={project.mentor}
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
                    isMentor
                      ? project.spots
                      : project.spots - project.filled_spots
                  }
                  price={isMentor ? project.cost_price : project.selling_price}
                  agenda={project.agenda}
                  tools={project.tools}
                  prerequisites={project.prerequisites}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {isMentor && (
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
                {isMentor ? (
                  <MentorProfileEdit
                    profile={profile}
                    email={user?.email ?? ""}
                    name={user?.user_metadata?.full_name}
                    userId={user.id}
                  />
                ) : (
                  <StudentOnboarding profile={profile} userId={user.id} />
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl flex-1 border border-gray-200 p-3">
            {isMentor && (
              <>
                <span className="text-lg font-bold">Timings</span>
                <div className="grid grid-cols-[auto_1fr] gap-2 gap-y-1 items-center">
                  <TimeSlots availability={availability?.Sunday} day="Sunday" />
                  <TimeSlots availability={availability?.Monday} day="Monday" />
                  <TimeSlots
                    availability={availability?.Tuesday}
                    day="Tuesday"
                  />
                  <TimeSlots
                    availability={availability?.Wednesday}
                    day="Wednesday"
                  />
                  <TimeSlots
                    availability={availability?.Thursday}
                    day="Thursday"
                  />
                  <TimeSlots availability={availability?.Friday} day="Friday" />
                  <TimeSlots
                    availability={availability?.Saturday}
                    day="Saturday"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
