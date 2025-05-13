"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export const useProfile = (id: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      return data;
    },
    cacheTime: 1000 * 60 * 60, // cache for 1 hour
  });
};
