import ChatScreen from "@/views/ChatView/ChatScreen";
import { User } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import ChatList from "./ChatList";
import { OtherMentorChatItem } from "./OtherMentorChatItem";

export default async function ChatsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userType = user?.user_metadata?.user_type;
  const isMentor = userType === "mentor";

  const userId = user?.id;

  // Step 1: Get the IDs of all channels the current user is a member of.
  const { data: myChannels } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", userId);

  const myChannelIds = (myChannels ?? []).map((c) => c.channel_id);

  // Step 2: Get the other members in those channels (their user_id and which channel they belong to).
  const { data: channelMembers } = await supabase
    .from("channel_members")
    .select("user_id, channel_id")
    .in("channel_id", myChannelIds)
    .neq("user_id", userId);

  // Step 3: Get the profiles for those other members.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar")
    .in("id", (channelMembers ?? []).map((m) => m.user_id));

  // Step 4: Combine the data into a single array that's easy to render.
  const chatsToDisplay = (channelMembers ?? []).map((member) => {
    const profile = profiles?.find((p) => p.id === member.user_id);
    return {
      channel_id: member.channel_id,
      user_id: member.user_id,
      name: profile?.name,
      avatar: profile?.avatar,
    };
  });

  const { data: otherMentors } = await supabase
    .from("mentor_profiles")
    .select("...profiles(name, id, avatar)");

  // Get last message from each channel
  const { data: lastMessages } = await supabase
    .from("last_channel_messages")
    .select("*")
    .in(
      "channel_id",
      (myChannels ?? []).map((channel) => channel.channel_id)
    );

  const { data: unread_messages } = await supabase
    .from("channel_messages")
    .select("*")
    .eq("to_user", userId)
    .is("read_by", null);

  // Group by channel_id use reduce
  const unread_messages_count = unread_messages?.reduce((acc, curr) => {
    acc[curr.channel_id] = (acc[curr.channel_id] ?? 0) + 1;
    return acc;
  }, {});

  const lastMessageObject = lastMessages?.reduce((acc, curr) => {
    acc[curr.channel_id] = curr;
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1">
      <div
        className="flex items-center justify-between h-20 pl-10 bg-[#EBF8FF] border-b-2 border-[#DDD];
"
      >
        <h2 className="text-3xl font-bold">Chats</h2>
      </div>
      <div className="flex flex-row flex-1 bg-[#EEF2FB]">
        <div className="flex flex-[2] flex-col bg-light border-r-2 border-[#DDD]">
          {/* Blue Robins Support always at the top */}
          <div className="w-full max-w-md mx-auto divide-y border-[#DDD] border-b">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=support@bluerobins.com"
              target="_blank"
              className="flex items-center px-4 py-3 gap-2 hover:bg-[#E0E6F6] transition"
            >
              <div className="h-8 w-8 rounded-full bg-[#2953BE] flex items-center justify-center" />
              <h4>Blue Robins Support</h4>
            </a>
          </div>
          {/* Chats section for real users */}
          <h3 className="text-xl font-bold p-3 px-6">Chats</h3>
          <div className="w-full max-w-md mx-auto divide-y border-[#DDD] border-b">
            {chatsToDisplay.map((other) => (
              <a
                key={other.channel_id}
                href={`/chats/${other.channel_id}`}
                className="flex items-center px-4 py-3 gap-2 hover:bg-[#E0E6F6] transition"
              >
                <Image
                  src={other.avatar || "/logo.png"}
                  alt={other.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <h4>{other.name || other.user_id}</h4>
              </a>
            ))}
          </div>
          {!isMentor && (
            <>
              <div className="w-full max-w-md mx-auto divide-y border-[#DDD] border-b">
                {otherMentors
                  ?.filter(
                    (mentor) =>
                      !channelMembers?.some(
                        (channel) => channel.user_id === mentor.id
                      )
                  )
                  .map((mentor) => (
                    <OtherMentorChatItem key={mentor.id} mentor={mentor} />
                  ))}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-[3] flex-col">{children}</div>
      </div>
    </div>
  );
}
