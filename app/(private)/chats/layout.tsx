import ChatScreen from "@/views/ChatView/ChatScreen";
import { User } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import dayjs from "dayjs";

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
    <div className="flex flex-row flex-1">
      <div className="flex flex-1 flex-col gap-2 p-5">
        {/* <ChatScreen channel_id={"WDdRBT_9EiA"} /> */}
        {children}
      </div>
      <div className="flex w-96 flex-col bg-light border-l-2 border-gray-200 p-5 gap-5">
        <h2 className="text-3xl font-bold">Previous Chats</h2>
        <ChatList
          myChannels={channelMembers}
          lastMessageObject={lastMessageObject}
        />
      </div>
    </div>
  );
}

function ChatList({
  myChannels,
  lastMessageObject,
}: {
  myChannels: any;
  lastMessageObject: any;
}) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow divide-y">
      {myChannels.map((chat: any) => (
        <Link
          key={chat.channel_id}
          href={`/chats/${chat.channel_id}`}
          className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
        >
          <Image
            src={chat.avatar}
            alt={chat.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <div className="flex-1 ml-4 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 truncate">
                {chat.name}
              </span>
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                {dayjs(lastMessageObject[chat.channel_id]?.created_at).format(
                  "hh:mm a"
                )}
              </span>
            </div>
            <div className="text-sm text-gray-600 truncate">
              {lastMessageObject[chat.channel_id]?.message ??
                "Hello, how are you?"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
