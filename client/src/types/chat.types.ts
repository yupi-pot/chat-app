export interface Room {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
}

export interface RoomDetails extends Room {
  members: UserSummary[];
}

export interface UserSummary {
  id: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string | null;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
  roomId: string;
  user: UserSummary;
}

export interface DirectMessage {
  id: string;
  content: string | null;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
  isRead: boolean;
  senderId: string;
  receiverId: string;
  sender: UserSummary;
}

export interface UnreadCount {
  senderId: string;
  count: number;
}

export interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface DMPage {
  messages: DirectMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}
