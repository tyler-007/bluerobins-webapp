"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useGetChannelId } from "./useGetChannelId";
import { Chat } from "./Chat";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ChatScreen from "./ChatScreen";

export const ChatView = () => {
  const [channel_id, setChannelId] = useState("");
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const supabase = createClient();
  //   const channel_id = useGetChannelId("test", "test", "test");
  //   console.log(channel_id);
  // id
  // Get chat details
  // If chat not present create

  const onOpenChange = async (open: boolean) => {
    if (open) {
      const channel_id = await useGetChannelId(
        "WDdRBT_9EiA",
        "test",
        "test",
        "test"
      );
      setChannelId(channel_id);
      console.log(channel_id);
    }
  };

  const setUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id);
  };

  useEffect(() => {
    setUser();
  }, []);

  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent side="bottom" className="outline-none h-[95vh] px-0">
        <SheetTitle className="px-4 flex items-center -mt-3 pb-3">
          Personal Chat
        </SheetTitle>
        {channel_id && userId && (
          <ChatScreen
            channel_id={channel_id}
            userId={userId}
            onBack={() => {}}
          />
        )}
        <div className="h-[16px]">
          <Button>Open</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
