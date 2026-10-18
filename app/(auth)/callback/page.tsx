'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function handleCallback() {
      try {
        const supabase = createClient();

        let checkout = '';
        let returnPath = '';
        try {
          const stored = sessionStorage.getItem('sporto:auth-return') || '';
          sessionStorage.removeItem('sporto:auth-return');
          if (/^\/(ru|ro)(?:\/|[?#]|$)/.test(stored) && !stored.includes('\\')) returnPath = stored;
        } catch { /* Use the default destination if storage is unavailable. */ }
        try {
          const stored = sessionStorage.getItem('sporto:checkout-return') || '';
          if (/^\/(ru|ro)\/order-request$/.test(stored)) checkout = stored;
        } catch { /* Fall back to the existing account destination. */ }
        // Browser client initialization handles the PKCE code exchange.
        const { data: { user }, error } = await supabase.auth.getUser();
        if (checkout) {
          router.replace(user && !error ? checkout : `${checkout}?auth_error=1`);
          return;
        }
        if (error || !user) {
          setError('Не удалось завершить вход. Вернитесь на сайт и попробуйте ещё раз.');
          setLoading(false);
          return;
        }
        router.replace(returnPath || '/ro/order-request');
      } catch (err) {
        setError('Something went wrong');
        setLoading(false);
      }
    }

    handleCallback();
  }, [router]);

  if (loading) {
    return <div className="text-center py-8">Processing...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return null;
}
