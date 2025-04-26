"use client";

import { cn } from "@/lib/utils";
import { House, Users } from "lucide-react";
import { usePathname } from "next/navigation";

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

  return (
    <div className="w-[332px] grid auto-rows-min bg-secondary">
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
    </div>
  );
}
