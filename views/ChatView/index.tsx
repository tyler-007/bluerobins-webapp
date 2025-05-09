"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useGetChannelId } from "./useGetChannelId";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ChatScreen from "./ChatScreen";
import { useUser } from "@/app/hooks/useUser";

export const ChatView = ({
  id,
  name,
  mentorId,
}: {
  id?: string;
  name?: string;
  mentorId?: string;
}) => {
  const { data: user } = useUser();
  console.log("USER:", user);
  if (!id || !name) {
    // id = `s_${user?.id}:m_${mentorId}`;
    name = `s_${user?.id}:m_${mentorId}`;
  }
  const userId = user?.id;
  const [channel_id, setChannelId] = useState("");

  const onOpenChange = async (open: boolean) => {
    if (open) {
      const channel_id = await useGetChannelId(id, name);
      setChannelId(channel_id);
    }
  };

  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger>
        <Button variant="outline" className="w-full">
          Start a chat
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="outline-none p-0">
        {/* <SheetTitle className="px-4 flex items-center -mt-3 pb-3">
          Personal Chat
        </SheetTitle> */}
        {channel_id && userId && (
          <ChatScreen
            channel_id={channel_id}
            userId={userId}
            // channel_id={"ey7ZtLSlKCs"}
            // userId={"f9f39868-8211-4118-8284-4d1b1cc1a322"}
            onBack={() => {}}
          />
        )}
        {/* <div className="h-[16px]">
          <Button>Open</Button>
        </div> */}
      </SheetContent>
    </Sheet>
  );
};
