"use client";

import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
export default function ChatList({
  myChannels,
  lastMessageObject,
  unreadCount,
}: {
  myChannels: any;
  lastMessageObject: any;
  unreadCount?: number;
}) {
  const { id } = useParams();
  return (
    <div className="w-full max-w-md mx-auto divide-y border-[#DDD] border-b">
      {myChannels.map((chat: any) => (
        <Link
          key={chat.channel_id}
          href={`/chats/${chat.channel_id}`}
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
              {unreadCount && (
                <div className="h-6 w-6 flex items-center justify-center bg-[#2953BE] text-white text-sm rounded-full">
                  <span className="text-sm">{unreadCount}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
