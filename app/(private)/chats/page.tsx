import ChatScreen from "@/views/ChatView/ChatScreen";
import { User } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
const chatData = [
  {
    id: 1,
    avatar: "/avatar1.png",
    name: "Alice Johnson",
    lastMessage: "See you at 3pm!",
    time: "2:45 PM",
  },
  {
    id: 2,
    avatar: "/avatar2.png",
    name: "Bob Smith",
    lastMessage: "Thanks for the update.",
    time: "1:30 PM",
  },
  {
    id: 3,
    avatar: "/avatar3.png",
    name: "Charlie Lee",
    lastMessage: "Let me know if you need anything.",
    time: "Yesterday",
  },
];

export default async function ChatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;
  const { data: myChannels } = await supabase
    .from("channel_members")
    .select("*")
    .eq("user_id", userId);

  return (
    <div className="flex flex-row flex-1">
      <span>Choose a chat</span>
    </div>
  );
}
