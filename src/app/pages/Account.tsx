import React, { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import {
  User, Building2, Phone, Mail, MapPin, Lock,
  LogOut, ShoppingCart, ArrowRight, Check, AlertCircle,
  Package, ChevronRight, UserCircle, Briefcase,
} from 'lucide-react';

type Lang = 'ro' | 'ru';

const T = {
  ro: {
    pageEyebrow: 'Cont Partener',
    profileSection: 'Date Personale',
    profileSub: 'Informații despre tine și compania ta',
    securitySection: 'Securitate',
    securitySub: 'Schimbă parola contului tău',
    cartSection: 'Coșul Curent',
    cartSub: 'Produse adăugate la cerere',
    nameLabel: 'Nume complet',
    phoneLabel: 'Telefon',
    companyLabel: 'Companie / Instituție',
    addressLabel: 'Adresă de livrare',
    addressPlaceholder: 'Str. Exemplu 1, Chișinău',
    emailLabel: 'Email (nu poate fi modificat)',
    currentPassLabel: 'Parola curentă',
    newPassLabel: 'Parola nouă',
    confirmPassLabel: 'Confirmă parola nouă',
    saveBtn: 'Salvează modificările',
    saving: 'Se salvează…',
    saved: 'Salvat cu succes',
    changePassBtn: 'Schimbă parola',
    passChanged: 'Parola a fost schimbată',
    passError: 'Parolele nu coincid',
    passWrong: 'Parola curentă este incorectă',
    passMin: 'Minim 6 caractere',
    logoutBtn: 'Deconectare',
    toCatalog: 'Explorează catalogul',
    toOrder: 'Trimite cererea',
    cartEmpty: 'Coșul este gol',
    cartEmptySub: 'Adaugă produse din catalog pentru a trimite o cerere de ofertă.',
    viewCart: 'Vizualizează coșul',
    memberSince: 'Partener din',
    required: 'Câmp obligatoriu',
    items: 'articole în plus',
    clientTypeLabel: 'Tip client',
    individual: 'Persoană fizică',
    company: 'Persoană juridică',
  },
  ru: {
    pageEyebrow: 'Партнёрский Аккаунт',
    profileSection: 'Личные Данные',
    profileSub: 'Информация о вас и вашей компании',
    securitySection: 'Безопасность',
    securitySub: 'Смена пароля аккаунта',
    cartSection: 'Текущая Корзина',
    cartSub: 'Товары добавленные к заявке',
    nameLabel: 'Полное имя',
    phoneLabel: 'Телефон',
    companyLabel: 'Компания / Учреждение',
    addressLabel: 'Адрес доставки',
    addressPlaceholder: 'ул. Пример 1, Кишинёв',
    emailLabel: 'Email (нельзя изменить)',
    currentPassLabel: 'Текущий пароль',
    newPassLabel: 'Новый пароль',
    confirmPassLabel: 'Подтвердите новый пароль',
    saveBtn: 'Сохранить изменения',
    saving: 'Сохраняем…',
    saved: 'Успешно сохранено',
    changePassBtn: 'Сменить пароль',
    passChanged: 'Пароль изменён',
    passError: 'Пароли не совпадают',
    passWrong: 'Текущий пароль неверен',
    passMin: 'Минимум 6 символов',
    logoutBtn: 'Выйти',
    toCatalog: 'Открыть каталог',
    toOrder: 'Оформить заявку',
    cartEmpty: 'Корзина пуста',
    cartEmptySub: 'Добавьте товары из каталога для отправки запроса на предложение.',
    viewCart: 'Просмотреть корзину',
    memberSince: 'Партнёр с',
    required: 'Обязательное поле',
    items: 'товаров ещё',
    clientTypeLabel: 'Тип клиента',
    individual: 'Физическое лицо',
    company: 'Юридическое лицо',
  },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">
      {text}{required && <span className="text-black ml-1">*</span>}
    </label>
  );
}

function FieldInput({
  type, value, onChange, placeholder, icon, error, disabled,
}: {
  type: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 h-11 px-4 border text-sm transition-colors ${
      disabled
        ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
        : error
        ? 'bg-gray-50 border-black focus-within:bg-white'
        : 'bg-gray-50 border-gray-200 focus-within:bg-white focus-within:border-black'
    }`}>
      {icon && <span className="text-gray-300 flex-shrink-0">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent focus:outline-none placeholder-gray-300 text-gray-900 disabled:text-gray-400 min-w-0"
      />
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1.5 text-[10px] text-black">{msg}</p>;
}

function SectionBox({ children }: { children: ReactNode }) {
  return <div className="border border-gray-100">{children}</div>;
}

function SectionHead({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="px-8 py-6 border-b border-gray-100 flex items-start gap-4">
      <div className="w-8 h-8 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-gray-400">
        {icon}
      </div>
      <div>
        <h2 className="text-sm text-black">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function Account() {
  const { user, updateProfile, logout } = useAuth();
  const { language } = useLanguage();
  const { cart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const lang = language as Lang;
  const C = T[lang];

  // Member since — from Supabase Auth session
  const [memberYear, setMemberYear] = useState<number>(new Date().getFullYear());
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.created_at) {
        setMemberYear(new Date(data.user.created_at).getFullYear());
      }
    });
  }, []);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Profile form
  const [profile, setProfile] = useState({
    name: user.name ?? '',
    phone: user.phone ?? '',
    company: user.company ?? '',
    address: user.address ?? '',
    clientType: (user.clientType ?? 'company') as 'individual' | 'company',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Password form
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profile.name.trim()) errs.name = C.required;
    if (!profile.phone.trim()) errs.phone = C.required;
    if (profile.clientType === 'company' && !profile.company.trim()) errs.company = C.required;
    setProfileErrors(errs);
    if (Object.keys(errs).length) return;

    setProfileStatus('saving');
    await new Promise(r => setTimeout(r, 700));
    updateProfile(profile);
    setProfileStatus('saved');
    setTimeout(() => setProfileStatus('idle'), 3000);
  };

  const handlePassChange = async (e: FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (passwords.next.length < 6) { setPassError(C.passMin); return; }
    if (passwords.next !== passwords.confirm) { setPassError(C.passError); return; }

    // Verify current password by re-signing in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email:    user.email,
      password: passwords.current,
    });
    if (verifyError) { setPassError(C.passWrong); return; }

    // Update password via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({ password: passwords.next });
    if (updateError) { setPassError(updateError.message); return; }

    setPasswords({ current: '', next: '', confirm: '' });
    setPassSuccess(true);
    setTimeout(() => setPassSuccess(false), 4000);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const infoRows = [
    { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', value: user.email },
    { icon: <Phone className="w-3.5 h-3.5" />, label: C.phoneLabel, value: profile.phone || '—' },
    { icon: <Building2 className="w-3.5 h-3.5" />, label: C.companyLabel, value: profile.company || '—' },
    { icon: <MapPin className="w-3.5 h-3.5" />, label: C.addressLabel, value: profile.address || '—' },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-16">

        {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16 pb-8 border-b border-gray-100">
          <div>
            <h1 className="text-[clamp(2rem,4vw,3.5rem)] tracking-tight text-black leading-[1.05]">
              {user.name}
            </h1>
            <p className="text-sm text-gray-400 mt-2">{user.email}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-300 hidden sm:block">
              {C.memberSince} {memberYear}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-black border border-gray-200 hover:border-black px-4 py-2.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {C.logoutBtn}
            </button>
          </div>
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT: forms ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-8">

            {/* PROFILE FORM */}
            <form onSubmit={handleProfileSave} noValidate>
              <SectionBox>
                <SectionHead
                  icon={<User className="w-3.5 h-3.5" />}
                  title={C.profileSection}
                  sub={C.profileSub}
                />
                <div className="px-8 py-8 grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* ── Client type toggle ── */}
                  <div className="sm:col-span-2">
                    <FieldLabel text={C.clientTypeLabel} />
                    <div className="flex border border-gray-200 w-fit">
                      <button
                        type="button"
                        onClick={() => setProfile(p => ({ ...p, clientType: 'individual', company: '' }))}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider transition-colors ${
                          profile.clientType === 'individual'
                            ? 'bg-black text-white'
                            : 'text-gray-500 hover:text-black hover:bg-gray-50'
                        }`}
                      >
                        <UserCircle className="w-3.5 h-3.5" />
                        {C.individual}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfile(p => ({ ...p, clientType: 'company' }))}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider border-l border-gray-200 transition-colors ${
                          profile.clientType === 'company'
                            ? 'bg-black text-white'
                            : 'text-gray-500 hover:text-black hover:bg-gray-50'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        {C.company}
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="sm:col-span-2">
                    <FieldLabel text={C.nameLabel} required />
                    <FieldInput
                      type="text"
                      value={profile.name}
                      onChange={v => {
                        setProfile(p => ({ ...p, name: v }));
                        setProfileErrors(e => ({ ...e, name: '' }));
                      }}
                      placeholder="Ion Popescu"
                      icon={<User className="w-3.5 h-3.5" />}
                      error={profileErrors.name}
                    />
                    {profileErrors.name && <FieldError msg={profileErrors.name} />}
                  </div>

                  {/* Email (readonly) */}
                  <div>
                    <FieldLabel text={C.emailLabel} />
                    <FieldInput
                      type="email"
                      value={user.email}
                      icon={<Mail className="w-3.5 h-3.5" />}
                      disabled
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <FieldLabel text={C.phoneLabel} required />
                    <FieldInput
                      type="tel"
                      value={profile.phone}
                      onChange={v => {
                        setProfile(p => ({ ...p, phone: v }));
                        setProfileErrors(e => ({ ...e, phone: '' }));
                      }}
                      placeholder="+373 69 000 000"
                      icon={<Phone className="w-3.5 h-3.5" />}
                      error={profileErrors.phone}
                    />
                    {profileErrors.phone && <FieldError msg={profileErrors.phone} />}
                  </div>

                  {/* Company — only for legal entities */}
                  {profile.clientType === 'company' && (
                    <div className="sm:col-span-2">
                      <FieldLabel text={C.companyLabel} required />
                      <FieldInput
                        type="text"
                        value={profile.company}
                        onChange={v => {
                          setProfile(p => ({ ...p, company: v }));
                          setProfileErrors(e => ({ ...e, company: '' }));
                        }}
                        placeholder="Fitness Club SRL"
                        icon={<Building2 className="w-3.5 h-3.5" />}
                        error={profileErrors.company}
                      />
                      {profileErrors.company && <FieldError msg={profileErrors.company} />}
                    </div>
                  )}

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <FieldLabel text={C.addressLabel} />
                    <FieldInput
                      type="text"
                      value={profile.address}
                      onChange={v => setProfile(p => ({ ...p, address: v }))}
                      placeholder={C.addressPlaceholder}
                      icon={<MapPin className="w-3.5 h-3.5" />}
                    />
                  </div>
                </div>

                {/* Save */}
                <div className="px-8 pb-8">
                  <button
                    type="submit"
                    disabled={profileStatus === 'saving'}
                    className={`flex items-center gap-2 px-8 py-3 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60 ${
                      profileStatus === 'saved'
                        ? 'bg-black text-white'
                        : 'bg-black text-white hover:bg-gray-900'
                    }`}
                  >
                    {profileStatus === 'saving' ? (
                      <>
                        <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        {C.saving}
                      </>
                    ) : profileStatus === 'saved' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        {C.saved}
                      </>
                    ) : (
                      <>
                        {C.saveBtn}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </SectionBox>
            </form>

            {/* PASSWORD FORM */}
            <form onSubmit={handlePassChange} noValidate>
              <SectionBox>
                <SectionHead
                  icon={<Lock className="w-3.5 h-3.5" />}
                  title={C.securitySection}
                  sub={C.securitySub}
                />
                <div className="px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <FieldLabel text={C.currentPassLabel} required />
                    <FieldInput
                      type="password"
                      value={passwords.current}
                      onChange={v => { setPasswords(p => ({ ...p, current: v })); setPassError(''); }}
                      placeholder="••••••••"
                      icon={<Lock className="w-3.5 h-3.5" />}
                    />
                  </div>
                  <div>
                    <FieldLabel text={C.newPassLabel} required />
                    <FieldInput
                      type="password"
                      value={passwords.next}
                      onChange={v => { setPasswords(p => ({ ...p, next: v })); setPassError(''); }}
                      placeholder="••••••••"
                      icon={<Lock className="w-3.5 h-3.5" />}
                    />
                  </div>
                  <div>
                    <FieldLabel text={C.confirmPassLabel} required />
                    <FieldInput
                      type="password"
                      value={passwords.confirm}
                      onChange={v => { setPasswords(p => ({ ...p, confirm: v })); setPassError(''); }}
                      placeholder="••••••••"
                      icon={<Lock className="w-3.5 h-3.5" />}
                    />
                  </div>
                </div>

                {(passError || passSuccess) && (
                  <div className="px-8 pb-4">
                    {passError && (
                      <div className="flex items-center gap-2 text-xs text-black bg-gray-50 px-4 py-3 border border-gray-200">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {passError}
                      </div>
                    )}
                    {passSuccess && (
                      <div className="flex items-center gap-2 text-xs text-black bg-gray-50 px-4 py-3 border border-gray-200">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        {C.passChanged}
                      </div>
                    )}
                  </div>
                )}

                <div className="px-8 pb-8">
                  <button
                    type="submit"
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:border-black hover:text-black px-8 py-3 text-[10px] uppercase tracking-widest transition-colors"
                  >
                    {C.changePassBtn}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </SectionBox>
            </form>
          </div>

          {/* ── RIGHT: sidebar ────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">

            {/* CART SUMMARY */}
            <SectionBox>
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                <div>
                  <p className="text-xs text-black">{C.cartSection}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{C.cartSub}</p>
                </div>
                {totalItems > 0 && (
                  <span className="ml-auto w-5 h-5 bg-black text-white text-[9px] flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <Package className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-xs text-gray-600 mb-1">{C.cartEmpty}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-5">{C.cartEmptySub}</p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-black border-b border-gray-200 hover:border-black pb-0.5 transition-colors"
                  >
                    {C.toCatalog}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div>
                  <ul className="divide-y divide-gray-50">
                    {cart.slice(0, 5).map(item => (
                      <li key={item.id} className="flex items-center justify-between px-6 py-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 truncate">{item.name[lang]}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">×{item.quantity}</p>
                        </div>
                        <span className="text-xs tabular-nums text-gray-600 flex-shrink-0">
                          {(item.price * item.quantity).toLocaleString()} MDL
                        </span>
                      </li>
                    ))}
                    {cart.length > 5 && (
                      <li className="px-6 py-2.5">
                        <span className="text-[10px] text-gray-400">+{cart.length - 5} {C.items}</span>
                      </li>
                    )}
                  </ul>
                  <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">Total</span>
                      <span className="text-sm tabular-nums text-black">{totalPrice.toLocaleString()} MDL</span>
                    </div>
                    <Link
                      to="/order-request"
                      className="flex items-center justify-center gap-2 bg-black text-white py-3 text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-colors"
                    >
                      {C.toOrder}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/order-request"
                      className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-black hover:text-black py-2.5 text-[10px] uppercase tracking-widest transition-colors"
                    >
                      {C.viewCart}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </SectionBox>

            {/* INFO CARD */}
            <div className="border border-gray-100 divide-y divide-gray-50">
              {infoRows.map((row, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4">
                  <div className="text-gray-300 mt-0.5 flex-shrink-0">{row.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400">{row.label}</p>
                    <p className="text-xs text-gray-700 mt-0.5 break-words">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* QUICK LINKS */}
            <div className="space-y-px">
              {[
                { to: '/catalog', label: C.toCatalog },
                { to: '/turnkey-solutions', label: lang === 'ro' ? 'Soluții Cheie în Mână' : 'Решения под Ключ' },
                { to: '/maintenance-service', label: lang === 'ro' ? 'Service & Mentenanță' : 'Сервис и Обслуживание' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between px-5 py-4 border border-gray-100 hover:border-black group transition-colors"
                >
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">
                    {link.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-black transition-colors" />
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-5 py-4 border border-gray-100 hover:border-black group transition-colors"
              >
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                  {C.logoutBtn}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-black transition-colors" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}