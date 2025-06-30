import ChatScreen from "@/views/ChatView/ChatScreen";
import { User } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ChatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;
  const { data: myChannels } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", userId);

  const { data: channelMembers } = await supabase
    .from("channel_members")
    .select("channel_id")
    .in(
      "channel_id",
      (myChannels ?? []).map((channel) => channel.channel_id)
    )
    .neq("user_id", userId)
    .limit(1);

  // if (channelMembers && channelMembers.length > 0) {
  //   redirect(`/chats/${channelMembers[0].channel_id}`);
  // }

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="flex items-center justify-center p-6 border-dashed border-blue-500 border-2 rounded-2xl">
        <span>No Chat chosen</span>
      </div>
    </div>
  );
}
