"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

  const onSendMessage = () => {
    channelMessages.send({
      type: "broadcast",
      event: "message",
      payload: { message: chat, from_user: userId },
    });
    setChat("");
  };

  useEffect(() => {
    channelMessages
      .on("broadcast", { event: "message" }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .subscribe();
  }, []);

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
