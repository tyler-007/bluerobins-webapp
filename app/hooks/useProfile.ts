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
    gcTime: 1000 * 60 * 60, // ✅ use gcTime instead of cacheTime in v5
  });
};
