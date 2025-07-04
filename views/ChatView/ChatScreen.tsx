"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MoreVertical, Paperclip, Mic, Send } from "lucide-react";
import type { Chat, Message } from "@/lib/types";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { chats } from "./sample_data";
import { createClient } from "@/utils/supabase/client";
import { useGetMessages } from "./useGetMessages";
import { useUser } from "@/app/hooks/useUser";

interface ChatScreenProps {
  channel_id: string;
  userId?: string;
  senderId: string;
  receiverId?: string;
  onBack?: () => void;
  receiver: any;
}

const formatMessageDate = (date: Date) => {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMMM d, yyyy");
  }
};

export default function ChatScreen({
  channel_id,
  senderId,
  receiverId,
  onBack,
  receiver,
}: ChatScreenProps) {
  const supabase = createClient();
  const channelMessages = supabase.channel(`channel_messages_${channel_id}`);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [_receiver, setReceiver] = useState<any>(receiver);

  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const { data: oldMessages } = useGetMessages(channel_id, userId);

  useEffect(() => {
    const fetchReceiver = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", receiverId)
        .single();
      setReceiver(data);
    };
    if (receiverId && !_receiver) {
      fetchReceiver();
    }
  }, [receiverId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      message: newMessage,
      from_user: userId,
      created_at: new Date().toISOString(),
    };

    supabase
      .from("channel_messages")
      .insert({
        channel_id,
        message: newMessage,
        from_user: senderId,
        to_user: receiverId,
      })
      .select()
      .then((res) => {});
    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleMessage = async (payload: any) => {
    // console.log("payload", payload.new.from_user, userId);
    if (payload.new.from_user === userId) {
      return;
    }
    if (!payload.old.id && payload.new.id) {
      payload.new.read_by = userId;
      await supabase
        .from("channel_messages")
        .update({ read_by: userId })
        .eq("id", payload.new.id);
      // Push message to ,essages
      setMessages((prev) => [...prev, payload.new]);
    }
  };

  const myAvatar = user?.user_metadata.avatar_url;

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

  const shouldShowDateDivider = (messages: Message[], currentIndex: number) => {
    if (currentIndex === 0) return true;
    if (!messages[currentIndex]) return true;
    const currentDate = new Date(messages[currentIndex].created_at);
    const previousDate = new Date(messages[currentIndex - 1].created_at);

    return !isSameDay(currentDate, previousDate);
  };

  // Combine and sort messages by created_at ascending
  const messagesToShow = [...(oldMessages ?? []), ...messages].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 h-20 ">
        <h2 className="text-2xl font-bold">{_receiver?.name}</h2>
      </div>
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundColor: "#f5f5f500",
          backgroundRepeat: "repeat",
        }}
      >
        {messagesToShow.map((message, index) => {
          return (
            <div key={`${message.id}-${index}`}>
              {shouldShowDateDivider(messagesToShow, index) && (
                <div className="flex justify-center my-4">
                  <div className="bg-white text-gray-600 text-xs px-3 py-1 rounded-lg shadow-sm">
                    {formatMessageDate(new Date(message.created_at))}
                  </div>
                </div>
              )}
              <div
                style={{
                  justifyContent:
                    message.from_user === userId ? "flex-end" : "flex-start",
                }}
                className={`mb-2 flex gap-2`}
              >
                <img
                  src={
                    message.from_user === userId ? myAvatar : _receiver?.avatar
                  }
                  className="w-10 h-10 bg-red-300 rounded-full"
                  style={{
                    order: message.from_user === userId ? 1 : 0,
                  }}
                />

                <div
                  className={`min-w-[40%] max-w-[70%] px-3 py-2 rounded-2xl ${
                    message.from_user === userId
                      ? "bg-chatBlue rounded-tr-none"
                      : "bg-chatOrange rounded-tl-none"
                  }`}
                  style={{
                    order: message.from_user === userId ? 0 : 1,
                  }}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-right text-xs text-gray-500 mt-1">
                    {format(new Date(message.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-3 bg-gray-100 flex items-center">
        {/* <Button variant="ghost" size="icon" className="text-gray-500">
          <Paperclip className="h-5 w-5" />
        </Button> */}
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="mx-2 bg-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          {newMessage.trim() ? (
            <Send className="h-5 w-5 text-emerald-600" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
