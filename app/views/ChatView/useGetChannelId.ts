export const useGetChannelId = async (id?: string, name?: string) => {
  if (id) {
    return id;
  }
  const res = await fetch("/api/get_channel", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.channel_id;
};
