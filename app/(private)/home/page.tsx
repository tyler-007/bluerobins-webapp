import Image from "next/image";
import logo from "./mascot.png";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import ScheduleItem from "./ScheduleItem";
import StudentOnboarding from "./StudentOnboarding";
import MentorProfileEdit from "./MentorProfileEdit";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/app/components/NewProjectCard";
import { TimeSlots } from "./TimeSlotItem";
import Link from "next/link";

import SessionList from "./SessionList";

const INITIAL_SESSIONS_COUNT = 4;

export default async function HomePageNew() {
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
  const currentTime = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  const [
    profileResult,
    upcomingBookingsResult,
    pastBookingsResult,
    projectsResult,
  ] = await Promise.allSettled([
    supabase.from(profileKey).select("*").eq("id", user.id).single(),
    supabase
      .from("bookings")
      .select("*")
      .gte("start_time", currentTime)
      .order("start_time", { ascending: true })
      .eq(filterKey, user.id),
    supabase
      .from("bookings")
      .select("*")
      .lt("start_time", currentTime)
      .order("start_time", { ascending: false })
      .eq(filterKey, user.id),
    isMentor
      ? supabase
          .from("projects")
          .select("id")
          .eq("mentor_user", user.id)
          .eq("deleted", false)
      : supabase
          .from("projects")
          .select("id")
          .gte("session_time", dayjs().format("YYYY-MM-DDTHH:mm:ssZ"))
          .eq("deleted", false),
  ]);

  const profile =
    profileResult.status === "fulfilled" ? profileResult.value.data : null;
  const upcomingBookings =
    upcomingBookingsResult.status === "fulfilled"
      ? upcomingBookingsResult.value.data
      : [];
  const pastBookings =
    pastBookingsResult.status === "fulfilled"
      ? pastBookingsResult.value.data
      : [];

  const availability = profile?.availability;

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

  console.log("UPCOMIN:", upcomingBookingsResult);

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
        {/* Upcoming Sessions Section */}
        {upcomingBookings && upcomingBookings.length > 0 ? (
          <SessionList
            sessions={upcomingBookings}
            initialCount={INITIAL_SESSIONS_COUNT}
            userType={userType}
            title="Upcoming Sessions"
          />
        ) : (
          <div className="mt-7">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">
                No Upcoming Sessions
              </h2>
              <p className="text-gray-600">
                {isMentor
                  ? "Create a new project to start mentoring sessions"
                  : "Book a session with a mentor to start learning"}
              </p>
              <Link href={isMentor ? "/project-hub/create" : "/project-hub"}>
                <Button className="mt-4">
                  {isMentor ? "Create Project" : "Find Projects"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Past Sessions Section */}
        {pastBookings && pastBookings.length > 0 ? (
          <SessionList
            sessions={pastBookings}
            initialCount={INITIAL_SESSIONS_COUNT}
            userType={userType}
            title="Past Sessions"
          />
        ) : (
          <div className="mt-7">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No Past Sessions</h2>
              <p className="text-gray-600">
                Your completed sessions will appear here
              </p>
            </div>
          </div>
        )}

        {/* Project Hub Banner Section */}
        {isMentor ? (
          <div className="mt-7">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-8 text-center border border-slate-200">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-gray-800">
                Manage Your Projects
              </h2>
              <p className="text-lg mb-6 text-gray-600">
                Create new learning experiences or manage your existing projects
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/project-hub/create">
                  <Button
                    size="lg"
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    Create New Project
                  </Button>
                </Link>
                <Link href="/project-hub">
                  <Button
                    size="lg"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    View All Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-7">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-8 text-center border border-slate-200">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-gray-800">
                Your Next Project Awaits – Explore & Buy
              </h2>
              <p className="text-lg mb-6 text-gray-600">
                Discover exciting learning opportunities and connect with expert
                mentors
              </p>
              <Link href="/project-hub">
                <Button
                  size="lg"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Explore Project Hub
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      {!isMentor && <StudentOnboarding profile={profile} userId={user.id} />}
      {isMentor && (
        <div className="flex w-[300px] flex-col bg-light border-l-2 border-gray-200 p-5 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex flex-row gap-4 items-center">
              {profile?.photo_url ? (
                <Image
                  src={profile?.photo_url ?? ""}
                  alt="avatar"
                  width={56}
                  height={56}
                  className="rounded-full min-w-16  object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 rounded-full bg-[#B1D1FA] items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold">
                  {user?.user_metadata?.full_name}
                </span>

                <MentorProfileEdit
                  triggerText="Edit Profile"
                  initialStep={0}
                  profile={profile}
                  email={user?.email ?? ""}
                  name={user?.user_metadata?.full_name}
                  userId={user.id}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl flex flex-col flex-1 border border-gray-200 p-3">
            {isMentor && (
              <>
                <div className="flex flex-row gap-4 items-center justify-between">
                  <span className="text-lg font-bold">Timings</span>
                  <MentorProfileEdit
                    triggerText="Edit Timings"
                    initialStep={2}
                    triggerClassName="-mt-0 -ml-0 justify-end"
                    profile={profile}
                    email={user?.email ?? ""}
                    name={user?.user_metadata?.full_name}
                    userId={user.id}
                  />
                </div>
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
