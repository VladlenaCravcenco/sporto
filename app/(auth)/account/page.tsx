'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser, updatePassword, signOut } from '@/lib/auth/actions';
import type { User } from '@supabase/supabase-js';

const translations = {
  ro: {
    title: 'Contul meu',
    email: 'Email',
    currentPassword: 'Parola curentă',
    newPassword: 'Parolă nouă',
    confirmPassword: 'Confirmă parola',
    updateButton: 'Actualizare parolă',
    signOutButton: 'Deconectare',
    loading: 'Încărcare...',
    notAuthenticated: 'Nu sunteți autentificat',
    loginHere: 'Conectați-vă aici',
    passwordMismatch: 'Parolele nu se potrivesc',
    error: 'Eroare',
    success: 'Parolă actualizată cu succes',
    changePassword: 'Schimbă parola',
    clearForm: 'Golește formularul',
  },
  ru: {
    title: 'Мой аккаунт',
    email: 'Email',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    updateButton: 'Обновить пароль',
    signOutButton: 'Выход',
    loading: 'Загрузка...',
    notAuthenticated: 'Вы не вошли в систему',
    loginHere: 'Войдите здесь',
    passwordMismatch: 'Пароли не совпадают',
    error: 'Ошибка',
    success: 'Пароль успешно обновлен',
    changePassword: 'Изменить пароль',
    clearForm: 'Очистить форму',
  },
} as const;

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (searchParams.get('lang') || 'ro') as 'ro' | 'ru';
  const t = translations[locale];

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          router.push(`/login?lang=${locale}`);
        }
      } catch (err) {
        setError(t.error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router, locale, t]);

  async function handlePasswordChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setSubmitting(true);

    try {
      // Note: In a production app, you'd need to verify current password
      // For now, we'll just update to new password (requires valid session)
      const result = await updatePassword(newPassword);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(t.success);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(`/login?lang=${locale}`);
    } catch (err) {
      setError(t.error);
    }
  }

  if (loading) {
    return <div className="text-center py-8">{t.loading}</div>;
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-600 mb-4">{t.notAuthenticated}</p>
        <Link href={`/login?lang=${locale}`} className="text-red-600 hover:underline font-medium">
          {t.loginHere}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">{t.title}</h1>

      {/* User Info Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
          <p className="text-gray-900">{user.email}</p>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{t.changePassword}</h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {t.newPassword}
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? t.loading : t.updateButton}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setMessage('');
              }}
              className="flex-1 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
            >
              {t.clearForm}
            </button>
          </div>
        </form>
      </div>

      {/* Sign Out Section */}
      <div className="flex justify-end">
        <button
          onClick={handleSignOut}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          {t.signOutButton}
        </button>
      </div>
    </div>
  );
}
