import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface FieldErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(email: string, username: string, password: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = 'Введите email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Некорректный email адрес';
  }

  if (!username) {
    errors.username = 'Введите имя пользователя';
  } else if (username.length < 3) {
    errors.username = 'Минимум 3 символа';
  } else if (username.length > 20) {
    errors.username = 'Максимум 20 символов';
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.username = 'Только латинские буквы, цифры и _';
  }

  if (!password) {
    errors.password = 'Введите пароль';
  } else if (password.length < 6) {
    errors.password = `Минимум 6 символов (сейчас ${password.length})`;
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Повторите пароль';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Пароли не совпадают';
  }

  return errors;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverError, setServerError] = useState('');

  // Показываем ошибку поля только после того как пользователь из него ушёл
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = validate(email, username, password, confirmPassword);
  const isFormValid = Object.keys(errors).length === 0;

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // При сабмите помечаем все поля как тронутые
    setTouched({ email: true, username: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

    setServerError('');
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Ошибка регистрации';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Регистрация</h1>

        {serverError && (
          <p className="mb-4 text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              className={`w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 transition-shadow ${
                touched.email && errors.email ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
              }`}
              placeholder="example@mail.com"
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => touch('username')}
              className={`w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 transition-shadow ${
                touched.username && errors.username ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
              }`}
              placeholder="от 3 до 20 символов"
              maxLength={20}
            />
            {touched.username && errors.username ? (
              <p className="mt-1 text-xs text-red-400">{errors.username}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-600">Только латиница, цифры и _ (3–20 символов)</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => touch('password')}
              className={`w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 transition-shadow ${
                touched.password && errors.password ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
              }`}
              placeholder="минимум 6 символов"
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Повторите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => touch('confirmPassword')}
              className={`w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 transition-shadow ${
                touched.confirmPassword && errors.confirmPassword
                  ? 'ring-2 ring-red-500'
                  : 'focus:ring-blue-500'
              }`}
              placeholder="повторите пароль"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
            )}
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
