import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { ArrowRight, ArrowLeft, Mail, Check, AlertCircle } from 'lucide-react';

type Lang = 'ro' | 'ru';
type Step = 'email' | 'sent';

const T = {
  ro: {
    eyebrow: 'Recuperare Cont',
    step1Title: 'Ai uitat parola?',
    step1Sub: 'Introdu adresa de email a contului tău. Îți vom trimite un link pentru a seta o parolă nouă.',
    emailLabel: 'Adresă de email',
    emailPlaceholder: 'email@compania.md',
    continueBtn: 'Trimite linkul de resetare',
    notFound: 'Nu există niciun cont cu această adresă de email.',
    genericError: 'A apărut o eroare. Încearcă din nou.',
    sentTitle: 'Verifică emailul',
    sentSub: 'Dacă există un cont cu această adresă, vei primi un link de resetare în câteva minute. Verifică și folderul Spam.',
    toLogin: 'Înapoi la autentificare',
    backToLogin: 'Înapoi la autentificare',
  },
  ru: {
    eyebrow: 'Восстановление Аккаунта',
    step1Title: 'Забыли пароль?',
    step1Sub: 'Введите email вашего аккаунта. Мы отправим ссылку для установки нового пароля.',
    emailLabel: 'Адрес email',
    emailPlaceholder: 'email@company.md',
    continueBtn: 'Отправить ссылку для сброса',
    notFound: 'Аккаунт с таким email не найден.',
    genericError: 'Произошла ошибка. Попробуйте снова.',
    sentTitle: 'Проверьте почту',
    sentSub: 'Если аккаунт с таким email существует, вы получите ссылку для сброса пароля в течение нескольких минут. Проверьте папку Спам.',
    toLogin: 'Перейти ко входу',
    backToLogin: 'Вернуться ко входу',
  },
};

export function ForgotPassword() {
  const { language } = useLanguage();
  const lang = language as Lang;
  const C = T[lang];

  const [step, setStep]           = useState<Step>('email');
  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading]     = useState(false);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/account`,
    });
    setLoading(false);

    if (error) {
      // Don't reveal if user exists or not — just show generic sent message
      // (prevents user enumeration attacks)
    }

    // Always show "check your email" — even if user doesn't exist (security best practice)
    setStep('sent');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="border border-gray-100">

          {/* Top bar */}
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">{C.eyebrow}</p>
            <div className="flex items-center gap-2">
              {(['email', 'sent'] as Step[]).map((s) => (
                <div
                  key={s}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    s === step ? 'bg-black' : 'bg-gray-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-8 py-10">

            {/* ── STEP 1: Email ── */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} noValidate>
                <h1 className="text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-black leading-[1.1] mb-3">
                  {C.step1Title}
                </h1>
                <p className="text-xs text-gray-400 leading-relaxed mb-8">{C.step1Sub}</p>

                <div className="mb-6">
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">
                    {C.emailLabel}
                  </label>
                  <div className={`flex items-center gap-3 h-11 px-4 border bg-gray-50 focus-within:bg-white focus-within:border-black transition-colors ${emailError ? 'border-black' : 'border-gray-200'}`}>
                    <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                      placeholder={C.emailPlaceholder}
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                      autoFocus
                      required
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-black">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {emailError}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {C.continueBtn}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: Sent ── */}
            {step === 'sent' && (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-black flex items-center justify-center mx-auto mb-6">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-[clamp(1.4rem,3vw,1.8rem)] tracking-tight text-black leading-[1.1] mb-3">
                  {C.sentTitle}
                </h1>
                <p className="text-xs text-gray-400 leading-relaxed mb-10 max-w-xs mx-auto">
                  {C.sentSub}
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-colors"
                >
                  {C.toLogin}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {step !== 'sent' && (
          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              {C.backToLogin}
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
