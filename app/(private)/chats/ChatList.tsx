"use client";

import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
export default function ChatList({
  myChannels,
  lastMessageObject,
}: {
  myChannels: any;
  lastMessageObject: any;
}) {
  const { id } = useParams();
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow divide-y">
      {myChannels.map((chat: any) => (
        <Link
          key={chat.channel_id}
          href={`/chats/${chat.channel_id}`}
          className={cn(
            "flex items-center px-4 py-3 hover:bg-gray-50 transition",
            id === chat.channel_id && "bg-primary/10"
          )}
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
              <span
                className={cn(
                  "text-xs text-gray-400 ml-2 whitespace-nowrap",
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
                "text-sm text-gray-600 truncate",
                id === chat.channel_id && "hidden"
              )}
            >
              {lastMessageObject[chat.channel_id]?.message ??
                "Hello, how are you?"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
