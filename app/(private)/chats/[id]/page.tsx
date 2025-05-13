import ChatScreen from "@/views/ChatView/ChatScreen";

export default async function ChatPage({ params }: any) {
  const id = await params.id;
  //   const id = "WDdRBT_9EiA";
  return <ChatScreen channel_id={id} />;
}
