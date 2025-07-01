import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import View from "./view";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const isMentor = user.user_metadata.user_type === "mentor";
  let fetcher = supabase.from("projects").select("*");

  // Await searchParams if it's a promise
  const params = (typeof searchParams === 'object' && typeof searchParams.then === 'function')
    ? await searchParams
    : searchParams;

  // Multi-select category filter (object property access)
  const categoriesRaw = params.category;
  const categories = (
    Array.isArray(categoriesRaw)
      ? categoriesRaw
      : categoriesRaw
      ? [categoriesRaw]
      : []
  ).map((c) => c.trim());
  const sortBy = params.sortBy || undefined;

  if (categories.length > 0) {
    // Filter projects that have ANY of the selected categories
    const orFilter = categories.map(cat => `categories.cs.{${cat}}`).join(",");
    fetcher = fetcher.or(orFilter);
  }

  if (sortBy) {
    const isAscending = sortBy === "asc";
    fetcher = fetcher.order("title", { ascending: isAscending });
  }

  const { data: projects } = await fetcher;

  return (
    <View projects={projects ?? []} isMentor={isMentor} userId={user.id} />
  );
}
