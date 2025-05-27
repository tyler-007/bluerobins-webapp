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
  senderId,
  receiverId,
}: {
  id?: string;
  name?: string;
  mentorId?: string;
  senderId: string;
  receiverId: string;
}) => {
  const { data: user } = useUser();
  const userId = user?.id;
  const [channel_id, setChannelId] = useState("");
  const [receiver, setReceiver] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchReceiver = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", receiverId)
        .single();
      setReceiver(data);
    };
    if (receiverId) {
      fetchReceiver();
    }
  }, [receiverId]);

  const onOpenChange = async (open: boolean) => {
    if (open) {
      if (!name && mentorId) {
        name = `s_${userId}:m_${mentorId}`;
      }
      const channel_id = await useGetChannelId(id, name);
      console.log("channel_id", channel_id);
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
        {channel_id && userId && receiver && (
          <ChatScreen
            channel_id={channel_id}
            userId={userId}
            senderId={senderId}
            receiverId={receiverId}
            onBack={() => {}}
            receiver={receiver}
          />
        )}
        {/* <div className="h-[16px]">
          <Button>Open</Button>
        </div> */}
      </SheetContent>
    </Sheet>
  );
};
