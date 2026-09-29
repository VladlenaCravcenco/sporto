'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signUp } from '@/lib/auth/actions';

const translations = {
  ro: {
    title: 'Înregistrare',
    email: 'Email',
    password: 'Parolă',
    confirmPassword: 'Confirmă parola',
    registerButton: 'Înregistrare',
    haveAccount: 'Aveți deja cont?',
    login: 'Conectare',
    passwordMismatch: 'Parolele nu se potrivesc',
    error: 'Eroare la înregistrare',
    success: 'Înregistrare reușită. Verificați email-ul pentru a confirma.',
    verificationSent: 'E-mail de verificare trimis. Vă rog să verific inbox-ul.',
  },
  ru: {
    title: 'Регистрация',
    email: 'Email',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    registerButton: 'Регистрация',
    haveAccount: 'Уже есть аккаунт?',
    login: 'Вход',
    passwordMismatch: 'Пароли не совпадают',
    error: 'Ошибка при регистрации',
    success: 'Регистрация успешна. Проверьте электронную почту для подтверждения.',
    verificationSent: 'Письмо для подтверждения отправлено. Пожалуйста, проверьте входящие.',
  },
} as const;

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const locale = (searchParams.get('lang') || 'ro') as 'ro' | 'ru';
  const t = translations[locale];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(t.verificationSent);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            {t.confirmPassword}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Loading...' : t.registerButton}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-gray-600">
          {t.haveAccount}{' '}
          <Link href={`/login?lang=${locale}`} className="text-red-600 hover:underline font-medium">
            {t.login}
          </Link>
        </span>
      </div>
    </div>
  );
}
