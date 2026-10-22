'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { requestPasswordReset } from '@/lib/auth/actions';

const translations = {
  ro: {
    title: 'Resetare parolă',
    subtitle: 'Introduceți email-ul pentru a primi instrucțiuni de resetare',
    email: 'Email',
    sendButton: 'Trimitere link reset',
    havePassword: 'Vă amintiți parola?',
    login: 'Conectare',
    error: 'Eroare la trimiterea link-ului',
    success: 'Verificați email-ul pentru a reseta parola',
  },
  ru: {
    title: 'Сброс пароля',
    subtitle: 'Введите свой адрес электронной почты для получения инструкций по сбросу',
    email: 'Email',
    sendButton: 'Отправить ссылку сброса',
    havePassword: 'Помните пароль?',
    login: 'Вход',
    error: 'Ошибка при отправке ссылки',
    success: 'Проверьте электронную почту для сброса пароля',
  },
} as const;

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const locale = (searchParams.get('lang') || 'ro') as 'ro' | 'ru';
  const t = translations[locale];

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(t.success);
        setEmail('');
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-center">{t.title}</h1>
      <p className="text-gray-600 text-center mb-8">{t.subtitle}</p>

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

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        {message && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : t.sendButton}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-gray-600">
          {t.havePassword}{' '}
          <Link href={`/login?lang=${locale}`} className="text-red-600 hover:underline font-medium">
            {t.login}
          </Link>
        </span>
      </div>
    </div>
  );
}
