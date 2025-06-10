import ChatScreen from "@/views/ChatView/ChatScreen";
import { User } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

export default async function ChatsPage() {
  const supabase = await createClient();

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="flex items-center justify-center p-6 border-dashed border-blue-500 border-2 rounded-2xl">
        <span>No Chat chosen</span>
      </div>
    </div>
  );
}
