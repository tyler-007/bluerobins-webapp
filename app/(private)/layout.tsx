import Sidebar from "@/components/siderbar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { createContext, useContext } from "react";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/");
  }
  const isMentor = user.user_metadata.user_type === "mentor";
  const isParent = user.user_metadata.user_type === "parent";
  const { data: profile } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const { count: unread_messages_count } = await supabase
    .from("channel_messages")
    .select("*", { count: "exact", head: true })
    .eq("to_user", user?.id)
    .is("read_by", null);
  console.log("UNREAD MESSAGES: SB", unread_messages_count);

  const isStudent = !isMentor;
  const verified = isStudent || profile?.verified;
  if (isParent) {
    return (
      <main className="flex flex-1 min-h-screen bg-gradient-primary">{children}</main>
    );
  }
  return (
    <div className="flex flex-row min-h-screen max-h-screen overflow-hidden">
      <Sidebar
        verified={verified}
        unread_messages_count={unread_messages_count ?? 0}
      />
      <main className="flex flex-1 overflow-auto bg-gradient-primary">
        {children}
      </main>
    </div>
  );
}
