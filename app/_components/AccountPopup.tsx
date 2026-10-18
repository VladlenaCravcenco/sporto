'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useCustomerSession } from '../../src/app/hooks/useCustomerSession';
import type { Language } from './HeaderPreview';

export default function AccountPopup({ language, onClose }: { language: Language; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { user, name, loading } = useCustomerSession();
  const email = user?.email;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const L = (ro: string, ru: string) => language === 'ru' ? ru : ro;

  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.showModal();
    return () => { if (opener instanceof HTMLElement) opener.focus(); };
  }, []);

  async function login() {
    setBusy(true);
    setError('');
    try {
      try {
        sessionStorage.removeItem('sporto:checkout-return');
        // Let the checkout preserve its current form before an OAuth navigation.
        window.dispatchEvent(new Event('sporto:checkout-save'));
        sessionStorage.setItem('sporto:auth-return', window.location.pathname + window.location.search + window.location.hash);
      } catch { /* OAuth remains available if optional return/draft storage is blocked. */ }
      const { error } = await createClient().auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: `${window.location.origin}/callback` },
      });
      if (error) throw error;
    } catch {
      setError(L('Nu am putut deschide Google. Încercați din nou.', 'Не удалось открыть Google. Попробуйте ещё раз.'));
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      onClose();
    } catch {
      setError(L('Încercați din nou.', 'Попробуйте ещё раз.'));
    } finally { setBusy(false); }
  }

  return <dialog ref={dialog} onCancel={onClose} onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}
    aria-labelledby="account-popup-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md border border-gray-200 bg-white p-8 text-gray-900 shadow-xl backdrop:bg-black/60">
    <button type="button" autoFocus onClick={onClose} aria-label={L('Închide', 'Закрыть')} className="absolute right-4 top-3 p-2 text-xl">×</button>
    <h2 id="account-popup-title" className="mb-3 text-2xl">{user ? L('Contul meu', 'Мой аккаунт') : L('Autentificare', 'Вход')}</h2>
    {loading ? <p role="status">{L('Se încarcă…', 'Загрузка…')}</p> : user ? <>
      {name && <p className="mb-2 text-sm font-medium">{name}</p>}
      <p className="mb-6 break-all text-sm text-gray-500">{email}</p>
      <a href={`/${language}/order-request`} className="mb-3 block bg-black px-4 py-3 text-center text-sm text-white">{L('Mergi la coș', 'Перейти в корзину')}</a>
      <button type="button" disabled={busy} onClick={logout} className="w-full border border-gray-300 px-4 py-3 text-sm disabled:opacity-50">{L('Deconectare', 'Выйти')}</button>
    </> : <>
      <p className="mb-6 text-sm text-gray-500">{L('Conectați-vă pentru a completa mai ușor cererea.', 'Войдите, чтобы быстрее заполнить заявку.')}</p>
      <button type="button" disabled={busy} onClick={login} className="w-full border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">{busy ? L('Se deschide Google…', 'Открываем Google…') : L('Continuă cu Google', 'Продолжить с Google')}</button>
    </>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
  </dialog>;
}
