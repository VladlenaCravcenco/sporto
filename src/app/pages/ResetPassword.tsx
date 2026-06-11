import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { SeoHead } from '../components/SeoHead';

export function ResetPassword() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRo = language === 'ro';
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(true);
      setInvalid(!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        setInvalid(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(isRo ? 'Parola trebuie să conțină cel puțin 6 caractere.' : 'Пароль должен содержать минимум 6 символов.');
      return;
    }
    if (password !== confirm) {
      setError(isRo ? 'Parolele nu coincid.' : 'Пароли не совпадают.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate('/login', { replace: true }), 1800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <SeoHead title="Reset Password | Sporto" canonical="/reset-password" noIndex lang={language as 'ro' | 'ru'} />
      <div className="w-full max-w-md bg-white border border-gray-200 p-8">
        <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-6">
          {success ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
        </div>
        <h1 className="text-2xl text-gray-900 mb-2">
          {success
            ? (isRo ? 'Parola a fost schimbată' : 'Пароль изменён')
            : (isRo ? 'Creați o parolă nouă' : 'Создайте новый пароль')}
        </h1>
        <p className="text-sm text-gray-400 mb-7">
          {success
            ? (isRo ? 'Veți fi redirecționat către autentificare.' : 'Сейчас вы перейдёте на страницу входа.')
            : (isRo ? 'Introduceți noua parolă de două ori.' : 'Введите новый пароль два раза.')}
        </p>

        {!ready ? (
          <div className="h-10 bg-gray-100 animate-pulse" />
        ) : invalid ? (
          <div>
            <p className="text-sm text-red-500 mb-5">
              {isRo ? 'Linkul este invalid sau a expirat.' : 'Ссылка недействительна или устарела.'}
            </p>
            <Link to="/forgot-password" className="text-xs underline underline-offset-4">
              {isRo ? 'Trimiteți un link nou' : 'Отправить новую ссылку'}
            </Link>
          </div>
        ) : !success ? (
          <form onSubmit={submit} className="space-y-4">
            {[{
              value: password,
              setValue: setPassword,
              placeholder: isRo ? 'Parolă nouă' : 'Новый пароль',
            }, {
              value: confirm,
              setValue: setConfirm,
              placeholder: isRo ? 'Repetați parola' : 'Повторите пароль',
            }].map((field) => (
              <div key={field.placeholder} className="flex items-center border border-gray-200 focus-within:border-black">
                <Lock className="w-3.5 h-3.5 text-gray-400 ml-3" />
                <input
                  type={show ? 'text' : 'password'}
                  value={field.value}
                  onChange={(event) => field.setValue(event.target.value)}
                  placeholder={field.placeholder}
                  minLength={6}
                  required
                  className="w-full h-11 px-3 text-sm outline-none"
                />
                <button type="button" onClick={() => setShow((value) => !value)} className="px-3 text-gray-400 hover:text-black">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ))}
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 text-xs uppercase tracking-wider disabled:opacity-50">
              {loading
                ? (isRo ? 'Se salvează...' : 'Сохранение...')
                : (isRo ? 'Salvați parola' : 'Сохранить пароль')}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
