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
  const { data: profile } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const isStudent = !isMentor;
  const verified = isStudent || profile?.verified;
  return (
    <div className="flex flex-row min-h-screen max-h-screen overflow-hidden">
      <Sidebar verified={verified} />
      <main className="flex flex-1 overflow-auto bg-gradient-primary">
        {children}
      </main>
    </div>
  );
}
