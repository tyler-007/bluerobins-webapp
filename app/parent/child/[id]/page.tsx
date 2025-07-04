import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function ChildDetails({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/");
  const student_id = params.id;
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const cookie = headersList.get("cookie");
  const res = await fetch(`${protocol}://${host}/api/parent-links/child-progress?student_id=${student_id}`, {
    headers: {
      cookie: cookie || "",
    },
  });
  const data = await res.json();

  return (
    <pre className="p-4 bg-gray-100 rounded border overflow-auto">{JSON.stringify(data, null, 2)}</pre>
  );
} 