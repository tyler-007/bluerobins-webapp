import { useQuery } from "@tanstack/react-query";

export const useGetMessages = (id: string) => {
  return useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const res = await fetch(`/api/get_messages?id=${id}`);
      const { data } = await res.json();
      console.log("DATA:", data);
      return data;
    },
  });
};
