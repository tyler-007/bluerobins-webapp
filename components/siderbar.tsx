"use client";

import { cn } from "@/lib/utils";
import {
  House,
  Users,
  LogOut,
  MessageCircle,
  Calendar,
  BookOpen,
  HelpCircle,
} from "lucide-react";
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
  // {
  //   label: "Find Mentors",
  //   icon: Users,
  //   href: "/mentors",
  // },
  {
    label: "Chats",
    icon: MessageCircle,
    href: "/chats",
    showCount: true,
  },
  {
    label: "Project Hub",
    icon: BookOpen,
    href: "/project-hub",
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
    showCount: true,
  },
  {
    label: "Project Hub",
    icon: BookOpen,
    href: "/project-hub",
  },
];

export default function Sidebar({
  verified,
  unread_messages_count,
}: {
  verified: boolean;
  unread_messages_count: number;
}) {
  const [hideCount, setHideCount] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<string>(pathname);
  const handleLogout = async () => {
    window?.localStorage?.clear();
    window?.localStorage?.removeItem("mentor_onboarded");
    await supabase.auth.signOut();
    router.push("/");
  };

  const { data: user } = useUser();
  const userType = user?.user_metadata?.user_type || "student";
  const finalOptions = userType === "mentor" ? mentorOptions : options;

  return (
    <div className="w-[300px] flex flex-col bg-secondary h-screen">
      <div className="h-20"></div>
      {verified &&
        finalOptions.map((option) => {
          const isActive = selected.startsWith(option.href);
          return (
            <div
              onClick={() => {
                if (option.showCount && !!unread_messages_count) {
                  setHideCount(true);
                }
                setSelected(option.href);
                router.push(option.href);
              }}
              key={option.href}
              className={cn(
                "cursor-pointer flex flex-row gap-4 pl-7 items-center h-14 text-[#ffff]",
                isActive && "bg-[#2953BE]",
                isActive && "text-white"
              )}
            >
              <option.icon className="text-2xl font-bold" />
              <h3 className="text-xl font-medium">{option.label}</h3>
              {!hideCount && option.showCount && !!unread_messages_count && (
                <div className="ml-auto mr-4 h-6 w-6 flex items-center justify-center bg-[#2953BE] text-white text-sm rounded-full">
                  <span className="text-sm">{unread_messages_count}</span>
                </div>
              )}
            </div>
          );
        })}
      <div className="mt-auto mb-8 ">
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=support@bluerobins.com"
          target="_blank"
          className="flex flex-row gap-4 pl-7 items-center h-14 text-[#fffA] hover:text-white w-full"
        >
          <HelpCircle className="text-2xl font-bold" />
          <h3 className="text-xl font-medium">Support</h3>
        </a>
        <button
          onClick={handleLogout}
          className="flex flex-row gap-4 pl-7 items-center h-14 text-[#fffA] hover:text-white w-full"
        >
          <LogOut className="text-2xl font-bold" />
          <h3 className="text-xl font-medium">Logout</h3>
        </button>
      </div>
    </div>
  );
}
