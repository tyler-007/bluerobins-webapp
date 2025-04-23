import type React from "react";
import {
  Home,
  Search,
  MessageSquare,
  BarChart3,
  Briefcase,
} from "lucide-react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen app-background app-text">
      <main className="flex-1 overflow-auto px-4 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 app-background border-t border-gray-800 flex justify-between items-center px-6 py-3">
        <NavItem icon={<Home size={20} />} label="Home" active />
        <NavItem icon={<Search size={20} />} label="Find tutor" />
        <NavItem icon={<MessageSquare size={20} />} label="Forum" />
        <NavItem icon={<BarChart3 size={20} />} label="Insights" />
        <NavItem icon={<Briefcase size={20} />} label="Careers" />
      </nav>
    </div>
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
