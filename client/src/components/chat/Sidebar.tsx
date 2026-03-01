import { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { CreateRoomModal } from './CreateRoomModal';
import { ProfileModal } from './ProfileModal';
import { Avatar } from '../ui/Avatar';
import type { Room } from '../../types/chat.types';

export function Sidebar() {
  const { user, logout } = useAuth();
  const { rooms, users, activeChat, setActiveChat, unreadCounts, joinRoom } = useChat();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const myRooms = rooms.filter((r) => r.isMember);
  const otherRooms = rooms.filter((r) => !r.isMember);

  const getUnread = (userId: string) =>
    unreadCounts.find((c) => c.senderId === userId)?.count ?? 0;

  const handleRoomClick = (room: Room) => {
    setActiveChat({ type: 'room', id: room.id });
  };

  const handleJoinAndOpen = async (room: Room) => {
    await joinRoom(room.id);
    setActiveChat({ type: 'room', id: room.id });
  };

  return (
    <>
      <aside className="w-full md:w-64 bg-gray-800 flex flex-col h-full shrink-0">
        {/* Шапка */}
        <div className="px-4 py-3 border-b border-gray-700">
          <h1 className="text-white font-bold text-lg">Чат</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Мои комнаты */}
          <div className="px-3 pt-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs text-gray-500 uppercase font-semibold">Комнаты</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                title="Создать комнату"
                className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors w-8 h-8 flex items-center justify-center rounded"
              >
                +
              </button>
            </div>
            {myRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeChat?.type === 'room' && activeChat.id === room.id
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-gray-400 mr-1">#</span>
                {room.name}
              </button>
            ))}
          </div>

          {/* Другие комнаты — вступить */}
          {otherRooms.length > 0 && (
            <div className="px-3 pt-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2 px-1">Вступить</p>
              {otherRooms.map((room) => (
                <div key={room.id} className="flex items-center gap-1 mb-1">
                  <button
                    onClick={() => handleJoinAndOpen(room)}
                    className="flex-1 text-left px-3 py-2.5 rounded-lg transition-colors text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                  >
                    <span className="mr-1">#</span>
                    {room.name}
                  </button>
                  <button
                    onClick={() => handleJoinAndOpen(room)}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 transition-colors"
                    title="Вступить"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Пользователи для DM */}
          <div className="px-3 pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2 px-1">
              Личные сообщения
            </p>
            {users.map((u) => {
              const unread = getUnread(u.id);
              const isActive = activeChat?.type === 'dm' && activeChat.userId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setActiveChat({ type: 'dm', userId: u.id })}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${
                    isActive ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      u.isOnline ? 'bg-green-400' : 'bg-gray-600'
                    }`}
                  />
                  <span className="flex-1 truncate">{u.username}</span>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Профиль пользователя */}
        <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <Avatar username={user?.username ?? ''} avatar={user?.avatar} size="sm" />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.username}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </button>
          <button
            onClick={logout}
            title="Выйти"
            className="text-gray-500 hover:text-red-400 transition-colors text-sm shrink-0"
          >
            ⏻
          </button>
        </div>
      </aside>

      {showCreateRoom && <CreateRoomModal onClose={() => setShowCreateRoom(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
