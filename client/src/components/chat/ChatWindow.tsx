import { useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Avatar } from '../ui/Avatar';

export function ChatWindow() {
  const { user } = useAuth();
  const {
    activeChat,
    rooms,
    users,
    messages,
    dmMessages,
    hasMore,
    typingUsers,
    loadRoomMessages,
    loadMoreRoomMessages,
    loadDMMessages,
    loadMoreDMMessages,
    sendMessage,
    sendDM,
    startTyping,
    stopTyping,
    startDMTyping,
    stopDMTyping,
    isLoadingMessages,
    setActiveChat,
  } = useChat();

  // Загружаем сообщения при смене активного чата
  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.type === 'room') {
      loadRoomMessages(activeChat.id);
    } else {
      loadDMMessages(activeChat.userId);
    }
  }, [activeChat]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500">Выберите комнату или пользователя</p>
      </div>
    );
  }

  if (activeChat.type === 'room') {
    const room = rooms.find((r) => r.id === activeChat.id);
    const msgs = messages[activeChat.id] ?? [];
    const more = hasMore[activeChat.id] ?? false;
    const typing = typingUsers[activeChat.id] ?? [];

    return (
      <div className="flex-1 flex flex-col bg-gray-900 min-w-0">
        {/* Шапка */}
        <div className="px-4 py-3 border-b border-gray-700 shrink-0 flex items-center gap-3">
          {/* Кнопка назад — только мобильная */}
          <button
            onClick={() => setActiveChat(null)}
            className="md:hidden text-gray-400 hover:text-white transition-colors text-xl leading-none p-2 -ml-2"
          >
            ←
          </button>
          <div>
            <h2 className="text-white font-semibold">#{room?.name ?? '...'}</h2>
            {room?.description && (
              <p className="text-gray-500 text-xs">{room.description}</p>
            )}
          </div>
        </div>

        {isLoadingMessages && msgs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MessageList
            messages={msgs}
            currentUserId={user!.id}
            hasMore={more}
            onLoadMore={() => loadMoreRoomMessages(activeChat.id)}
            typingUsers={typing}
          />
        )}

        <MessageInput
          placeholder={`Написать в #${room?.name ?? ''}…`}
          onSend={(content, fileUrl, fileType) => sendMessage(activeChat.id, content, fileUrl, fileType)}
          onTypingStart={() => startTyping(activeChat.id)}
          onTypingStop={() => stopTyping(activeChat.id)}
        />
      </div>
    );
  }

  // DM
  const partner = users.find((u) => u.id === activeChat.userId);
  const msgs = dmMessages[activeChat.userId] ?? [];
  const more = hasMore[`dm:${activeChat.userId}`] ?? false;
  const typing = typingUsers[`dm:${activeChat.userId}`] ?? [];

  return (
    <div className="flex-1 flex flex-col bg-gray-900 min-w-0">
      {/* Шапка */}
      <div className="px-4 py-3 border-b border-gray-700 shrink-0 flex items-center gap-3">
        {/* Кнопка назад — только мобильная */}
        <button
          onClick={() => setActiveChat(null)}
          className="md:hidden text-gray-400 hover:text-white transition-colors text-xl leading-none"
        >
          ←
        </button>
        <Avatar username={partner?.username ?? '?'} avatar={partner?.avatar} size="sm" />
        <div>
          <h2 className="text-white font-semibold">{partner?.username ?? '...'}</h2>
          <p className="text-xs text-gray-500">{partner?.isOnline ? 'онлайн' : 'не в сети'}</p>
        </div>
      </div>

      {isLoadingMessages && msgs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <MessageList
          messages={msgs}
          currentUserId={user!.id}
          hasMore={more}
          onLoadMore={() => loadMoreDMMessages(activeChat.userId)}
          typingUsers={typing}
        />
      )}

      <MessageInput
        placeholder={`Написать ${partner?.username ?? ''}…`}
        onSend={(content, fileUrl, fileType) => sendDM(activeChat.userId, content, fileUrl, fileType)}
        onTypingStart={() => startDMTyping(activeChat.userId)}
        onTypingStop={() => stopDMTyping(activeChat.userId)}
      />
    </div>
  );
}
