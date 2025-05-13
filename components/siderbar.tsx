"use client";

import { cn } from "@/lib/utils";
import { House, Users, LogOut, MessageCircle, Calendar } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { useUser } from "@/app/hooks/useUser";

const options = [
  {
    label: "Home",
    icon: House,
    href: "/home",
  },
  {
    label: "Find Mentors",
    icon: Users,
    href: "/mentors",
  },
  {
    label: "Chats",
    icon: MessageCircle,
    href: "/chats",
  },
];

const mentorOptions = [
  {
    label: "Dashboard",
    icon: Calendar,
    href: "/home",
  },
  {
    label: "Chats",
    icon: MessageCircle,
    href: "/chats",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<string>(pathname);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const { data: user } = useUser();
  const userType = user?.user_metadata?.user_type || "student";
  const finalOptions = userType === "mentor" ? mentorOptions : options;

  return (
    <div className="w-[332px] flex flex-col bg-secondary h-screen">
      <div className="h-20"></div>
      {finalOptions.map((option) => {
        const isActive = selected.startsWith(option.href);
        return (
          <div
            onClick={() => {
              setSelected(option.href);
              router.push(option.href);
            }}
            key={option.href}
            className={cn(
              "cursor-pointer flex flex-row gap-4 pl-7 items-center h-14 text-[#fff3]",
              isActive && "bg-[#2953BE]",
              isActive && "text-white"
            )}
          >
            <option.icon className="text-2xl font-bold" />
            <span className="text-lg font-medium">{option.label}</span>
          </div>
        );
      })}
      <div className="mt-auto mb-8">
        <button
          onClick={handleLogout}
          className="flex flex-row gap-4 pl-7 items-center h-14 text-[#fff3] hover:text-white w-full"
        >
          <LogOut className="text-2xl font-bold" />
          <span className="text-lg font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
