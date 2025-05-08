"use client";

import { cn } from "@/lib/utils";
import { House, Users, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

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
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="w-[332px] grid auto-rows-min bg-secondary h-screen">
      <div className="h-20"></div>
      {options.map((option) => {
        const isActive = option.href.startsWith(pathname);
        return (
          <div
            key={option.href}
            className={cn(
              "flex flex-row gap-4 pl-7 items-center h-14 text-[#fff3]",
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
