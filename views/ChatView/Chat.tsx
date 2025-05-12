"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useGetChannelId } from "./useGetChannelId";
import { createClient } from "@/utils/supabase/client";

export const Chat = ({
  channel_id,
  userId,
}: {
  channel_id: string;
  userId: string;
}) => {
  const supabase = createClient();
  const [chat, setChat] = useState("");
  const [messages, setMessages] = useState<
    { message: string; id: string; from_user: string }[]
  >([]);

  const channelMessages = supabase.channel(`channel_messages_${channel_id}`);

  const handleMessage = async (payload: any) => {
    if (payload.new.from_user === userId) {
      return;
    }
    if (!payload.old.id && payload.new.id) {
      // Push message to ,essages
      setMessages((prev) => [...prev, payload.new]);
    }
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
            filter: `channel_id=eq.${channel_id}`,
          },
          handleMessage
        )
        .subscribe();
    } catch (error) {
      console.error("Error subscribing to channel messages", error);
    }

    return () => {
      supabase.removeChannel(channelMessages);
      //   channelMessages.unsubscribe();
    };
  }, [channel_id]);

  const onSendMessage = async () => {
    setMessages((prev) => [
      ...prev,
      {
        message: chat ?? "",
        from_user: userId ?? "",
        id: Math.random().toString(),
      },
    ]);

    try {
      supabase
        .from("channel_messages")
        .insert({
          channel_id,
          message: chat,
          from_user: userId,
        })
        .select();
    } catch (error) {
      console.error("Error pushing message", error);
    }
    setChat("");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          value={chat}
          type="text"
          placeholder="Chat with mentor"
          onChange={(e) => setChat(e.target.value)}
        />
        <Button onClick={onSendMessage}>Send</Button>
      </div>
      {messages.map((message) => (
        <div key={message.id}>
          <p>{message.message}</p>
          <p>{message.from_user}</p>
        </div>
      ))}
    </>
  );
};
