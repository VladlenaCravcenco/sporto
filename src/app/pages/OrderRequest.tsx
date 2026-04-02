import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import {
  Trash2, Plus, Minus, ShoppingCart, Package, ArrowRight,
  ChevronRight, CheckCircle2, Eye, EyeOff, User, Lock,
  Building2, Phone, Mail, MapPin, Pencil, Check, Truck,
  UserCircle, Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { sendAdminOrderNotification, sendOrderConfirmation } from '../../lib/emailService';
import { SeoHead } from '../components/SeoHead';

type AuthTab = 'new' | 'login';
type Step = 'cart' | 'success';

interface GuestForm {
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
  saveProfile: boolean;
  password: string;
  deliveryAddress: string;
  clientType: 'individual' | 'company';
}

const emptyGuest: GuestForm = {
  name: '', company: '', phone: '', email: '',
  notes: '', saveProfile: false, password: '',
  deliveryAddress: '',
  clientType: 'company',
};

export function OrderRequest() {
  const { language } = useLanguage();
  const { user, isAuthenticated, login, register, updateProfile } = useAuth();
  const {
    cart, removeFromCart, updateQuantity, clearCart,
    totalPrice, totalItems, isFreeDelivery, totalWithDelivery,
  } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('cart');
  const [authTab, setAuthTab] = useState<AuthTab>('new');
  const [guest, setGuest] = useState<GuestForm>(emptyGuest);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [notes, setNotes] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    clientType: 'company' as 'individual' | 'company',
  });

  useEffect(() => {
    if (user) {
      setGuest(g => ({
        ...g,
        name:        user.name,
        company:     user.company,
        phone:       user.phone,
        email:       user.email,
        clientType:  user.clientType ?? 'company',
        // ✅ FIX 1: подтягиваем адрес из профиля
        deliveryAddress: user.address ?? '',
      }));
      setProfileDraft({
        name: user.name ?? '',
        company: user.company ?? '',
        phone: user.phone ?? '',
        email: user.email ?? '',
        address: user.address ?? '',
        clientType: user.clientType ?? 'company',
      });
    }
  }, [user]);

  const L = (ro: string, ru: string) => language === 'ro' ? ro : ru;

  const handleGuestChange = (k: keyof GuestForm, v: string | boolean) => {
    setGuest(g => ({ ...g, [k]: v }));
  };

  const handleProfileDraftChange = (
    key: 'name' | 'company' | 'phone' | 'address' | 'clientType',
    value: string,
  ) => {
    setProfileDraft((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'clientType' && value === 'individual' ? { company: '' } : {}),
    }));
  };

  const handleProfileSave = async () => {
    if (!profileDraft.name.trim() || !profileDraft.phone.trim()) {
      toast.error(L('Completează numele și telefonul', 'Заполните имя и телефон'));
      return;
    }

    if (profileDraft.clientType === 'company' && !profileDraft.company.trim()) {
      toast.error(L('Completează compania', 'Заполните компанию'));
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: profileDraft.name.trim(),
        company: profileDraft.clientType === 'company' ? profileDraft.company.trim() : '',
        phone: profileDraft.phone.trim(),
        address: profileDraft.address.trim(),
        clientType: profileDraft.clientType,
      });

      setGuest((prev) => ({
        ...prev,
        name: profileDraft.name.trim(),
        company: profileDraft.clientType === 'company' ? profileDraft.company.trim() : '',
        phone: profileDraft.phone.trim(),
        email: profileDraft.email.trim(),
        deliveryAddress: profileDraft.address.trim(),
        clientType: profileDraft.clientType,
      }));
      setEditingProfile(false);
      toast.success(L('Datele au fost salvate', 'Данные сохранены'));
    } catch {
      toast.error(L('Nu am putut salva datele', 'Не удалось сохранить данные'));
    } finally {
      setSavingProfile(false);
    }
  };

  const saveRequestToSupabase = async (clientData: {
    name: string; company: string; email: string; phone: string;
    clientType: 'individual' | 'company'; deliveryAddress: string; notes: string;
  }) => {
    const items = cart.map(item => ({
      id:        item.id,
      name_ro:   item.name.ro,
      name_ru:   item.name.ru,
      sku:       item.sku || null,
      price:     item.price,
      qty:       item.quantity,
      image_url: item.image || null,
    }));

    const { data: inserted } = await supabase.from('order_requests').insert({
      client_name:      clientData.name,
      client_company:   clientData.company   || null,
      client_email:     clientData.email,
      client_phone:     clientData.phone     || null,
      client_type:      clientData.clientType || 'company',
      delivery_address: clientData.deliveryAddress || null,
      notes:            clientData.notes     || null,
      cart_items:       items,
      total_price:      totalPrice,
      total_items:      totalItems,
      status:           'new',
    }).select('id').single();

    const orderId = inserted?.id || crypto.randomUUID();
    const emailData = {
      orderId,
      clientName:      clientData.name,
      clientEmail:     clientData.email,
      clientPhone:     clientData.phone,
      clientCompany:   clientData.company,
      deliveryAddress: clientData.deliveryAddress,
      notes:           clientData.notes,
      totalPrice,
      totalItems,
      items: items.map(it => ({
        name_ru: it.name_ru || '',
        name_ro: it.name_ro || '',
        sku:     it.sku,
        price:   it.price,
        qty:     it.qty,
      })),
      language: language as 'ru' | 'ro',
    };
    sendAdminOrderNotification(emailData);
    sendOrderConfirmation(emailData);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest.name || !guest.phone || !guest.email) {
      toast.error(L('Completează câmpurile obligatorii', 'Заполните обязательные поля'));
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (guest.saveProfile && guest.password) {
      const ok = await register({
        email:      guest.email,
        password:   guest.password,
        name:       guest.name,
        company:    guest.company,
        phone:      guest.phone,
        address:    guest.deliveryAddress,
        clientType: guest.clientType,
      });
      if (!ok) {
        toast.error(L('Email deja înregistrat', 'Email уже зарегистрирован'));
        setLoading(false);
        return;
      }
    }
    await saveRequestToSupabase({
      name:            guest.name,
      company:         guest.company,
      email:           guest.email,
      phone:           guest.phone,
      clientType:      guest.clientType,
      deliveryAddress: guest.deliveryAddress,
      notes:           guest.notes,
    });
    clearCart();
    setLoading(false);
    setStep('success');
  };

  // ✅ FIX 2: передаём user.address в заявку для залогиненного пользователя
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);
    if (user) {
      await saveRequestToSupabase({
        name:            user.name,
        company:         user.company,
        email:           user.email,
        phone:           user.phone,
        clientType:      user.clientType ?? 'company',
        deliveryAddress: user.address ?? '',  // ← было пустая строка
        notes,
      });
    }
    clearCart();
    setNotes('');
    setLoading(false);
    setStep('success');
  };

  // ✅ FIX 3: после логина грузим профиль из базы и передаём все данные
  const handleLoginAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    const ok = await login(loginEmail, loginPassword);
    if (!ok) {
      setLoginError(L('Email sau parolă incorecte', 'Неверный email или пароль'));
      setLoading(false);
      return;
    }

    // грузим профиль напрямую из базы (user в контексте может ещё не обновиться)
    const { data: profile } = await supabase
      .from('clients')
      .select('*')
      .eq('email', loginEmail)
      .maybeSingle();

    await saveRequestToSupabase({
      name:            profile?.name        || loginEmail,
      company:         profile?.company     || '',
      email:           loginEmail,
      phone:           profile?.phone       || '',
      clientType:      profile?.client_type || 'company',
      deliveryAddress: profile?.address     || '',
      notes:           '',
    });
    clearCart();
    setLoading(false);
    setStep('success');
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl mb-3">{L('Cerere trimisă!', 'Запрос отправлен!')}</h1>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            {L(
              'Managerul nostru vă va contacta în 30 de minute în orele de lucru.',
              'Наш менеджер свяжется с вами в течение 30 минут в рабочее время.'
            )}
          </p>
          {isAuthenticated && (
            <p className="text-xs text-gray-500 border border-gray-200 px-4 py-3 mb-8">
              {L('Datele dvs. sunt salvate. Data viitoare formularul va fi completat automat.',
                 'Ваши данные сохранены. В следующий раз форма заполнится автоматически.')}
            </p>
          )}
          {!isAuthenticated && guest.saveProfile && (
            <p className="text-xs text-gray-500 border border-gray-200 px-4 py-3 mb-8">
              {L('Profil creat! Data viitoare te autentifici rapid cu email și parolă.',
                 'Профиль создан! В следующий раз войдите быстро по email и паролю.')}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/catalog')}
              className="px-6 py-2.5 bg-black text-white text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors">
              {L('Continuă cumpărăturile', 'Продолжить покупки')}
            </button>
            <button onClick={() => navigate('/')}
              className="px-6 py-2.5 border border-gray-200 text-xs uppercase tracking-wider hover:border-black transition-colors">
              {L('Acasă', 'Главная')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Cart screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <SeoHead title="Order Request | Sporto" canonical="/order-request" noIndex lang={language as Language} />
      {/* Header */}
      <div className="bg-black text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-[0.2em] mb-2">
                {L('Solicitare ofertă', 'Запрос предложения')}
              </p>
              <h1 className="text-2xl md:text-3xl text-white">
                {L('Coș de cumpărături', 'Корзина')}
              </h1>
            </div>
            {cart.length > 0 && (
              <div className="text-right">
                <div className="text-2xl text-white tabular-nums">{totalItems}</div>
                <div className="text-xs text-gray-500">{L('articole', 'позиций')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cart.length === 0 ? (
          <div className="border border-gray-200 p-16 text-center max-w-md mx-auto mt-8">
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <ShoppingCart className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-gray-900 mb-2 text-base">{L('Coșul este gol', 'Корзина пуста')}</h2>
            <p className="text-xs text-gray-400 mb-8 leading-relaxed">
              {L('Adaugă produse din catalog pentru a forma o cerere de ofertă.',
                 'Добавьте товары из каталога, чтобы сформировать запрос предложения.')}
            </p>
            <Link to="/catalog"
              className="inline-flex items-center gap-2 bg-black text-white text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-gray-800 transition-colors">
              {L('Deschide catalogul', 'Открыть каталог')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

            {/* ── Cart items ───────────────────────────────────────────────── */}
            <div className="border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-wider text-gray-900">
                  {L('Produse selectate', 'Выбранные товары')}
                  <span className="text-gray-400 ml-2">({totalItems})</span>
                </h2>
                <button type="button" onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-black transition-colors">
                  {L('Golește tot', 'Очистить всё')}
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-5">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 mb-2 leading-snug">
                        {item.name[language as Language]}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-200">
                          <button type="button" onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm text-gray-900">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.id)}
                          className="text-gray-300 hover:text-black transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-900 tabular-nums">
                        {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">MDL</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery row */}
              <div className={`flex gap-4 px-5 py-4 border-t ${isFreeDelivery ? 'border-gray-100 bg-gray-50/50' : 'border-gray-100'}`}>
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <Truck className={`w-5 h-5 ${isFreeDelivery ? 'text-black' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0 flex items-center">
                  <div>
                    <p className="text-sm text-gray-900">{L('Livrare', 'Доставка')}</p>
                    {isFreeDelivery ? (
                      <p className="text-[11px] text-black mt-0.5 uppercase tracking-wider">
                        {L('Livrare gratuită', 'Бесплатная доставка')}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {L(
                          `Livrare gratuită de la 500 MDL — mai adaugă ${500 - totalPrice} MDL`,
                          `Бесплатно от 500 MDL — добавьте ещё ${500 - totalPrice} MDL`
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center">
                  {isFreeDelivery ? (
                    <p className="text-sm text-black tabular-nums">{L('Gratuit', 'Бесплатно')}</p>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-900 tabular-nums">100</p>
                      <p className="text-xs text-gray-400 mt-0.5">MDL</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    {L('Subtotal produse', 'Сумма товаров')}
                  </span>
                  <span className="text-sm text-gray-600 tabular-nums">
                    {totalPrice.toLocaleString()} <span className="text-gray-400">MDL</span>
                  </span>
                </div>
                <div className="px-5 pb-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    {L('Livrare', 'Доставка')}
                  </span>
                  <span className={`text-sm tabular-nums ${isFreeDelivery ? 'text-black' : 'text-gray-600'}`}>
                    {isFreeDelivery ? L('Gratuit', 'Бесплатно') : '100 MDL'}
                  </span>
                </div>
                <div className="px-5 pb-4 pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-900 uppercase tracking-wider">
                    {L('Total cu livrare', 'Итого с доставкой')}
                  </span>
                  <span className="text-gray-900 tabular-nums">
                    {totalWithDelivery.toLocaleString()} <span className="text-gray-500 text-sm">MDL</span>
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {L('* Prețurile sunt orientative. Prețul final va fi confirmat de manager.',
                     '* Цены ориентировочные. Итоговая цена будет подтверждена менеджером.')}
                </p>
              </div>
            </div>

            {/* ── Checkout sidebar ─────────────────────────────────────────── */}
            <div className="border border-gray-200 sticky top-[112px]">

              {/* Delivery badge */}
              <div className={`px-5 py-3 border-b flex items-center gap-3 ${isFreeDelivery ? 'bg-black border-black' : 'bg-gray-50 border-gray-100'}`}>
                <Truck className={`w-4 h-4 flex-shrink-0 ${isFreeDelivery ? 'text-white' : 'text-gray-400'}`} />
                <p className={`text-xs ${isFreeDelivery ? 'text-white' : 'text-gray-500'}`}>
                  {isFreeDelivery
                    ? L('Livrare gratuită inclusă', 'Бесплатная доставка включена')
                    : L('Livrare 100 MDL · gratuită de la 500 MDL', 'Доставка 100 MDL · бесплатно от 500 MDL')
                  }
                </p>
              </div>

              {/* ══ STATE A: Logged in ══════════════════════════════════════ */}
              {isAuthenticated && user ? (
                <form onSubmit={handleAuthSubmit}>
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xs uppercase tracking-wider text-gray-900">
                      {L('Date contact', 'Данные контакта')}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingProfile) {
                          setEditingProfile(false);
                          return;
                        }
                        setProfileDraft({
                          name: user.name ?? '',
                          company: user.company ?? '',
                          phone: user.phone ?? '',
                          email: user.email ?? '',
                          address: user.address ?? '',
                          clientType: user.clientType ?? 'company',
                        });
                        setEditingProfile(true);
                      }}
                      className="text-gray-400 hover:text-black transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Client type badge */}
                  <div className="px-5 pt-4 pb-1">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 border ${
                      (user.clientType ?? 'company') === 'individual'
                        ? 'border-gray-200 text-gray-500 bg-gray-50'
                        : 'border-gray-900 text-gray-900 bg-white'
                    }`}>
                      {(user.clientType ?? 'company') === 'individual'
                        ? <><UserCircle className="w-3 h-3" />{L('Persoană fizică', 'Физическое лицо')}</>
                        : <><Briefcase className="w-3 h-3" />{L('Persoană juridică', 'Юридическое лицо')}</>
                      }
                    </span>
                  </div>

                  {editingProfile ? (
                    <div className="p-5 pt-3 space-y-3 border-b border-gray-100">
                      <div className="flex border border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleProfileDraftChange('clientType', 'individual')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-wider transition-colors ${
                            profileDraft.clientType === 'individual'
                              ? 'bg-black text-white'
                              : 'text-gray-500 hover:text-black hover:bg-gray-50'
                          }`}
                        >
                          <UserCircle className="w-3.5 h-3.5" />
                          {L('Persoană fizică', 'Физлицо')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProfileDraftChange('clientType', 'company')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-wider border-l border-gray-200 transition-colors ${
                            profileDraft.clientType === 'company'
                              ? 'bg-black text-white'
                              : 'text-gray-500 hover:text-black hover:bg-gray-50'
                          }`}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          {L('Persoană juridică', 'Юрлицо')}
                        </button>
                      </div>

                      <FastField
                        icon={<User className="w-3.5 h-3.5" />}
                        placeholder={L('Nume și prenume *', 'Имя и фамилия *')}
                        value={profileDraft.name}
                        onChange={(v) => handleProfileDraftChange('name', v)}
                        required
                      />

                      {profileDraft.clientType === 'company' && (
                        <FastField
                          icon={<Building2 className="w-3.5 h-3.5" />}
                          placeholder={L('Companie / Organizație *', 'Компания / Организация *')}
                          value={profileDraft.company}
                          onChange={(v) => handleProfileDraftChange('company', v)}
                          required
                        />
                      )}

                      <FastField
                        icon={<Phone className="w-3.5 h-3.5" />}
                        placeholder={L('Telefon *', 'Телефон *')}
                        value={profileDraft.phone}
                        onChange={(v) => handleProfileDraftChange('phone', v)}
                        type="tel"
                        required
                      />

                      <div className="flex items-center border border-gray-200 bg-gray-50">
                        <div className="pl-3 text-gray-400 flex-shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                        <input
                          type="email"
                          value={profileDraft.email}
                          readOnly
                          className="flex-1 h-9 px-2.5 text-xs text-gray-500 outline-none bg-transparent"
                        />
                      </div>

                      <FastField
                        icon={<MapPin className="w-3.5 h-3.5" />}
                        placeholder={L('Adresa de livrare *', 'Адрес доставки *')}
                        value={profileDraft.address}
                        onChange={(v) => handleProfileDraftChange('address', v)}
                        required
                      />

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleProfileSave}
                          disabled={savingProfile}
                          className={`flex-1 h-9 text-[10px] uppercase tracking-widest transition-colors ${
                            savingProfile
                              ? 'bg-black text-white opacity-70'
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                        >
                          {savingProfile ? L('Se salvează...', 'Сохранение...') : L('Salvează datele', 'Сохранить данные')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfile(false);
                            setProfileDraft({
                              name: user.name ?? '',
                              company: user.company ?? '',
                              phone: user.phone ?? '',
                              email: user.email ?? '',
                              address: user.address ?? '',
                              clientType: user.clientType ?? 'company',
                            });
                          }}
                          className="h-9 px-4 border border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 hover:text-black hover:border-black transition-colors"
                        >
                          {L('Anulează', 'Отмена')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 pt-3 space-y-3">
                      <ProfileRow icon={<User     className="w-3.5 h-3.5" />} value={user.name    || '—'} />
                      <ProfileRow icon={<Building2 className="w-3.5 h-3.5" />} value={user.company || '—'} />
                      <ProfileRow icon={<Phone    className="w-3.5 h-3.5" />} value={user.phone   || '—'} />
                      <ProfileRow icon={<Mail     className="w-3.5 h-3.5" />} value={user.email   || '—'} />
                      <ProfileRow icon={<MapPin   className="w-3.5 h-3.5" />} value={user.address || '—'} />
                    </div>
                  )}

                  <div className="px-5 pb-3 border-t border-gray-100 pt-4">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">
                      {L('Notă (opțional)', 'Примечание (необязательно)')}
                    </label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                      className="w-full text-xs text-gray-900 border border-gray-200 px-3 py-2 resize-none focus:border-black focus:outline-none placeholder-gray-300"
                      placeholder={L('Termene, condiții speciale...', 'Сроки, особые условия...')} />
                  </div>

                  <OrderSummaryMini totalPrice={totalPrice} isFreeDelivery={isFreeDelivery} totalWithDelivery={totalWithDelivery} L={L} />

                  <div className="px-5 pb-5">
                    <button type="submit" disabled={loading}
                      className="w-full bg-black text-white text-xs uppercase tracking-wider py-3.5 hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading
                        ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{L('Se trimite...', 'Отправка...')}</>
                        : <>{L('Trimite cererea', 'Отправить запрос')}<ChevronRight className="w-3.5 h-3.5" /></>
                      }
                    </button>
                    <p className="text-[10px] text-gray-400 text-center mt-2.5">
                      {L('Gratuit · Fără obligații', 'Бесплатно · Без обязательств')}
                    </p>
                  </div>
                </form>

              ) : (
                /* ══ STATE B: Guest ════════════════════════════════════════ */
                <div>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button type="button" onClick={() => setAuthTab('new')}
                      className={`flex-1 min-w-0 py-3.5 text-xs uppercase tracking-wider whitespace-normal break-words transition-colors ${
                        authTab === 'new' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'
                      }`}>
                      {L('Client nou', 'Новый клиент')}
                    </button>
                    <button type="button" onClick={() => setAuthTab('login')}
                      className={`flex-1 min-w-0 py-3.5 text-xs uppercase tracking-wider whitespace-normal break-words transition-colors border-l border-gray-200 ${
                        authTab === 'login' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'
                      }`}>
                      {L('Autentificare', 'Войти')}
                    </button>
                  </div>

                  {/* ── Tab: New Client ── */}
                  {authTab === 'new' && (
                    <form onSubmit={handleGuestSubmit}>
                      <div className="p-5 space-y-3">

                        {/* Client type toggle */}
                        <div className="flex border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setGuest(g => ({ ...g, clientType: 'individual', company: '' }))}
                            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider whitespace-normal break-words transition-colors ${
                              guest.clientType === 'individual'
                                ? 'bg-black text-white'
                                : 'text-gray-500 hover:text-black hover:bg-gray-50'
                            }`}
                          >
                            <UserCircle className="w-3.5 h-3.5" />
                            {L('Persoană fizică', 'Физлицо')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuest(g => ({ ...g, clientType: 'company' }))}
                            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider whitespace-normal break-words border-l border-gray-200 transition-colors ${
                              guest.clientType === 'company'
                                ? 'bg-black text-white'
                                : 'text-gray-500 hover:text-black hover:bg-gray-50'
                            }`}
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            {L('Persoană juridică', 'Юрлицо')}
                          </button>
                        </div>

                        <FastField
                          icon={<User className="w-3.5 h-3.5" />}
                          placeholder={L('Nume și prenume *', 'Имя и фамилия *')}
                          value={guest.name}
                          onChange={v => handleGuestChange('name', v)}
                          required
                        />

                        {guest.clientType === 'company' && (
                          <FastField
                            icon={<Building2 className="w-3.5 h-3.5" />}
                            placeholder={L('Companie / Organizație *', 'Компания / Организация *')}
                            value={guest.company}
                            onChange={v => handleGuestChange('company', v)}
                            required
                          />
                        )}

                        <FastField
                          icon={<Phone className="w-3.5 h-3.5" />}
                          placeholder={L('Telefon *', 'Телефон *')}
                          value={guest.phone}
                          onChange={v => handleGuestChange('phone', v)}
                          type="tel"
                          required
                        />
                        <FastField
                          icon={<Mail className="w-3.5 h-3.5" />}
                          placeholder={L('Email *', 'Email *')}
                          value={guest.email}
                          onChange={v => handleGuestChange('email', v)}
                          type="email"
                          required
                        />
                        <FastField
                          icon={<MapPin className="w-3.5 h-3.5" />}
                          placeholder={L('Adresa de livrare *', 'Адрес доставки *')}
                          value={guest.deliveryAddress}
                          onChange={v => handleGuestChange('deliveryAddress', v)}
                          required
                        />

                        <textarea
                          value={guest.notes}
                          onChange={e => handleGuestChange('notes', e.target.value)}
                          rows={2}
                          className="w-full text-xs text-gray-900 border border-gray-200 px-3 py-2 resize-none focus:border-black focus:outline-none placeholder-gray-300"
                          placeholder={L('Notă (opțional)', 'Примечание (necesar)')}
                        />

                        {/* Save profile toggle */}
                        <div className="border border-gray-100 bg-gray-50 p-3">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <div className="relative flex-shrink-0 mt-0.5">
                              <input type="checkbox" className="sr-only"
                                checked={guest.saveProfile}
                                onChange={e => handleGuestChange('saveProfile', e.target.checked)} />
                              <div className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                                guest.saveProfile ? 'bg-black border-black' : 'border-gray-300 bg-white'
                              }`}>
                                {guest.saveProfile && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">
                                {L('Salvează datele pentru viitor', 'Сохранить данные для будущих заявок')}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {L('Completare automată la următoarea comandă', 'Автозаполнение при следующей заявке')}
                              </p>
                            </div>
                          </label>
                          {guest.saveProfile && (
                            <div className="mt-3">
                              <div className="flex items-center border border-gray-200 bg-white">
                                <div className="pl-3 text-gray-400 flex-shrink-0"><Lock className="w-3.5 h-3.5" /></div>
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder={L('Creează o parolă', 'Создайте пароль')}
                                  value={guest.password}
                                  onChange={e => handleGuestChange('password', e.target.value)}
                                  minLength={6}
                                  required={guest.saveProfile}
                                  className="flex-1 h-9 px-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                  className="px-3 text-gray-400 hover:text-black transition-colors">
                                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1.5">{L('Minim 6 caractere', 'Минимум 6 символов')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <OrderSummaryMini totalPrice={totalPrice} isFreeDelivery={isFreeDelivery} totalWithDelivery={totalWithDelivery} L={L} />

                      <div className="px-5 pb-5">
                        <button type="submit" disabled={loading}
                          className="w-full bg-black text-white text-xs uppercase tracking-wider py-3.5 hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-normal break-words">
                          {loading
                            ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{L('Se trimite...', 'Отправка...')}</>
                            : <>{guest.saveProfile ? L('Trimite și salvează profilul', 'Отправить и сохранить профиль') : L('Trimite cererea', 'Отправить запрос')}<ChevronRight className="w-3.5 h-3.5" /></>
                          }
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2.5">
                          {L('Gratuit · Fără obligații · Răspuns în 30 min', 'Бесплатно · Без обязательств · Ответ за 30 мин')}
                        </p>
                      </div>
                    </form>
                  )}

                  {/* ── Tab: Login ── */}
                  {authTab === 'login' && (
                    <form onSubmit={handleLoginAndSubmit}>
                      <div className="p-5 space-y-3">
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {L('Autentifică-te pentru a completa automat datele de contact.',
                             'Войдите, чтобы автоматически заполнить контактные данные.')}
                        </p>
                        <div className="flex items-center border border-gray-200">
                          <div className="pl-3 text-gray-400 flex-shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                          <input type="email" placeholder="Email" value={loginEmail}
                            onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }} required
                            className="flex-1 h-9 px-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none" />
                        </div>
                        <div className="flex items-center border border-gray-200 relative">
                          <div className="pl-3 text-gray-400 flex-shrink-0"><Lock className="w-3.5 h-3.5" /></div>
                          <input type={showLoginPass ? 'text' : 'password'} placeholder={L('Parolă', 'Пароль')}
                            value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                            required className="flex-1 h-9 px-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none" />
                          <button type="button" onClick={() => setShowLoginPass(v => !v)}
                            className="px-3 text-gray-400 hover:text-black transition-colors">
                            {showLoginPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {loginError && <p className="text-xs text-red-500">{loginError}</p>}
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-[10px] text-gray-400">
                            {L('Nu ai cont? ', 'Нет аккаунта? ')}
                            <button type="button" className="text-black underline underline-offset-2" onClick={() => setAuthTab('new')}>
                              {L('Înregistrare rapidă', 'Быстрая регистрация')}
                            </button>
                          </p>
                        </div>
                      </div>

                      <OrderSummaryMini totalPrice={totalPrice} isFreeDelivery={isFreeDelivery} totalWithDelivery={totalWithDelivery} L={L} />

                      <div className="px-5 pb-5">
                        <button type="submit" disabled={loading}
                          className="w-full bg-black text-white text-xs uppercase tracking-wider py-3.5 hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-normal break-words">
                          {loading
                            ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{L('Autentificare...', 'Вход...')}</>
                            : <>{L('Intră și trimite cererea', 'Войти и отправить')}<ChevronRight className="w-3.5 h-3.5" /></>
                          }
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OrderSummaryMini({
  totalPrice, isFreeDelivery, totalWithDelivery, L,
}: {
  totalPrice: number;
  isFreeDelivery: boolean;
  totalWithDelivery: number;
  L: (ro: string, ru: string) => string;
}) {
  return (
    <div className="mx-5 mb-4 border border-gray-100 bg-gray-50 divide-y divide-gray-100">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{L('Produse', 'Товары')}</span>
        <span className="text-xs text-gray-700 tabular-nums">{totalPrice.toLocaleString()} MDL</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{L('Livrare', 'Доставка')}</span>
        <span className={`text-xs tabular-nums ${isFreeDelivery ? 'text-black' : 'text-gray-700'}`}>
          {isFreeDelivery ? L('Gratuit', 'Бесплатно') : '100 MDL'}
        </span>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] text-gray-900 uppercase tracking-wider">{L('Total', 'Итого')}</span>
        <span className="text-xs text-gray-900 tabular-nums">{totalWithDelivery.toLocaleString()} MDL</span>
      </div>
    </div>
  );
}

function FastField({
  icon, placeholder, value, onChange, type = 'text', required = false,
}: {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center border border-gray-200 focus-within:border-black transition-colors">
      <div className="pl-3 text-gray-400 flex-shrink-0">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="flex-1 h-9 px-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none bg-transparent"
      />
    </div>
  );
}

// ✅ ProfileRow теперь всегда рендерится (дефис если пусто передаётся снаружи)
function ProfileRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400 flex-shrink-0">{icon}</div>
      <span className="text-xs text-gray-700 truncate">{value}</span>
    </div>
  );
}
