import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { uploadApi } from '../../api/upload.api';

interface Props {
  onSend: (content: string, fileUrl?: string, fileType?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
}

export function MessageInput({ onSend, onTypingStart, onTypingStop, placeholder = 'Написать сообщение…' }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ url: string; name: string; fileType: 'image' | 'file' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const handleChange = (value: string) => {
    setText(value);
    if (!isTyping.current && value.trim()) {
      isTyping.current = true;
      onTypingStart?.();
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      onTypingStop?.();
    }, 1500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data } = await uploadApi.upload(file);
      setPreview({ url: data.url, name: file.name, fileType: data.fileType });
    } catch {
      alert('Не удалось загрузить файл');
    } finally {
      setIsUploading(false);
      // сброс input чтобы можно было выбрать тот же файл повторно
      e.target.value = '';
    }
  };

  const removePreview = () => setPreview(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !preview) return;

    onSend(text.trim(), preview?.url, preview?.fileType);
    setText('');
    setPreview(null);

    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTyping.current = false;
    onTypingStop?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 pt-3 border-t border-gray-700"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {/* Превью файла */}
      {preview && (
        <div className="mb-2 flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
          {preview.fileType === 'image' ? (
            <img src={preview.url} alt="превью" className="w-10 h-10 rounded object-cover shrink-0" />
          ) : (
            <span className="text-2xl shrink-0">📎</span>
          )}
          <span className="text-sm text-gray-300 truncate flex-1">{preview.name}</span>
          <button
            type="button"
            onClick={removePreview}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-2 items-center bg-gray-700 rounded-xl px-3 py-2">
        {/* Кнопка прикрепить файл */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          title="Прикрепить файл"
          className="text-gray-500 hover:text-gray-300 disabled:opacity-50 transition-colors shrink-0 text-lg"
        >
          {isUploading ? (
            <span className="inline-block w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            '📎'
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />

        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
        />

        <button
          type="submit"
          disabled={!text.trim() && !preview}
          className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 transition-colors font-medium text-sm shrink-0"
        >
          Отправить
        </button>
      </div>
    </form>
  );
}
