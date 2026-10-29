'use client';

import { useState, type FormEvent } from 'react';
import { signInAdmin } from '@/lib/admin/auth-actions';

export function AdminLoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(''); setLoading(true);
    try {
      const result = await signInAdmin(String(form.get('email') || ''), String(form.get('password') || ''));
      if (result.error) { setError(result.error); setLoading(false); return; }
      // Full same-origin navigation starts the workspace with the new cookie session.
      window.location.assign('/admin');
    } catch { setError('Не удалось связаться с сервером. Попробуйте ещё раз.'); setLoading(false); }
  }
  return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <form onSubmit={submit} className="w-full max-w-sm bg-white border border-gray-200 p-8 space-y-5">
      <div><p className="text-sm tracking-widest mb-2">SPORTO</p><h1 className="text-2xl font-semibold">Вход в админку</h1></div>
      <label className="block">Email<input name="email" type="email" required autoComplete="username" className="mt-2 w-full border border-gray-300 p-3" /></label>
      <label className="block">Пароль<input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full border border-gray-300 p-3" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="w-full bg-black text-white p-3 disabled:opacity-50">{loading ? 'Вход…' : 'Войти'}</button>
      <a href="/ro" className="block text-sm text-gray-600">Вернуться на сайт</a>
    </form>
  </main>;
}
