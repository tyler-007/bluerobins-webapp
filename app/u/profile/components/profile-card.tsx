import Image from "next/image";
import { Building } from "lucide-react";

export default function ProfileCard() {
  return (
    <div className="bg-[#111827] rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="relative">
            <Image
              src="/placeholder.svg?height=50&width=50"
              alt="Profile"
              width={50}
              height={50}
              className="rounded-full border-2 border-[#3b82f6]"
            />
          </div>
          <div className="ml-3">
            <h2 className="font-bold text-lg">Alica Johnson</h2>
            <div className="flex items-center text-gray-400 text-sm">
              <Building size={14} className="mr-1" />
              <span>Palo Alto High School</span>
            </div>
          </div>
        </div>
        <div className="text-[#3b82f6]">
          <span className="text-sm">View</span>
          <span className="ml-1">›</span>
        </div>
      </div>

      <div className="flex justify-between">
        <NavButton icon="🎓" label="Academics" />
        <NavButton icon="📚" label="Courses" />
        <NavButton icon="❤️" label="Hobbies" />
      </div>
    </div>
  );
}

function NavButton({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex-1 bg-[#1a2234] rounded-lg py-3 mx-1 flex flex-col items-center justify-center">
      <span className="text-lg">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </div>
  );
}
