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
  const { data: myChannels } = await supabase
    .from("channel_members")
    .select("*")
    .eq("user_id", userId);

  const { data: otherMentors } = await supabase
    .from("mentor_profiles")
    .select("...profiles(name, id, avatar)");

  const { data: channelMembers } = await supabase
    .from("channel_members")
    .select("*, ...profiles(name, avatar)")
    .in(
      "channel_id",
      (myChannels ?? []).map((channel) => channel.channel_id)
    )
    .neq("user_id", userId);

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
            {myChannels?.map((channel) => {
              // Find all members for this channel except the current user
              const others = channelMembers?.filter(
                (member) =>
                  member.channel_id === channel.channel_id &&
                  member.user_id !== userId
              ) || [];
              return others.map((other) => (
                <a
                  key={channel.channel_id + '-' + other.user_id}
                  href={`/chats/${channel.channel_id}`}
                  className="flex items-center px-4 py-3 gap-2 hover:bg-[#E0E6F6] transition"
                >
                  <Image
                    src={other.profiles?.avatar || "/logo.png"}
                    alt={other.profiles?.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                  <h4>{other.profiles?.name || other.user_id}</h4>
                </a>
              ));
            })}
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
