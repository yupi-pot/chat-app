import { create } from 'zustand';
import type { Room, Message, DirectMessage, UserSummary, UnreadCount } from '../types/chat.types';
import { roomsApi } from '../api/rooms.api';
import { usersApi } from '../api/users.api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

// Активный чат — либо комната, либо DM с пользователем
export type ActiveChat =
  | { type: 'room'; id: string }
  | { type: 'dm'; userId: string }
  | null;

interface TypingUser {
  userId: string;
  username: string;
}

interface ChatStore {
  // Данные
  rooms: Room[];
  users: UserSummary[];
  messages: Record<string, Message[]>;         // roomId → сообщения
  dmMessages: Record<string, DirectMessage[]>; // userId → сообщения
  hasMore: Record<string, boolean>;
  nextCursor: Record<string, string | null>;
  unreadCounts: UnreadCount[];
  typingUsers: Record<string, TypingUser[]>;   // roomId/userId → кто печатает

  // Состояние
  activeChat: ActiveChat;
  isLoadingMessages: boolean;

  // Actions
  initChat: (token: string) => void;
  destroyChat: () => void;
  setActiveChat: (chat: ActiveChat) => void;
  loadRooms: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadRoomMessages: (roomId: string) => Promise<void>;
  loadMoreRoomMessages: (roomId: string) => Promise<void>;
  loadDMMessages: (userId: string) => Promise<void>;
  loadMoreDMMessages: (userId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string, fileUrl?: string, fileType?: string) => void;
  sendDM: (receiverId: string, content: string, fileUrl?: string, fileType?: string) => void;
  createRoom: (name: string, description?: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  startDMTyping: (userId: string) => void;
  stopDMTyping: (userId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: [],
  users: [],
  messages: {},
  dmMessages: {},
  hasMore: {},
  nextCursor: {},
  unreadCounts: [],
  typingUsers: {},
  activeChat: null,
  isLoadingMessages: false,

  initChat: (token) => {
    const socket = connectSocket(token);

    socket.on('message:new', (message: Message) => {
      set((s) => ({
        messages: {
          ...s.messages,
          [message.roomId]: [...(s.messages[message.roomId] ?? []), message],
        },
      }));
    });

    socket.on('dm:new', (message: DirectMessage) => {
      set((s) => {
        // users не содержит текущего юзера, поэтому:
        // если senderId есть в users → входящее, собеседник = sender
        // если нет → исходящее, собеседник = receiver
        const senderIsPartner = s.users.some((u) => u.id === message.senderId);
        const dmKey = senderIsPartner ? message.senderId : message.receiverId;

        const existing = s.dmMessages[dmKey] ?? [];
        if (existing.some((m) => m.id === message.id)) return s;

        const isActiveChat = s.activeChat?.type === 'dm' && s.activeChat.userId === dmKey;

        // Обновляем счётчик непрочитанных только для входящих и только если чат не открыт
        let unreadCounts = s.unreadCounts;
        if (senderIsPartner && !isActiveChat) {
          const exists = unreadCounts.some((c) => c.senderId === message.senderId);
          unreadCounts = exists
            ? unreadCounts.map((c) =>
                c.senderId === message.senderId ? { ...c, count: c.count + 1 } : c
              )
            : [...unreadCounts, { senderId: message.senderId, count: 1 }];
        }

        return {
          dmMessages: { ...s.dmMessages, [dmKey]: [...existing, message] },
          unreadCounts,
        };
      });
    });

    socket.on('user:online', ({ userId }: { userId: string }) => {
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, isOnline: true } : u)),
      }));
    });

    socket.on('user:offline', ({ userId }: { userId: string }) => {
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, isOnline: false } : u)),
      }));
    });

    socket.on('typing:start', ({ roomId, userId, username }: { roomId: string; userId: string; username: string }) => {
      set((s) => ({
        typingUsers: {
          ...s.typingUsers,
          [roomId]: [...(s.typingUsers[roomId] ?? []).filter((t) => t.userId !== userId), { userId, username }],
        },
      }));
    });

    socket.on('typing:stop', ({ roomId, userId }: { roomId: string; userId: string }) => {
      set((s) => ({
        typingUsers: {
          ...s.typingUsers,
          [roomId]: (s.typingUsers[roomId] ?? []).filter((t) => t.userId !== userId),
        },
      }));
    });

    socket.on('dm:typing:start', ({ userId, username }: { userId: string; username: string }) => {
      set((s) => ({
        typingUsers: {
          ...s.typingUsers,
          [`dm:${userId}`]: [{ userId, username }],
        },
      }));
    });

    socket.on('dm:typing:stop', ({ userId }: { userId: string }) => {
      set((s) => ({
        typingUsers: {
          ...s.typingUsers,
          [`dm:${userId}`]: [],
        },
      }));
    });
  },

  destroyChat: () => {
    disconnectSocket();
    set({
      rooms: [],
      users: [],
      messages: {},
      dmMessages: {},
      hasMore: {},
      nextCursor: {},
      unreadCounts: [],
      typingUsers: {},
      activeChat: null,
    });
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat });
    // Сбрасываем непрочитанные при открытии DM
    if (chat?.type === 'dm') {
      set((s) => ({
        unreadCounts: s.unreadCounts.filter((c) => c.senderId !== chat.userId),
      }));
    }
  },

  loadRooms: async () => {
    const { data } = await roomsApi.getAll();
    set({ rooms: data.rooms });
  },

  loadUsers: async () => {
    const { data } = await usersApi.getAll();
    set({ users: data.users });
    const { data: unread } = await usersApi.getUnreadCounts();
    set({ unreadCounts: unread.counts });
  },

  loadRoomMessages: async (roomId) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await roomsApi.getMessages(roomId);
      set((s) => ({
        messages: { ...s.messages, [roomId]: data.messages },
        hasMore: { ...s.hasMore, [roomId]: data.hasMore },
        nextCursor: { ...s.nextCursor, [roomId]: data.nextCursor },
      }));
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  loadMoreRoomMessages: async (roomId) => {
    const cursor = get().nextCursor[roomId];
    if (!cursor) return;
    const { data } = await roomsApi.getMessages(roomId, cursor);
    set((s) => ({
      messages: { ...s.messages, [roomId]: [...data.messages, ...(s.messages[roomId] ?? [])] },
      hasMore: { ...s.hasMore, [roomId]: data.hasMore },
      nextCursor: { ...s.nextCursor, [roomId]: data.nextCursor },
    }));
  },

  loadDMMessages: async (userId) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await usersApi.getDMHistory(userId);
      set((s) => ({
        dmMessages: { ...s.dmMessages, [userId]: data.messages },
        hasMore: { ...s.hasMore, [`dm:${userId}`]: data.hasMore },
        nextCursor: { ...s.nextCursor, [`dm:${userId}`]: data.nextCursor },
        unreadCounts: s.unreadCounts.filter((c) => c.senderId !== userId),
      }));
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  loadMoreDMMessages: async (userId) => {
    const cursor = get().nextCursor[`dm:${userId}`];
    if (!cursor) return;
    const { data } = await usersApi.getDMHistory(userId, cursor);
    set((s) => ({
      dmMessages: { ...s.dmMessages, [userId]: [...data.messages, ...(s.dmMessages[userId] ?? [])] },
      hasMore: { ...s.hasMore, [`dm:${userId}`]: data.hasMore },
      nextCursor: { ...s.nextCursor, [`dm:${userId}`]: data.nextCursor },
    }));
  },

  sendMessage: (roomId, content, fileUrl, fileType) => {
    getSocket()?.emit('message:send', { roomId, content, fileUrl, fileType });
  },

  sendDM: (receiverId, content, fileUrl, fileType) => {
    getSocket()?.emit('dm:send', { receiverId, content, fileUrl, fileType });
  },

  createRoom: async (name, description) => {
    const { data } = await roomsApi.create(name, description);
    set((s) => ({ rooms: [...s.rooms, { ...data.room, isMember: true }] }));
    getSocket()?.emit('room:join', data.room.id);
  },

  joinRoom: async (roomId) => {
    await roomsApi.join(roomId);
    getSocket()?.emit('room:join', roomId);
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, isMember: true, memberCount: r.memberCount + 1 } : r
      ),
    }));
  },

  leaveRoom: async (roomId) => {
    await roomsApi.leave(roomId);
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, isMember: false, memberCount: r.memberCount - 1 } : r
      ),
    }));
  },

  startTyping: (roomId) => getSocket()?.emit('typing:start', { roomId }),
  stopTyping: (roomId) => getSocket()?.emit('typing:stop', { roomId }),
  startDMTyping: (userId) => getSocket()?.emit('dm:typing:start', { receiverId: userId }),
  stopDMTyping: (userId) => getSocket()?.emit('dm:typing:stop', { receiverId: userId }),
}));
