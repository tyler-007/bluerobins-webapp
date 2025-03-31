export const useGetChannelId = async (id, name, student_id, mentor_id) => {
  const res = await fetch("/api/get_channel", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  return data.channel_id;
};
