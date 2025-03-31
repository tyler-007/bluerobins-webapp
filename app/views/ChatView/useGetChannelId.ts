export const useGetChannelId = async (
  id?: string,
  name?: string,
  student_id?: string,
  mentor_id?: string
) => {
  const res = await fetch("/api/get_channel", {
    method: "POST",
    body: JSON.stringify({ id, name, student_id, mentor_id }),
  });
  const data = await res.json();
  return data.channel_id;
};
