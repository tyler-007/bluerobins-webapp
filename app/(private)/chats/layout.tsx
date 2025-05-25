import ChatScreen from "@/views/ChatView/ChatScreen";
import { User } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import dayjs from "dayjs";
import ChatList from "./ChatList";
export default async function ChatsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;
  const { data: myChannels } = await supabase
    .from("channel_members")
    .select("*")
    .eq("user_id", userId);

  const { data: channelMembers } = await supabase
    .from("channel_members")
    .select("*, ...profiles(name, avatar)")
    .in(
      "channel_id",
      (myChannels ?? []).map((channel) => channel.channel_id)
    )
    .neq("user_id", userId);

  // Get last message from each channel
  const { data: lastMessages } = await supabase
    .from("last_channel_messages")
    .select("*")
    .in(
      "channel_id",
      (myChannels ?? []).map((channel) => channel.channel_id)
    );

  const lastMessageObject = lastMessages?.reduce((acc, curr) => {
    acc[curr.channel_id] = curr;
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1">
      <div
        className="flex items-center justify-between h-20 pl-10 bg-[#EBF8FF] border-b-2 border-[#DDD];
"
      >
        <h2 className="text-3xl font-bold">Previous Chats</h2>
      </div>
      <div className="flex flex-row flex-1 bg-[#EEF2FB]">
        <div className="flex flex-[2] flex-col bg-light border-r-2 border-[#DDD]">
          {/* <div className="flex h-20 border-[#DDD] border-b"></div> */}
          <ChatList
            myChannels={channelMembers}
            lastMessageObject={lastMessageObject}
          />
        </div>
        <div className="flex flex-[3] flex-col">
          {/* <ChatScreen channel_id={"WDdRBT_9EiA"} /> */}
          {children}
        </div>
      </div>
    </div>
  );
}
