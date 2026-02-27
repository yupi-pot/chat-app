import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatWindow } from '../components/chat/ChatWindow';

export function ChatPage() {
  const { accessToken } = useAuth();
  const { initChat, destroyChat, loadRooms, loadUsers, activeChat } = useChat();

  useEffect(() => {
    if (!accessToken) return;

    initChat(accessToken);
    loadRooms();
    loadUsers();

    return () => {
      destroyChat();
    };
  }, [accessToken]);

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Сайдбар: на мобильной скрыт если выбран чат */}
      <div
        className={`
          ${activeChat ? 'hidden' : 'flex'} md:flex
          w-full md:w-64 shrink-0
        `}
      >
        <Sidebar />
      </div>

      {/* Окно чата: на мобильной скрыто если нет активного чата */}
      <div
        className={`
          ${activeChat ? 'flex' : 'hidden'} md:flex
          flex-1 min-w-0
        `}
      >
        <ChatWindow />
      </div>
    </div>
  );
}
