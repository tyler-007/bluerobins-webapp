export interface Message {
  id: string;
  message: string;
  from_user: string;
  created_at: string;
}

export interface Chat {
  id?: string;
  name: string;
  avatar?: string;
  messages: Message[];
}
