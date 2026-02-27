import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { useChat } from '../../hooks/useChat';

interface Props {
  onClose: () => void;
}

export function CreateRoomModal({ onClose }: Props) {
  const { createRoom } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await createRoom(name.trim(), description.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Ошибка создания комнаты';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Создать комнату" onClose={onClose}>
      {error && (
        <p className="mb-4 text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Название <span className="text-gray-600 text-xs">(буквы, цифры, _ и -)</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onInvalid={(e) => {
              const el = e.target as HTMLInputElement;
              if (el.validity.valueMissing) el.setCustomValidity('Заполните это поле');
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
            placeholder="например: новости"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Описание <span className="text-gray-600 text-xs">(необязательно)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="О чём эта комната?"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
        >
          {isLoading ? 'Создаём…' : 'Создать'}
        </button>
      </form>
    </Modal>
  );
}
