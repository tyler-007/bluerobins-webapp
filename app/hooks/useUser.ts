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
    // cacheTime: 1000 * 60 * 60, // cache for 1 hour
  });
};
