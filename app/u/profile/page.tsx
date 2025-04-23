import type React from "react";
import ProfileCard from "@/app/u/profile/components/profile-card";
import EmptyStateCard from "@/app/u/profile/components/empty-state-card";

export default function HomePage() {
  return (
    <>
      <ProfileCard />

      <EmptyStateCard
        icon="lesson"
        title="No Lessons Scheduled Yet!"
        description="Kickstart your learning journey, schedule your first lesson now!"
        buttonText="Find a mentor"
      />

      <EmptyStateCard
        icon="chat"
        title="No Chats Yet!"
        description="Start a chat with a mentor"
        buttonText="Start a chat"
      />

      <EmptyStateCard
        icon="lesson"
        title="All Sessions Empty"
        description="Kickstart your learning journey, schedule your first session now!"
        buttonText="Find a mentor"
      />

      <EmptyStateCard
        icon="chat"
        title="No Saved Insights Yet"
        description=""
        buttonText=""
        showButton={false}
      />
    </>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`${active ? "text-[#3b82f6]" : "text-gray-400"}`}>
        {icon}
      </div>
      <span
        className={`text-xs mt-1 ${active ? "text-[#3b82f6]" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}
