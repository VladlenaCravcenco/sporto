'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient();

        // Get the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError('Error processing auth link');
          setLoading(false);
          return;
        }

        if (session) {
          // Session is valid, redirect to account page
          router.push('/account?lang=ro');
        } else {
          // No session, redirect to login
          router.push('/login?lang=ro');
        }
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
