import React, { useState, FormEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { SeoHead, SEO_PAGES, LOCAL_BUSINESS_JSON_LD } from '../components/SeoHead';
import { EMAILJS, isEmailConfigured } from '../../lib/emailService';
import emailjs from '@emailjs/browser';
import {
  ArrowRight,
  Check,
  Mail,
  Phone,
  Building2,
  FileText,
  MapPin,
  Handshake,
  Clock,
  Dumbbell,
  ShoppingBag,
  GraduationCap,
  Baby,
  UserCircle,
  Briefcase,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useContacts } from '../hooks/useContacts';

type Lang = 'ro' | 'ru';

interface FormState {
  clientType: 'individual' | 'company';
  name: string;
  company: string;
  phone: string;
  email: string;
  type: string;
  message: string;
}

interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  type?: string;
  company?: string;
}

const TEXT: Record<Lang, {
  heroLabel: string;
  heroTitle: string;
  heroSub: string;
  formTitle: string;
  formSub: string;
  clientTypeLabel: string;
  individual: string;
  companyType: string;
  nameLabel: string;
  companyLabel: string;
  phoneLabel: string;
  emailLabel: string;
  typeLabel: string;
  typeOptions: { value: string; label: string }[];
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  required: string;
  thankTitle: string;
  thankBody: string;
  thankReset: string;
  legalTitle: string;
  legalName: string;
  legalNameVal: string;
  legalIdno: string;
  legalIdnoVal: string;
  legalAddress: string;
  legalAddressVal: string;
  legalEmail: string;
  legalPhone: string;
  legalHours: string;
  legalHoursVal: string;
  partnersTitle: string;
  partnersSub: string;
  partners: { icon: string; title: string; desc: string }[];
  whyTitle: string;
  why: { num: string; title: string; desc: string }[];
  guarantees: { value: string; label: string; sub: string }[];
}> = {
  ro: {
    heroLabel: 'Colaborare',
    heroTitle: 'Deveniți\nPartenerul\nNostru',
    heroSub: 'Lucrăm cu companii, instituții și antreprenori care doresc să ofere echipamente sportive de calitate.',
    formTitle: 'Trimiteți o Solicitare',
    formSub: 'Completați formularul și un manager vă va contacta în 24 de ore.',
    clientTypeLabel: 'Tip client',
    individual: 'Persoană fizică',
    companyType: 'Persoană juridică',
    nameLabel: 'Nume și prenume',
    companyLabel: 'Compania / Instituția',
    phoneLabel: 'Telefon',
    emailLabel: 'Email',
    typeLabel: 'Tip colaborare',
    typeOptions: [
      { value: 'wholesale', label: 'Achiziție wholesale (B2B)' },
      { value: 'fitness', label: 'Echipare sală fitness / club' },
      { value: 'school', label: 'Echipare școală / instituție' },
      { value: 'kindergarten', label: 'Echipare grădiniță / locuri de joacă' },
      { value: 'reseller', label: 'Revânzare / distribuție' },
      { value: 'other', label: 'Altele' },
    ],
    messageLabel: 'Mesaj (opțional)',
    messagePlaceholder: 'Descrieți pe scurt proiectul, cantitățile estimate sau orice alte detalii…',
    submit: 'Trimite solicitarea',
    submitting: 'Se trimite…',
    required: 'Câmp obligatoriu',
    thankTitle: 'Mulțumim!',
    thankBody: 'Am primit solicitarea dvs. Un manager vă va contacta în cel mai scurt timp posibil — de obicei în 24 de ore.',
    thankReset: 'Trimite o altă solicitare',
    legalTitle: 'Date Juridice',
    legalName: 'Denumire',
    legalNameVal: 'SPORTOSFERA S.R.L.',
    legalIdno: 'Cod Fiscal',
    legalIdnoVal: '1023600030436',
    legalAddress: 'Adresă juridică',
    legalAddressVal: 'str. Independenței 42/1, of. 64, Chișinău, Moldova',
    legalEmail: 'Email',
    legalPhone: 'Telefon',
    legalHours: 'Ore de lucru',
    legalHoursVal: 'Luni-Vineri 09:00-18:00',
    guarantees: [
      { value: '2h',   label: 'Răspuns în 2 ore',         sub: 'În zilele lucrătoare' },
      { value: '3-5d', label: 'Livrare în 3–5 zile',      sub: 'Pe tot teritoriul Moldovei' },
      { value: '12m',  label: 'Garanție 12 luni',         sub: 'Pentru toate echipamentele' },
      { value: 'ret',  label: 'Retur dacă nu corespunde', sub: 'Soluționăm fără birocrație' },
    ],
    partnersTitle: 'Cu Cine Colaborăm',
    partnersSub: 'Furnizăm echipamente sportive profesionale pentru diverse tipuri de organizații.',
    partners: [
      { icon: 'dumbbell', title: 'Cluburi Fitness & Săli', desc: 'Echipare completă a sălilor de forță și cardio' },
      { icon: 'shopping', title: 'Magazine Sportive', desc: 'Prețuri wholesale pentru revânzători' },
      { icon: 'school', title: 'Școli & Licee', desc: 'Inventar sportiv pentru instituții de învățământ' },
      { icon: 'baby', title: 'Grădinițe & Locuri de Joacă', desc: 'Echipamente sigure pentru copii' },
    ],
    whyTitle: 'De Ce Să Colaborați Cu Noi',
    why: [
      { num: '01', title: 'Prețuri wholesale', desc: 'Condiții speciale de prețuri pentru parteneri permanenți și volume mari.' },
      { num: '02', title: 'Consultanță gratuită', desc: 'Ajutăm la alegerea echipamentelor potrivite pentru proiectul dvs.' },
      { num: '03', title: 'Livrare în toată Moldova', desc: 'Organizăm livrarea și montajul echipamentelor la locație.' },
      { num: '04', title: 'Suport post-vânzare', desc: 'Garanție și service pentru toate echipamentele livrate.' },
    ],
  },
  ru: {
    heroLabel: 'Сотрудничество',
    heroTitle: 'Станьте\nНашим\nПартнёром',
    heroSub: 'Мы работаем с компаниями, учреждениями и предпринимателями, которые хотят предоставлять качественное спортивное оборудование.',
    formTitle: 'Отправить Заявку',
    formSub: 'Заполните форму — менеджер свяжется с вами в течение 24 часов.',
    clientTypeLabel: 'Тип клиента',
    individual: 'Физическое лицо',
    companyType: 'Юридическое лицо',
    nameLabel: 'Имя и фамилия',
    companyLabel: 'Компания / Учреждение',
    phoneLabel: 'Телефон',
    emailLabel: 'Email',
    typeLabel: 'Тип сотрудничества',
    typeOptions: [
      { value: 'wholesale', label: 'Оптовая закупка (B2B)' },
      { value: 'fitness', label: 'Оснащение фитнес-зала / клуба' },
      { value: 'school', label: 'Оснащение школы / учреждения' },
      { value: 'kindergarten', label: 'Оснащение детского сада / площадки' },
      { value: 'reseller', label: 'Перепродажа / дистрибуция' },
      { value: 'other', label: 'Другое' },
    ],
    messageLabel: 'Сообщение (необязательно)',
    messagePlaceholder: 'Кратко опишите проект, ориентировочные объёмы или любые другие детали…',
    submit: 'Отправить заявку',
    submitting: 'Отправляем…',
    required: 'Обязательное поле',
    thankTitle: 'Спасибо!',
    thankBody: 'Мы получили вашу заявку. Менеджер свяжется с вами в ближайшее время — обычно в течение 24 часов.',
    thankReset: 'Отправить ещё одну заявку',
    legalTitle: 'Юридические Данные',
    legalName: 'Наименование',
    legalNameVal: 'SPORTOSFERA S.R.L.',
    legalIdno: 'Код Фискал',
    legalIdnoVal: '1023600030436',
    legalAddress: 'Юридический адрес',
    legalAddressVal: 'ул. Independenței 42/1, оф. 64, Кишинёв, Молдова',
    legalEmail: 'Email',
    legalPhone: 'Телефон',
    legalHours: 'Часы работы',
    legalHoursVal: 'Пн-Пт 09:00-18:00',
    guarantees: [
      { value: '2ч',   label: 'Ответ за 2 часа',         sub: 'В рабочие дни' },
      { value: '3-5д', label: 'Доставка за 3–5 дней',    sub: 'По всей Молдове' },
      { value: '12м',  label: 'Гарантия 12 месяцев',     sub: 'На всё оборудование' },
      { value: 'воз',  label: 'Возврат если не подошло', sub: 'Решаем без бюрократии' },
    ],
    partnersTitle: 'С Кем Мы Работаем',
    partnersSub: 'Поставляем профессиональное спортивное оборудование для различных типов организаций.',
    partners: [
      { icon: 'dumbbell', title: 'Фитнес-клубы & Залы', desc: 'Комплексное оснащение силовых и кардио-зон' },
      { icon: 'shopping', title: 'Спортивные Магазины', desc: 'Оптовые цены для перепродавцов' },
      { icon: 'school', title: 'Школы & Лицеи', desc: 'Спортинвентарь для учебных заведений' },
      { icon: 'baby', title: 'Детсады & Площадки', desc: 'Безопасное оборудование для детей' },
    ],
    whyTitle: 'Почему Стоит Сотрудничать С Нами',
    why: [
      { num: '01', title: 'Оптовые цены', desc: 'Специальные условия для постоянных партнёров и крупных объёмов.' },
      { num: '02', title: 'Бесплатная консультация', desc: 'Помогаем выбрать подходящее оборудование для вашего проекта.' },
      { num: '03', title: 'Доставка по всей Молдове', desc: 'Организуем доставку и монтаж оборудования на месте.' },
      { num: '04', title: 'Постпродажная поддержка', desc: 'Гарантия и сервис для всего поставляемого оборудования.' },
    ],
  },
};

const partnerIcons: Record<string, React.ReactNode> = {
  dumbbell: <Dumbbell className="w-5 h-5" />,
  shopping: <ShoppingBag className="w-5 h-5" />,
  school:   <GraduationCap className="w-5 h-5" />,
  baby:     <Baby className="w-5 h-5" />,
};

export function Contacts() {
  const { language } = useLanguage();
  const C = useContacts(); // ✅ все контакты из Supabase (с фолбеком на contacts.ts)
  const T = TEXT[language as Lang];

  // Динамические значения из Supabase
  const phone     = C.phoneDisplay;
  const email     = C.email;
  const address   = language === 'ro' ? C.address_ro : C.address_ru;
  const hours     = language === 'ro' ? C.hours_ro   : C.hours_ru;
  const legalName = C.legal_name;
  const legalIdno = C.legal_idno;

  const [form, setForm] = useState<FormState>({
    clientType: 'company', name: '', company: '', phone: '', email: '', type: '', message: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = T.required;
    if (!form.phone.trim()) e.phone = T.required;
    if (!form.email.trim()) e.email = T.required;
    if (!form.type) e.type = T.required;
    if (form.clientType === 'company' && !form.company.trim()) e.company = T.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      await supabase.from('contact_requests').insert({
        client_type:  form.clientType,
        name:         form.name,
        company:      form.company || null,
        phone:        form.phone,
        email:        form.email,
        request_type: form.type,
        message:      form.message || null,
        created_at:   new Date().toISOString(),
      }).then(() => {});

      if (isEmailConfigured() && EMAILJS.tplAdmin) {
        emailjs.init({ publicKey: EMAILJS.publicKey });
        await emailjs.send(EMAILJS.serviceId, EMAILJS.tplAdmin, {
          to_email:         EMAILJS.adminEmail,
          order_id:         `CTR-${Date.now().toString(36).toUpperCase()}`,
          order_date:       new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()),
          client_name:      form.name,
          client_email:     form.email,
          client_phone:     form.phone,
          client_company:   form.company || '—',
          delivery_address: '—',
          notes:            `[CONTACTS / ${form.type}] ${form.message || '—'}`,
          total_items:      1,
          total_price:      '—',
          items_list:       `Тип сотрудничества: ${form.type}\nСообщение: ${form.message || '—'}`,
          admin_url:        `${window.location.origin}/admin`,
        }).catch(() => {});
      }
    } catch {}

    setSubmitting(false);
    setDone(true);
  };

  const setField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={SEO_PAGES.contacts[language as Lang].title}
        description={SEO_PAGES.contacts[language as Lang].description}
        keywords={SEO_PAGES.contacts[language as Lang].keywords}
        canonical="/contacts"
        lang={language as 'ro' | 'ru'}
        jsonLd={LOCAL_BUSINESS_JSON_LD}
      />

      {/* ── HERO ── */}
      <section className="bg-black text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-px h-4 bg-gray-700" />
                <span className="text-xs text-gray-500 uppercase tracking-[0.2em]">{T.heroLabel}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] whitespace-pre-line mb-6">
                {T.heroTitle}
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">{T.heroSub}</p>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-px bg-gray-800">
              {T.guarantees.map((g) => (
                <div key={g.value} className="bg-gray-950 p-6 flex flex-col justify-between gap-6 min-h-[110px]">
                  <div className="w-6 h-px bg-gray-700" />
                  <div>
                    <div className="text-sm text-white mb-1.5">{g.label}</div>
                    <div className="text-[11px] text-gray-600 uppercase tracking-wider">{g.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

            {/* ── FORM ── */}
            <div className="border border-gray-100">
              {done ? (
                <div className="flex flex-col items-center justify-center text-center px-10 py-20">
                  <div className="w-14 h-14 bg-black flex items-center justify-center mb-8">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl tracking-tight text-black mb-4">{T.thankTitle}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-10">{T.thankBody}</p>
                  <button
                    onClick={() => { setDone(false); setForm({ clientType: 'company', name: '', company: '', phone: '', email: '', type: '', message: '' }); }}
                    className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors border-b border-gray-200 hover:border-black pb-0.5"
                  >
                    {T.thankReset}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="px-8 pt-10 pb-8 border-b border-gray-100">
                    <h2 className="text-2xl tracking-tight text-black mb-2">{T.formTitle}</h2>
                    <p className="text-xs text-gray-400 leading-relaxed">{T.formSub}</p>
                  </div>

                  <div className="px-8 py-8 space-y-6">
                    {/* Client type */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">{T.clientTypeLabel}</label>
                      <div className="flex border border-gray-200 w-full">
                        <button type="button"
                          onClick={() => setForm(p => ({ ...p, clientType: 'individual', company: '' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs uppercase tracking-wider transition-colors ${form.clientType === 'individual' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}>
                          <UserCircle className="w-3.5 h-3.5" />{T.individual}
                        </button>
                        <button type="button"
                          onClick={() => setForm(p => ({ ...p, clientType: 'company' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs uppercase tracking-wider border-l border-gray-200 transition-colors ${form.clientType === 'company' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}>
                          <Briefcase className="w-3.5 h-3.5" />{T.companyType}
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">{T.nameLabel} <span className="text-black">*</span></label>
                      <input type="text" value={form.name} onChange={setField('name')}
                        placeholder={language === 'ro' ? 'Ion Popescu' : 'Иван Петров'}
                        className={`w-full h-11 px-4 text-sm bg-gray-50 border text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.name ? 'border-black' : 'border-gray-200'}`} />
                      {errors.name && <p className="mt-1.5 text-[10px] text-black">{errors.name}</p>}
                    </div>

                    {/* Phone + Email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">{T.phoneLabel} <span className="text-black">*</span></label>
                        <input type="tel" value={form.phone} onChange={setField('phone')} placeholder="+373 69 000 000"
                          className={`w-full h-11 px-4 text-sm bg-gray-50 border text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.phone ? 'border-black' : 'border-gray-200'}`} />
                        {errors.phone && <p className="mt-1.5 text-[10px] text-black">{errors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">{T.emailLabel} <span className="text-black">*</span></label>
                        <input type="email" value={form.email} onChange={setField('email')}
                          placeholder={language === 'ro' ? 'email@compania.md' : 'email@company.md'}
                          className={`w-full h-11 px-4 text-sm bg-gray-50 border text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.email ? 'border-black' : 'border-gray-200'}`} />
                        {errors.email && <p className="mt-1.5 text-[10px] text-black">{errors.email}</p>}
                      </div>
                    </div>

                    {/* Company */}
                    {form.clientType === 'company' && (
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">{T.companyLabel} <span className="text-black">*</span></label>
                        <input type="text" value={form.company} onChange={setField('company')} placeholder="Fitness Club SRL"
                          className={`w-full h-11 px-4 text-sm bg-gray-50 border text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.company ? 'border-black' : 'border-gray-200'}`} />
                        {errors.company && <p className="mt-1.5 text-[10px] text-black">{errors.company}</p>}
                      </div>
                    )}

                    {/* Type */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">{T.typeLabel} <span className="text-black">*</span></label>
                      <select value={form.type} onChange={setField('type')}
                        className={`w-full h-11 px-4 text-sm bg-gray-50 border text-gray-900 focus:outline-none focus:bg-white focus:border-black transition-colors appearance-none cursor-pointer ${errors.type ? 'border-black' : 'border-gray-200'} ${!form.type ? 'text-gray-400' : 'text-gray-900'}`}>
                        <option value="" disabled>{language === 'ro' ? 'Selectați tipul…' : 'Выберите тип…'}</option>
                        {T.typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      {errors.type && <p className="mt-1.5 text-[10px] text-black">{errors.type}</p>}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">{T.messageLabel}</label>
                      <textarea value={form.message} onChange={setField('message')} placeholder={T.messagePlaceholder} rows={4}
                        className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors resize-none" />
                    </div>
                  </div>

                  <div className="px-8 pb-8">
                    <button type="submit" disabled={submitting}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-60">
                      {submitting ? (
                        <><span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />{T.submitting}</>
                      ) : (
                        <>{T.submit}<ArrowRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div className="flex flex-col gap-4">

              {/* Mobile contacts */}
              <div className="lg:hidden grid grid-cols-2 gap-px bg-gray-100">
                <div className="bg-white p-5 flex flex-col gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">{T.legalEmail}</div>
                  <a href={`mailto:${email}`} className="text-xs text-gray-700 hover:text-black transition-colors">{email}</a>
                </div>
                <div className="bg-white p-5 flex flex-col gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">{T.legalPhone}</div>
                  <a href={`tel:${C.phone}`} className="text-xs text-gray-700 hover:text-black transition-colors">{phone}</a>
                </div>
              </div>

              {/* Legal card */}
              <div className="border border-gray-100 bg-white">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-black flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-gray-700">{T.legalTitle}</span>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {[
                    { label: T.legalName,    value: legalName, icon: <Building2 className="w-3.5 h-3.5" /> },
                    { label: T.legalIdno,    value: legalIdno, icon: <FileText   className="w-3.5 h-3.5" /> },
                    { label: T.legalAddress, value: address,   icon: <MapPin     className="w-3.5 h-3.5" /> },
                    { label: T.legalEmail,   value: email,     icon: <Mail       className="w-3.5 h-3.5" />, href: `mailto:${email}` },
                    { label: T.legalPhone,   value: phone,     icon: <Phone      className="w-3.5 h-3.5" />, href: `tel:${C.phone}` },
                    { label: T.legalHours,   value: hours,     icon: <Clock      className="w-3.5 h-3.5" /> },
                  ].map((row) => (
                    <div key={row.label} className="flex gap-3">
                      <div className="mt-0.5 text-gray-300 flex-shrink-0">{row.icon}</div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">{row.label}</div>
                        {row.href ? (
                          <a href={row.href} className="text-xs text-gray-700 hover:text-black transition-colors">{row.value}</a>
                        ) : (
                          <div className="text-xs text-gray-700 leading-relaxed">{row.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Partnership badge */}
              <div className="bg-black text-white p-6 flex flex-col gap-4">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center">
                  <Handshake className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-white mb-2">
                    {language === 'ro' ? 'Parteneriat B2B' : 'Партнёрство B2B'}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {language === 'ro'
                      ? 'Oferim condiții speciale pentru parteneri cu comenzi regulate. Contactați-ne pentru a discuta termenii.'
                      : 'Предлагаем специальные условия для партнёров с регулярными заказами. Свяжитесь с нами для обсуждения условий.'}
                  </p>
                </div>
              </div>

              {/* Messengers */}
              <div className="border border-gray-100 bg-white px-6 py-5">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">
                  {language === 'ro' ? 'Scrieți-ne direct' : 'Напишите нам напрямую'}
                </div>
                <div className="flex items-center gap-3">
                  <a href={C.whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                     className="w-10 h-10 flex items-center justify-center bg-[#25D366] hover:opacity-80 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.555 4.104 1.523 5.826L.044 23.428a.5.5 0 0 0 .612.612l5.602-1.479A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.868 9.868 0 0 1-5.034-1.376l-.36-.214-3.733.985.999-3.642-.235-.374A9.869 9.869 0 0 1 2.118 12C2.118 6.533 6.533 2.118 12 2.118c5.467 0 9.882 4.415 9.882 9.882 0 5.467-4.415 9.882-9.882 9.882z"/></svg>
                  </a>
                  <a href={C.telegram} target="_blank" rel="noopener noreferrer" title="Telegram"
                     className="w-10 h-10 flex items-center justify-center bg-[#29A8EB] hover:opacity-80 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.537-.194 1.006.131.973.057z"/></svg>
                  </a>
                  <a href={C.viber} title="Viber"
                     className="w-10 h-10 flex items-center justify-center bg-[#7360F2] hover:opacity-80 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M11.4 0C7.2.2 3.6 1.7 1.3 4.4-.6 6.7-.3 9.4.4 11.2c.2.5.6 1.2 1.2 1.9.6.8.7 1.2.6 1.7l-.6 3.6c-.1.4.3.8.7.7l3.7-.7c.5-.1 1 0 1.7.5.9.6 2.1 1.2 3.7 1.5 3.3.6 6.8-.1 9.2-2.4 2.5-2.4 3.5-5.7 3.4-8.7-.2-5.3-4.2-9.5-9.5-9.8C13 0 12.2 0 11.4 0zM12 2c4.5.2 8 3.8 8.1 8.3.1 2.5-.7 5.2-2.8 7.1-2 1.9-4.9 2.6-7.7 2-.9-.2-1.8-.6-2.5-1.1-.7-.5-1.4-.8-2.3-.6l-2.8.5.5-2.8c.2-.8 0-1.6-.7-2.4C1.3 12.3.9 11.8.7 11.3c-.6-1.5-.8-3.7.8-5.7C3.6 3.1 6.9 2 10.1 2c.6 0 1.3 0 1.9 0zm-2.8 3.7c-.2 0-.5.1-.7.2-.9.6-1.8 1.7-2 2.7-.2 1 .2 2 .6 2.8.5.9 1.6 2.3 3.1 3.4 1.1.8 2.1 1.3 2.9 1.6.9.3 1.7.4 2.2.1.4-.2.9-.8 1.1-1.3.1-.3 0-.5-.2-.7l-2.1-1.2c-.2-.1-.5-.1-.7.1l-.7.7c-.2.2-.4.2-.6.1-.7-.3-1.6-.9-2.3-1.8-.6-.8-.9-1.5-.9-1.7 0-.2 0-.4.2-.5l.7-.7c.2-.2.2-.4.1-.6L10 6.4c-.1-.4-.3-.6-.5-.7-.1 0-.2 0-.3 0z"/></svg>
                  </a>
                  <a href={`tel:${C.phone}`} title={C.phoneDisplay}
                     className="w-10 h-10 flex items-center justify-center bg-black hover:opacity-80 transition-opacity">
                    <Phone className="w-4 h-4 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-px h-4 bg-gray-300" />
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                  {language === 'ro' ? 'Locație' : 'Местоположение'}
                </span>
              </div>
              <h2 className="text-xl text-gray-900 mb-1">{language === 'ro' ? 'Cum Ne Găsiți' : 'Как Нас Найти'}</h2>
              <p className="text-sm text-gray-500">{address}</p>
            </div>
            <a href={C.mapsDirectionsUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors flex-shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              {language === 'ro' ? 'Construiește ruta' : 'Построить маршрут'}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          <div className="relative w-full overflow-hidden border border-gray-200" style={{ height: 400 }}>
            <iframe src={C.mapsEmbedUrl} width="100%" height="100%" style={{ border: 0 }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              title={language === 'ro' ? 'Locația noastră' : 'Наше местоположение'} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0" />
            {language === 'ro'
              ? 'Reper: Volta2. Intrarea din stradă, poartă albastră.'
              : 'Ориентир: Volta2. Въезд с улицы, синие ворота.'}
          </div>
        </div>
      </section>

      {/* ── WHO WE WORK WITH ── */}
      <section className="py-14 md:py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-px h-4 bg-gray-300" />
              <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                {language === 'ro' ? 'Clienți' : 'Клиенты'}
              </span>
            </div>
            <h2 className="text-2xl text-gray-900 mb-2">{T.partnersTitle}</h2>
            <p className="text-sm text-gray-500 max-w-lg">{T.partnersSub}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            {T.partners.map((p) => (
              <div key={p.icon} className="bg-white border border-gray-100 p-6 flex flex-col gap-4 hover:border-black transition-colors group">
                <div className="w-10 h-10 bg-black flex items-center justify-center text-white group-hover:bg-gray-800 transition-colors">
                  {partnerIcons[p.icon]}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-900 mb-1">{p.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="py-14 md:py-20 bg-white border-t border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-px h-4 bg-gray-300" />
              <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                {language === 'ro' ? 'Avantaje' : 'Преимущества'}
              </span>
            </div>
            <h2 className="text-2xl text-gray-900">{T.whyTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
            {T.why.map((item) => (
              <div key={item.num} className="bg-white p-8 flex flex-col gap-6">
                <span className="text-3xl text-gray-100 tabular-nums">{item.num}</span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-900 mb-2">{item.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}