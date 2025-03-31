import type { Chat } from "@/lib/types";

export const chats: Chat[] = [
  {
    id: "1",
    name: "John Doe",
    avatar: "/placeholder.svg?height=50&width=50",
    messages: [
      {
        id: "msg1",
        message: "Hey, how are you?",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "msg2",
        message: "I haven't seen you in a while!",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
      },
      {
        id: "msg3",
        message: "I'm good, thanks! How about you?",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: "msg4",
        message: "Been pretty busy with work lately",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      },
      {
        id: "msg5",
        message: "Doing well. Want to meet up tomorrow?",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        id: "msg6",
        message: "We could grab coffee at that new place",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      },
      {
        id: "msg7",
        message: "Sure, that sounds great!",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      },
      {
        id: "msg8",
        message: "What time works for you?",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      },
      {
        id: "msg9",
        message: "How about 10am?",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      },
      {
        id: "msg10",
        message: "See you tomorrow!",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "/placeholder.svg?height=50&width=50",
    messages: [
      {
        id: "msg1",
        message: "Have you started on the project?",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "msg2",
        message: "Yes, I'm about halfway through",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      },
      {
        id: "msg3",
        message: "Great! Remember the deadline",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      },
      {
        id: "msg4",
        message: "The project is due on Friday",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ],
  },
  {
    id: "3",
    name: "Work Group",
    avatar: "/placeholder.svg?height=50&width=50",
    messages: [
      {
        id: "msg1",
        message: "Bob: Has everyone reviewed the proposal?",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      },
      {
        id: "msg2",
        message: "I have, looks good to me",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 230).toISOString(),
      },
      {
        id: "msg3",
        message: "Charlie: I have some concerns about section 3",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      },
      {
        id: "msg4",
        message: "Alice: Let's discuss this tomorrow",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ],
  },
  {
    id: "4",
    name: "Family",
    avatar: "/placeholder.svg?height=50&width=50",
    messages: [
      {
        id: "msg1",
        message: "Dad: Who's coming to dinner on Sunday?",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
      },
      {
        id: "msg2",
        message: "I'll be there",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 390).toISOString(),
      },
      {
        id: "msg3",
        message: "Sister: Me too!",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 350).toISOString(),
      },
      {
        id: "msg4",
        message: "Mom: Don't forget to bring the cake!",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      },
    ],
  },
  {
    id: "5",
    name: "David Johnson",
    avatar: "/placeholder.svg?height=50&width=50",
    messages: [
      {
        id: "msg1",
        message: "Hey, can you help me with something?",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: "msg2",
        message: "Sure, what do you need?",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.9).toISOString(),
      },
      {
        id: "msg3",
        message: "I'm trying to figure out how to use this new software",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(),
      },
      {
        id: "msg4",
        message: "I can walk you through it. First, you need to...",
        from_user: "me",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.2).toISOString(),
      },
      {
        id: "msg5",
        message: "Thanks for the help!",
        from_user: "them",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
  },
];
