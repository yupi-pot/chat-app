import { useEffect, useRef } from 'react';
import type { Message, DirectMessage } from '../../types/chat.types';
import { Avatar } from '../ui/Avatar';

type AnyMessage = Message | DirectMessage;

function isDirectMessage(msg: AnyMessage): msg is DirectMessage {
  return 'senderId' in msg;
}

interface Props {
  messages: AnyMessage[];
  currentUserId: string;
  hasMore: boolean;
  onLoadMore: () => void;
  typingUsers?: { userId: string; username: string }[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function MessageList({ messages, currentUserId, hasMore, onLoadMore, typingUsers = [] }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Первичный скролл вниз при загрузке
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop === 0 && hasMore) {
      onLoadMore();
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
    >
      {hasMore && (
        <button
          onClick={onLoadMore}
          className="text-xs text-gray-500 hover:text-gray-300 text-center py-2 transition-colors"
        >
          Загрузить ранние сообщения
        </button>
      )}

      {messages.map((msg) => {
        const senderId = isDirectMessage(msg) ? msg.senderId : msg.user.id;
        const sender = isDirectMessage(msg) ? msg.sender : msg.user;
        const isMine = senderId === currentUserId;

        return (
          <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
            <Avatar username={sender.username} avatar={sender.avatar} size="sm" />

            <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
              {!isMine && (
                <span className="text-xs text-gray-400 mb-1">{sender.username}</span>
              )}

              {/* Картинка */}
              {msg.fileType === 'image' && msg.fileUrl && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={msg.fileUrl}
                    alt="изображение"
                    className="max-w-[200px] sm:max-w-xs rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </a>
              )}

              {/* Файл (не картинка) */}
              {msg.fileType === 'file' && msg.fileUrl && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm ${
                    isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-700 text-gray-100 rounded-tl-sm'
                  } hover:opacity-90 transition-opacity`}
                >
                  <span>📎</span>
                  <span className="underline">Скачать файл</span>
                </a>
              )}

              {/* Текст */}
              {msg.content && (
                <div
                  className={`px-4 py-2 rounded-2xl text-sm break-words ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-700 text-gray-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              )}

              <span className="text-xs text-gray-600 mt-1">{formatTime(msg.createdAt)}</span>
            </div>
          </div>
        );
      })}

      {/* Индикатор печатания */}
      {typingUsers.length > 0 && (
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8" />
          <div className="bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-2">
            <span className="text-xs text-gray-400">
              {typingUsers.map((u) => u.username).join(', ')} печатает…
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
