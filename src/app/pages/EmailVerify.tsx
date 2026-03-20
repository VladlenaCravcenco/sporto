import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type State = 'loading' | 'success' | 'already' | 'invalid';

export function EmailVerify() {
  const [params]  = useSearchParams();
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('invalid'); return; }

    (async () => {
      // Find the client with this token
      const { data, error } = await supabase
        .from('clients')
        .select('id, email_verified')
        .eq('verification_token', token)
        .single();

      if (error || !data) { setState('invalid'); return; }
      if (data.email_verified) { setState('already'); return; }

      // Mark verified
      const { error: upErr } = await supabase
        .from('clients')
        .update({ email_verified: true, verification_token: null })
        .eq('verification_token', token);

      setState(upErr ? 'invalid' : 'success');
    })();
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white border border-gray-200 p-8 text-center">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-black flex items-center justify-center">
            <span className="text-white text-xs tracking-wider">SP</span>
          </div>
          <span className="text-xs tracking-[0.15em] text-gray-500 uppercase">Sportosfera</span>
        </div>

        {state === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-sm text-gray-500">Проверяем ссылку...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-14 h-14 bg-black flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl text-gray-900 mb-2">Email подтверждён</h1>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Ваш email успешно верифицирован. Теперь вы можете пользоваться всеми
              возможностями платформы SPORTOSFERA.
            </p>
            <Link
              to="/login"
              className="inline-block bg-black text-white text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-gray-800 transition-colors"
            >
              Войти в аккаунт
            </Link>
          </>
        )}

        {state === 'already' && (
          <>
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-gray-400" />
            </div>
            <h1 className="text-xl text-gray-900 mb-2">Уже подтверждён</h1>
            <p className="text-sm text-gray-400 mb-6">
              Этот email уже был верифицирован ранее.
            </p>
            <Link
              to="/login"
              className="inline-block bg-black text-white text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-gray-800 transition-colors"
            >
              Войти
            </Link>
          </>
        )}

        {state === 'invalid' && (
          <>
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-7 h-7 text-gray-400" />
            </div>
            <h1 className="text-xl text-gray-900 mb-2">Ссылка недействительна</h1>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Ссылка для подтверждения устарела или уже использована.
              Обратитесь к менеджеру или попробуйте зарегистрироваться заново.
            </p>
            <Link
              to="/register"
              className="inline-block bg-black text-white text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-gray-800 transition-colors"
            >
              Зарегистрироваться
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
