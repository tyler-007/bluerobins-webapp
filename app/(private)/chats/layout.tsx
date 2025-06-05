import ChatScreen from "@/views/ChatView/ChatScreen";
import { User } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import dayjs from "dayjs";
import ChatList from "./ChatList";
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
          <ChatList
            myChannels={channelMembers}
            lastMessageObject={lastMessageObject}
          />
          {!isMentor && (
            <>
              <h3 className="text-xl font-bold p-3 px-6">Other Mentors</h3>
              <div className="w-full max-w-md mx-auto divide-y border-[#DDD] border-b">
                {otherMentors?.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="flex items-center px-4 py-3 gap-2 hover:bg-[#E0E6F6] transition"
                  >
                    <Image
                      src={mentor.avatar}
                      alt={mentor.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <h4>{mentor.name}</h4>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="w-full max-w-md mx-auto divide-y border-[#DDD] border-b">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=support@bluerobins.com"
              target="_blank"
              className="flex items-center px-4 py-3 gap-2 hover:bg-[#E0E6F6] transition"
            >
              <div className="h-8 w-8 rounded-full bg-[#2953BE] flex items-center justify-center" />
              {/* <Image
                  src={mentor.avatar}
                  alt={mentor.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                /> */}
              <h4>Blue Robins Support</h4>
            </a>
          </div>
        </div>
        <div className="flex flex-[3] flex-col">{children}</div>
      </div>
    </div>
  );
}
