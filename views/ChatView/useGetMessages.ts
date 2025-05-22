import { useQuery } from "@tanstack/react-query";

export const useGetMessages = (id: string, userId: string) => {
  return useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const res = await fetch(`/api/get_messages?id=${id}&reader=${userId}`);
      const { data } = await res.json();

      return data;
    },
  });
};
