import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Avatar } from '../ui/Avatar';
import { ConfirmModal } from '../ui/ConfirmModal';
import { uploadApi } from '../../api/upload.api';

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
    updateRoomAvatar,
    leaveRoom,
  } = useChat();

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [leaveRoomId, setLeaveRoomId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');

  const handleRoomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeChat?.type !== 'room') return;
    try {
      const { data } = await uploadApi.upload(file);
      await updateRoomAvatar(activeChat.id, data.url);
      setAvatarError('');
    } catch {
      setAvatarError('Не удалось загрузить аватар');
      setTimeout(() => setAvatarError(''), 3000);
    } finally {
      e.target.value = '';
    }
  };

  const handleLeaveConfirm = async () => {
    if (!leaveRoomId) return;
    await leaveRoom(leaveRoomId);
    setActiveChat(null);
  };

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
      <>
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
          {/* Аватар комнаты — кликабельный для участников */}
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleRoomAvatarUpload}
          />
          <button
            onClick={() => room?.isMember && avatarFileRef.current?.click()}
            className={room?.isMember ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}
            title={room?.isMember ? 'Сменить аватар комнаты' : undefined}
          >
            <Avatar username={room?.name ?? ''} avatar={room?.avatar ?? null} size="sm" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold truncate">{room?.name ?? '...'}</h2>
            {room?.description && (
              <p className="text-gray-500 text-xs truncate">{room.description}</p>
            )}
          </div>
          {/* Кнопка выйти — скрыта для general */}
          {room?.isMember && room.name !== 'general' && (
            <button
              onClick={() => setLeaveRoomId(activeChat.id)}
              title="Выйти из комнаты"
              className="shrink-0 text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              Выйти
            </button>
          )}
        </div>

        {/* Ошибка загрузки аватара */}
        {avatarError && (
          <div className="px-4 py-2 bg-red-900/40 border-b border-red-800 text-red-400 text-xs">
            {avatarError}
          </div>
        )}

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

      {leaveRoomId && (
        <ConfirmModal
          title="Выйти из комнаты?"
          message={`Вы покинете комнату «${room?.name}». Вернуться можно будет через раздел «Доступные комнаты».`}
          confirmText="Выйти"
          onConfirm={handleLeaveConfirm}
          onClose={() => setLeaveRoomId(null)}
        />
      )}
      </>
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
