"use client";

import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const ChatListItem = ({
  id,
  chat,
  lastMessageObject,
  unread_messages_count,
}: {
  chat: any;
  lastMessageObject: any;
  unread_messages_count: any;
  id: string | undefined;
}) => {
  const [hideCount, setHideCount] = useState(false);
  return (
    <Link
      key={chat.channel_id}
      href={`/chats/${chat.channel_id}`}
      onClick={() => setHideCount(true)}
      className={cn(
        "flex items-center px-4 py-3 hover:bg-[#E0E6F6] transition",
        id === chat.channel_id && "bg-[#E0E6F6]"
      )}
    >
      <Image
        src={chat.avatar}
        alt={chat.name}
        width={56}
        height={56}
        className="rounded-full object-cover"
      />
      <div className="flex-1 ml-4 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900 truncate">
            {chat.name}
          </span>
          <span
            className={cn(
              "text-xs text-[#2953BE] ml-2 whitespace-nowrap",
              id === chat.channel_id && "hidden"
            )}
          >
            {dayjs(lastMessageObject[chat.channel_id]?.created_at).format(
              "hh:mm a"
            )}
          </span>
        </div>
        <div
          className={cn(
            "flex justify-between text-gray-600 truncate",
            id === chat.channel_id && "hidden"
          )}
        >
          <span>
            {lastMessageObject[chat.channel_id]?.message ??
              "Click to see messages"}
          </span>
          {unread_messages_count[chat.channel_id] && !hideCount && (
            <div className="h-6 w-6 flex items-center justify-center bg-[#2953BE] text-white text-sm rounded-full">
              <span className="text-sm">
                {unread_messages_count[chat.channel_id]}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function ChatList({
  myChannels,
  lastMessageObject,
  unread_messages_count,
  userId,
}: {
  myChannels: any;
  lastMessageObject: any;
  unread_messages_count: any;
  userId: string;
}) {
  const [count, setCount] = useState(unread_messages_count);
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const supabase = createClient();
  const channelMessages = supabase.channel(`channel_messages_${userId}`);

  const handleMessage = async (payload: any) => {
    console.log("PAYLOAD:", payload);
    const { data: unread_messages } = await supabase
      .from("channel_messages")
      .select("*")
      .eq("to_user", userId)
      .is("read_by", null);

    // Group by channel_id use reduce
    const unread_messages_count = unread_messages?.reduce((acc, curr) => {
      acc[curr.channel_id] = (acc[curr.channel_id] ?? 0) + 1;
      return acc;
    }, {});
    setCount(unread_messages_count);
  };

  useEffect(() => {
    try {
      channelMessages
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "channel_messages",
            filter: `to_user=eq.${userId}`,
          },
          handleMessage
        )
        .subscribe();
    } catch (error) {
      console.error("Error subscribing to channel messages", error);
    }
    return () => {
      supabase.removeChannel(channelMessages);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto divide-y border-[#DDD] border-b">
      {myChannels.map((chat: any) => (
        <ChatListItem
          key={chat.channel_id}
          chat={chat}
          lastMessageObject={lastMessageObject}
          unread_messages_count={count}
          id={id}
        />
      ))}
    </div>
  );
}
