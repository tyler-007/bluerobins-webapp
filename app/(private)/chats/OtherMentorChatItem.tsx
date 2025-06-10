"use client";

import { useUser } from "@/app/hooks/useUser";
import { useGetChannelId } from "@/views/ChatView/useGetChannelId";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export const OtherMentorChatItem = ({ mentor }: { mentor: any }) => {
  const { data: user } = useUser();
  const userId = user?.id;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const name = `s_${userId}:m_${mentor.id}`;
      const channel_id = await useGetChannelId(name);
      //   const channel_id = "lPDGpN5xo3c";

      router.push(`/chats/${channel_id}`);
    } catch (error) {
      console.error("Error navigating to chat:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, mentor.id]);

  return (
    <div
      key={mentor.id}
      className="flex items-center px-4 py-3 gap-2 cursor-pointer hover:bg-[#E0E6F6] transition relative"
      onClick={onClick}
    >
      <Image
        src={mentor.avatar}
        alt={mentor.name}
        width={32}
        height={32}
        className="rounded-full object-cover"
      />
      <h4>{mentor.name}</h4>
      {isLoading && (
        <div className="absolute right-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
