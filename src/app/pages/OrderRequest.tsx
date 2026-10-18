import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import {
  Trash2, Plus, Minus, ShoppingCart, Package, ArrowRight,
  ChevronRight, CheckCircle2, Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { SeoHead } from '../components/SeoHead';
import { trackGoogleAdsLead } from '../../lib/googleAds';
import { OrderRequestSubmissionError, submitOrderRequest } from '../../lib/orderRequests';
import { createClient as createAuthClient } from '../../../lib/supabase/client';
import { useCustomerSession } from '../hooks/useCustomerSession';
import { PhoneInput } from '../components/PhoneInput';

type Step = 'cart' | 'success';

interface GuestForm {
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
  deliveryAddress: string;
  clientType: 'individual' | 'company';
}

const emptyGuest: GuestForm = {
  name: '', company: '', phone: '', email: '',
  notes: '',
  deliveryAddress: '',
  clientType: 'individual',
};

const isCompletePhone = (phone: string) => phone.replace(/\D/g, '').length === 11;

export function OrderRequest() {
  const { language } = useLanguage();
  const {
    cart, removeFromCart, updateQuantity, clearCart,
    totalPrice, totalItems, isFreeDelivery, totalWithDelivery,
  } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('cart');
  const [guest, setGuest] = useState<GuestForm>(emptyGuest);
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  const L = (ro: string, ru: string) => language === 'ro' ? ro : ru;

  const { user: authUser, name: authName, loading: authLoading } = useCustomerSession();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem('sporto:checkout-draft') || 'null');
      sessionStorage.removeItem('sporto:checkout-draft');
      sessionStorage.removeItem('sporto:checkout-return');
      if (draft && typeof draft === 'object') setGuest(prev => {
        const next = { ...prev };
        for (const key of ['name', 'email', 'phone', 'company', 'deliveryAddress', 'notes'] as const) {
          if (typeof draft[key] === 'string') next[key] = draft[key];
        }
        next.clientType = draft.clientType === 'company' ? 'company' : 'individual';
        return next;
      });
    } catch { /* Manual checkout remains available when storage is blocked. */ }
    if (new URLSearchParams(window.location.search).has('auth_error')) {
      setGoogleError(language === 'ru' ? 'Вход не завершён. Попробуйте ещё раз или заполните форму.' : 'Autentificarea nu a fost finalizată. Încercați din nou sau completați formularul.');
    }
  }, [language]);

  useEffect(() => {
    if (!authUser) return;
    setGuest(prev => ({ ...prev, name: prev.name || authName, email: prev.email || authUser.email || '' }));
    setGoogleError('');
  }, [authUser, authName]);

  useEffect(() => {
    const saveDraft = () => {
      try {
        sessionStorage.setItem('sporto:checkout-return', `/${language}/order-request`);
        sessionStorage.setItem('sporto:checkout-draft', JSON.stringify(guest));
      } catch { /* Manual checkout remains available. */ }
    };
    window.addEventListener('sporto:checkout-save', saveDraft);
    return () => window.removeEventListener('sporto:checkout-save', saveDraft);
  }, [guest, language]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      try {
        sessionStorage.removeItem('sporto:auth-return');
        sessionStorage.setItem('sporto:checkout-return', `/${language}/order-request`);
        sessionStorage.setItem('sporto:checkout-draft', JSON.stringify(guest));
      } catch { /* Google sign-in does not depend on optional form draft storage. */ }
      const { error } = await createAuthClient().auth.signInWithOAuth({provider: 'google', options: {
        redirectTo: `${window.location.origin}/callback`,
      }});
      if (error) throw error;
    } catch {
      setGoogleLoading(false);
      setGoogleError(L('Nu am putut deschide Google. Puteți completa formularul.', 'Не удалось открыть Google. Можно заполнить форму вручную.'));
    }
  };

  const handleGuestChange = (k: keyof GuestForm, v: string | boolean) => {
    setGuest(g => ({ ...g, [k]: v }));
  };

  const submitRequest = async (clientData: {
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

    const { orderId, notificationStatus } = await submitOrderRequest({
      name: clientData.name,
      company: clientData.company,
      email: clientData.email,
      phone: clientData.phone,
      clientType: clientData.clientType,
      deliveryAddress: clientData.deliveryAddress,
      notes: clientData.notes,
      language: language as 'ru' | 'ro',
      website,
      items,
    });
    setOrderNumber(orderId.slice(0, 8).toUpperCase());
    setEmailStatus(notificationStatus);
  };

  const showSubmissionError = (error: unknown) => {
    if (error instanceof OrderRequestSubmissionError && error.code === 'rate_limited') {
      toast.error(L(
        'Ați trimis prea multe cereri. Încercați din nou peste 10 minute.',
        'Слишком много заявок. Попробуйте снова через 10 минут.',
      ));
      return;
    }
    toast.error(L('Cererea nu a putut fi trimisă', 'Не удалось отправить заявку'));
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest.name.trim() || !guest.phone || !guest.email.trim() || (guest.clientType === 'company' && !guest.company.trim())) {
      toast.error(L('Completează câmpurile obligatorii', 'Заполните обязательные поля'));
      return;
    }
    if (!isCompletePhone(guest.phone)) {
      toast.error(L('Introduceți numărul complet în format +373', 'Введите полный номер в формате +373'));
      return;
    }
    setLoading(true);
    try {
      await submitRequest({
        name:            guest.name,
        company:         guest.company,
        email:           guest.email,
        phone:           guest.phone,
        clientType:      guest.clientType,
        deliveryAddress: guest.deliveryAddress,
        notes:           guest.notes,
      });
      clearCart();
      trackGoogleAdsLead();
      setStep('success');
    } catch (error) {
      showSubmissionError(error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#f5f6f7] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl mb-3">{L('Cerere trimisă!', 'Запрос отправлен!')}</h1>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            {L(
              'Vă vom contacta pentru a confirma disponibilitatea, livrarea și detaliile comenzii.',
              'Свяжемся с вами, чтобы уточнить наличие, доставку и детали заказа.'
            )}
          </p>
          <p className="mb-3 text-sm text-gray-700">{L('Numărul cererii: ', 'Номер заявки: ')}{orderNumber}</p>
          <p className="mb-8 text-sm text-gray-500">{emailStatus === 'sent'
            ? L('Confirmarea cu produsele selectate a fost transmisă serviciului de email. Verificați și dosarul Spam.', 'Подтверждение с выбранными товарами передано почтовому сервису. Проверьте также папку «Спам».')
            : L('Cererea este salvată. Confirmarea prin email nu a putut fi trimisă. Nu este necesar să retrimiteți cererea.', 'Заявка сохранена. Подтверждение по email отправить не удалось. Повторно отправлять заявку не нужно.')}</p>
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

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <SeoHead title="Order Request | Sporto" canonical="/order-request" noIndex lang={language as Language} />

      <div className="bg-black text-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
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

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <img
                      src={item.image || 'https://via.placeholder.com/64x64'}
                      alt={item.name[language as Language]}
                      className="w-16 h-16 object-cover border border-gray-100 flex-shrink-0"
                    />
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

            <div className="rounded-lg border border-gray-200 bg-white sticky top-[112px]">

              <div className="px-5 pt-5 pb-4">
                <h2 className="text-xl font-semibold text-gray-900">{L('Cerere pentru produsele selectate', 'Заявка на выбранные товары')}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{L('Vă contactăm pentru a confirma disponibilitatea, livrarea și detaliile comenzii.', 'Свяжемся с вами, уточним наличие, доставку и детали заказа.')}</p>
              </div>

                    <div className="px-5 pb-4">
                      {authLoading ? <p role="status" className="text-sm text-gray-500">{L('Verificăm autentificarea…', 'Проверяем вход…')}</p> : authUser ? <p className="text-sm text-gray-700">{L('Autentificat ca', 'Вы вошли как')} {authName || authUser.email}</p> : <>
                      <button type="button" disabled={googleLoading} onClick={handleGoogle} className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50">
                        {googleLoading ? L('Se deschide Google…', 'Открываем Google…') : L('Continuă cu Google', 'Продолжить с Google')}
                      </button>
                      {googleError && <p role="alert" className="mt-2 text-sm text-red-600">{googleError}</p>}
                      <p className="mt-3 text-center text-sm text-gray-500">{L('sau completați datele mai jos', 'или заполните данные ниже')}</p>
                      </>}
                    </div>
                    <form onSubmit={handleGuestSubmit}>
                      <SpamTrapField value={website} onChange={setWebsite} />
                      <div className="p-5 space-y-3">

                        <label className="block text-sm text-gray-700">
                          {L('Nume *', 'Имя *')}
                          <input name="name" autoComplete="name" value={guest.name} onChange={e => handleGuestChange('name', e.target.value)} required className="mt-1.5 w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:outline-red-600" />
                        </label>
                        <div>
                          <label htmlFor="request-phone" className="mb-1.5 block text-sm text-gray-700">{L('Telefon *', 'Телефон *')}</label>
                          <PhoneInput id="request-phone" autoComplete="tel" value={guest.phone} onChange={v => handleGuestChange('phone', v)} required className="h-11 w-full rounded border border-gray-300 bg-white text-base" />
                        </div>
                        <fieldset className="flex flex-wrap gap-x-5 gap-y-2 py-1">
                          <legend className="sr-only">{L('Tip client', 'Тип клиента')}</legend>
                          {(['individual', 'company'] as const).map(type => <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                            <input type="radio" name="clientType" value={type} checked={guest.clientType === type} onChange={() => setGuest(g => ({ ...g, clientType: type, company: type === 'individual' ? '' : g.company }))} className="accent-red-600" />
                            {type === 'individual' ? L('Pentru mine', 'Для себя') : L('Pentru companie', 'Для компании')}
                          </label>)}
                        </fieldset>
                        {guest.clientType === 'company' && <label className="block text-sm text-gray-700">
                          {L('Denumirea companiei *', 'Название компании *')}
                          <input name="company" autoComplete="organization" value={guest.company} onChange={e => handleGuestChange('company', e.target.value)} required className="mt-1.5 w-full rounded border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-red-600" />
                        </label>}
                        <label className="block text-sm text-gray-700">
                          {guest.clientType === 'company' ? L('Email pentru ofertă *', 'Email для предложения *') : L('Email pentru confirmare *', 'Email для подтверждения *')}
                          <input type="email" name="email" autoComplete="email" value={guest.email} onChange={e => handleGuestChange('email', e.target.value)} required className="mt-1.5 w-full rounded border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-red-600" />
                        </label>
                        <details className="pt-1">
                          <summary className="cursor-pointer text-sm text-gray-600 underline underline-offset-4">{L('Adaugă adresa sau preferințe', 'Добавить адрес или пожелания')}</summary>
                          <div className="mt-4 space-y-3">
                            <label className="block text-sm text-gray-700">
                              {L('Adresa de livrare (opțional)', 'Адрес доставки (необязательно)')}
                              <input name="address" autoComplete="street-address" value={guest.deliveryAddress} onChange={e => handleGuestChange('deliveryAddress', e.target.value)} className="mt-1.5 w-full rounded border border-gray-300 px-3 py-2.5 text-base focus:outline-red-600" />
                            </label>
                            <label className="block text-sm text-gray-700">
                              {L('Preferințe (opțional)', 'Пожелания (необязательно)')}
                              <textarea value={guest.notes} onChange={e => handleGuestChange('notes', e.target.value)} rows={2} className="mt-1.5 w-full rounded border border-gray-300 px-3 py-2.5 text-base focus:outline-red-600" />
                            </label>
                          </div>
                        </details>

                      </div>

                      <OrderSummaryMini totalPrice={totalPrice} isFreeDelivery={isFreeDelivery} totalWithDelivery={totalWithDelivery} L={L} />

                      <div className="px-5 pb-5">
                        <button type="submit" disabled={loading}
                          className="w-full rounded bg-brand text-white text-sm font-medium py-3.5 hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-normal break-words">
                          {loading
                            ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{L('Se trimite...', 'Отправка...')}</>
                            : <>{L('Trimite cererea', 'Отправить заявку')}<ChevronRight className="w-3.5 h-3.5" /></>
                          }
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2.5">
                          {L('Fără plată online. Confirmăm detaliile împreună.', 'Без онлайн-оплаты. Детали согласуем с вами.')}
                        </p>
                      </div>
                    </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpamTrapField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
      <label htmlFor="order-website">Website</label>
      <input
        id="order-website"
        name="website"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

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
