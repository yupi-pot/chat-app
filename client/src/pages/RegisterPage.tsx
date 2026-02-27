import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Ошибка регистрации';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Регистрация</h1>

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInvalid={(e) => {
                const el = e.target as HTMLInputElement;
                if (el.validity.valueMissing) el.setCustomValidity('Пожалуйста, заполните это поле');
                else if (el.validity.typeMismatch) el.setCustomValidity('Введите корректный email адрес');
              }}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Имя пользователя</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onInvalid={(e) => {
                const el = e.target as HTMLInputElement;
                if (el.validity.valueMissing) el.setCustomValidity('Пожалуйста, заполните это поле');
              }}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInvalid={(e) => {
                const el = e.target as HTMLInputElement;
                if (el.validity.valueMissing) el.setCustomValidity('Пожалуйста, заполните это поле');
              }}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 mt-2 transition-colors"
          >
            {isLoading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
