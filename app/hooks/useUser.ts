"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export const useUser = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      return data.user;
    },
    gcTime: 1000 * 60 * 60, // ✅ use gcTime instead of cacheTime in v5
  });
};
