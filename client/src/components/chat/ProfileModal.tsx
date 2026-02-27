import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { uploadApi } from '../../api/upload.api';

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError('');
    try {
      const { data } = await uploadApi.upload(file);
      setAvatarPreview(data.url);
      await updateProfile({ avatar: data.url });
      setSuccess('Аватар обновлён');
    } catch {
      setError('Не удалось загрузить аватар');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await updateProfile({ username: username.trim() });
      setSuccess('Профиль обновлён');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Ошибка обновления профиля';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Профиль" onClose={onClose}>
      {/* Аватар */}
      <div className="mb-5 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={isUploadingAvatar}
          className="relative group"
          title="Сменить фото"
        >
          <Avatar username={user?.username ?? ''} avatar={avatarPreview} size="lg" />
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploadingAvatar ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-white text-xs font-medium">Изменить</span>
            )}
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="text-gray-500 text-sm">{user?.email}</p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="mb-4 text-sm text-green-400 bg-green-900/30 rounded-lg px-3 py-2">{success}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Имя пользователя</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onInvalid={(e) => {
              const el = e.target as HTMLInputElement;
              if (el.validity.valueMissing) el.setCustomValidity('Заполните это поле');
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || username.trim() === user?.username}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
        >
          {isLoading ? 'Сохраняем…' : 'Сохранить имя'}
        </button>
      </form>
    </Modal>
  );
}
