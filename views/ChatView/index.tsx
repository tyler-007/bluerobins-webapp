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

export const ChatView = ({ id, name }: { id?: string; name?: string }) => {
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
      const channel_id = await useGetChannelId(id, name);
      setChannelId(channel_id);
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
