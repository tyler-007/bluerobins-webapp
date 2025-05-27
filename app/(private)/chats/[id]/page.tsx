import ChatScreen from "@/views/ChatView/ChatScreen";
import { createClient } from "@/utils/supabase/server";

export default async function ChatPage({ params }: any) {
  const id = (await params).id;
  const supabase = await createClient();

  const { data: channelMembers } = await supabase
    .from("channel_members")
    .select("*, ...profiles(name, avatar)")
    .eq("channel_id", id);

  const { data: user } = await supabase.auth.getUser();

  const receiverId = (channelMembers ?? [])
    .map((member) => member.user_id)
    .filter((member) => member !== user?.user?.id)[0];

  const receiver = (channelMembers ?? []).find(
    (member) => member.user_id === receiverId
  );

  return (
    <ChatScreen
      receiver={receiver}
      channel_id={id}
      senderId={user?.user?.id ?? ""}
      receiverId={receiverId}
    />
  );
}
