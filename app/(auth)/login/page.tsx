'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth/actions';

const translations = {
  ro: {
    title: 'Autentificare',
    email: 'Email',
    password: 'Parolă',
    loginButton: 'Conectare',
    forgotPassword: 'Ați uitat parola?',
    noAccount: 'Nu aveți cont?',
    register: 'Înregistrare',
    error: 'Eroare la conectare',
    success: 'Conectare reușită',
  },
  ru: {
    title: 'Вход',
    email: 'Email',
    password: 'Пароль',
    loginButton: 'Вход',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    register: 'Регистрация',
    error: 'Ошибка входа',
    success: 'Вход выполнен',
  },
} as const;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const locale = (searchParams.get('lang') || 'ro') as 'ro' | 'ru';
  const t = translations[locale];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-center">{t.title}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t.email}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            {t.password}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : t.loginButton}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link href={`/forgot-password?lang=${locale}`} className="block text-sm text-red-600 hover:text-red-700">
          {t.forgotPassword}
        </Link>
        <p className="text-sm text-gray-600">
          {t.noAccount}{' '}
          <Link href={`/register?lang=${locale}`} className="text-red-600 hover:text-red-700 font-medium">
            {t.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
