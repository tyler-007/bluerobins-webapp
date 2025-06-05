import Sidebar from "@/components/siderbar";
import { createClient } from "@/utils/supabase/server";
import { createContext, useContext } from "react";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("id", user.user?.id)
    .single();

  const isStudent = !profile;
  const verified = profile?.verified;
  return (
    <div className="flex flex-row min-h-screen max-h-screen overflow-hidden">
      <Sidebar verified={verified} />
      <main className="flex flex-1 overflow-auto bg-gradient-primary">
        {children}
      </main>
    </div>
  );
}
