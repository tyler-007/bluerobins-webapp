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
import ProjectCard from "@/app/components/NewProjectCard";
import { TimeSlots } from "./TimeSlotItem";
import MentorSidebar from "./components/MentorSidebar";

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
    return redirect("/");
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
        .select("*, projects(*)")
        .gte("start_time", dayjs().format("YYYY-MM-DDTHH:mm:ssZ"))
        .lte(
          "start_time",
          dayjs().add(17, "days").endOf("day").format("YYYY-MM-DDTHH:mm:ssZ")
        )
        .order("start_time", { ascending: true })
        .eq(filterKey, user.id),
      isMentor
        ? supabase.from("projects").select("*").eq("mentor_user_id", user.id)
        : supabase.from("projects").select("*")
    ]);

  const profile =
    profileResult.status === "fulfilled" ? profileResult.value.data : null;
  const myBookings =
    bookingsResult.status === "fulfilled" ? bookingsResult.value.data : [];
  const projects =
    projectsResult.status === "fulfilled" ? projectsResult.value.data : [];

  // const availability = bookingConfig?.availability;
  const availability = profile?.availability;

  const projectLimit = isMentor ? undefined : undefined;

  if (!profile?.verified && isMentor) {
    return (
      <div className="flex flex-col flex-1 min-h-screen  gap-4 items-center justify-center">
        <h3 className="text-3xl text-center">
          Thanks for signing up as a mentor!
        </h3>
        <p className="text-xl text-gray-500 text-center">
          We're reviewing your details and will notify you once <br />
          your profile is verified and your portal access is activated.
        </p>

        <MentorProfileEdit
          isOnboarding
          triggerText="Verify Profile"
          initialStep={0}
          profile={profile}
          email={user?.email ?? ""}
          name={user?.user_metadata?.full_name}
          triggerClassName="opacity-0"
          userId={user.id}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-1">
      <div className="flex flex-1 flex-col gap-2 p-5 overflow-y-auto">
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
          <span className="text-2xl font-bold">Upcoming Sessions</span>
          {/* {!!myBookings?.length && <span>See All</span>} */}
        </div>
        <div className="flex flex-row flex-wrap gap-4">
          {myBookings?.length ? (
            myBookings.map((booking) => {
              const projectStartDate = booking.projects.start_date
                ? dayjs(booking.projects.start_date)
                : dayjs();
              const sessionDate = dayjs(booking.start_time);
              const weekNumber = sessionDate.diff(projectStartDate, "week") + 1;

              return (
                <ScheduleItem
                  key={booking.id}
                  bookingId={booking.id}
                  mentorId={booking.for}
                  eventId={booking.event_id}
                  eventLink={booking.event_link}
                  userType={userType}
                  studentId={booking.by}
                  title={booking.title}
                  description={booking.description}
                  start_time={booking.start_time}
                  projectId={booking.project_id}
                  weekNumber={weekNumber}
                  status={booking.status}
                />
              );
            })
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 border-dashed border-blue-500 border-2 rounded-2xl">
              <span>No upcoming sessions</span>
            </div>
          )}
        </div>

        <>
          <div className="flex flex-row gap-4 mt-7 items-center justify-between">
            <span className="text-2xl font-bold">
              {isMentor ? "My Projects" : "Recommended Projects"}
            </span>
            {isMentor && (
              <a href="/project-hub/create">
                <Button loadOnClick variant="outline">
                  Create New
                </Button>
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {(projects ?? [])
              .slice(0, projectLimit)
              ?.map((project) => (
                <ProjectCard
                  key={project.id}
                  hideFilled
                  userId={user.id}
                  isMentor={isMentor}
                  package_id={project.id}
                  projectDetails={project}
                />
              ))}
          </div>
        </>
      </div>
      {!isMentor && <StudentOnboarding profile={profile} userId={user.id} />}
      {isMentor && (
        <MentorSidebar
          profile={profile}
          user={user}
          availability={availability}
        />
      )}
    </div>
  );
}
