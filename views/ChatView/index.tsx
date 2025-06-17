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
import { cn } from "@/lib/utils";

export const ChatView = ({
  id,
  name,
  mentorId,
  senderId,
  receiverId,
  triggerClassName = "",
  triggerText = "Start a chat",
}: {
  id?: string;
  triggerClassName?: string;
  name?: string;
  mentorId?: string;
  senderId: string;
  receiverId: string;
  triggerText?: React.ReactNode;
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
      <SheetTrigger className={cn("text-blue-500", triggerClassName)}>
        {triggerText}
      </SheetTrigger>
      <SheetContent side="right" className="outline-none p-0">
        {/* <SheetTitle className="px-4 flex items-center -mt-3 pb-3">
          Personal Chat
        </SheetTitle> */}
        {channel_id && userId && receiver ? (
          <ChatScreen
            channel_id={channel_id}
            userId={userId}
            senderId={senderId}
            receiverId={receiverId}
            onBack={() => {}}
            receiver={receiver}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-gray-500">Loading...</span>
          </div>
        )}
        {/* <div className="h-[16px]">
          <Button>Open</Button>
        </div> */}
      </SheetContent>
    </Sheet>
  );
};
