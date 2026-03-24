import { useState, useRef, useEffect, ChangeEvent, FormEvent, MouseEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Send, Check, UserCircle, Briefcase, ArrowRight } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { PhoneInput } from './PhoneInput';
import { supabase } from '../../lib/supabase';
import { isEmailConfigured, EMAILJS } from '../../lib/emailService';

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
  type: 'turnkey' | 'maintenance';
}

type Lang = 'ro' | 'ru';

interface ModalText {
  title: string;
  sub: string;
  clientTypeLabel: string;
  individual: string;
  company: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  companyLabel: string;
  companyPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  required: string;
  thankTitle: string;
  thankBody: string;
  thankClose: string;
}

const TEXT: Record<Lang, Record<'turnkey' | 'maintenance', ModalText>> = {
  ro: {
    turnkey: {
      title: 'Solicită Consultanță\nGratuită',
      sub: 'Completați formularul — vă contactăm în 24 de ore cu un plan personalizat.',
      clientTypeLabel: 'Tip client',
      individual: 'Persoană fizică',
      company: 'Persoană juridică',
      nameLabel: 'Nume și prenume',
      namePlaceholder: 'Ion Popescu',
      phoneLabel: 'Telefon',
      phonePlaceholder: '+373 69 000 000',
      emailLabel: 'Email',
      emailPlaceholder: 'email@compania.md',
      companyLabel: 'Compania / Instituția',
      companyPlaceholder: 'Fitness Club SRL',
      messageLabel: 'Mesaj (opțional)',
      messagePlaceholder: 'Descrieți pe scurt proiectul sau echipamentele…',
      submit: 'Trimite solicitarea',
      submitting: 'Se trimite…',
      required: 'Câmp obligatoriu',
      thankTitle: 'Vă mulțumim!',
      thankBody: 'Am primit solicitarea dvs. Un consultant vă va contacta în cel mai scurt timp posibil.',
      thankClose: 'Închide',
    },
    maintenance: {
      title: 'Programează\nInspecția Gratuită',
      sub: 'Completați formularul — un tehnician vă contactează în 4 ore.',
      clientTypeLabel: 'Tip client',
      individual: 'Persoană fizică',
      company: 'Persoană juridică',
      nameLabel: 'Nume și prenume',
      namePlaceholder: 'Ion Popescu',
      phoneLabel: 'Telefon',
      phonePlaceholder: '+373 69 000 000',
      emailLabel: 'Email',
      emailPlaceholder: 'email@compania.md',
      companyLabel: 'Compania / Instituția',
      companyPlaceholder: 'Fitness Club SRL',
      messageLabel: 'Mesaj (opțional)',
      messagePlaceholder: 'Descrieți pe scurt proiectul sau echipamentele…',
      submit: 'Trimite solicitarea',
      submitting: 'Se trimite…',
      required: 'Câmp obligatoriu',
      thankTitle: 'Vă mulțumim!',
      thankBody: 'Am primit solicitarea dvs. Un tehnician vă va contacta în cel mai scurt timp posibil.',
      thankClose: 'Închide',
    },
  },
  ru: {
    turnkey: {
      title: 'Запросить Бесплатную\nКонсультацию',
      sub: 'Заполните форму — мы свяжемся с вами в течение 24 часов с персональным планом.',
      clientTypeLabel: 'Тип клиента',
      individual: 'Физическое лицо',
      company: 'Юридическое лицо',
      nameLabel: 'Имя и фамилия',
      namePlaceholder: 'Иван Петров',
      phoneLabel: 'Телефон',
      phonePlaceholder: '+373 69 000 000',
      emailLabel: 'Email',
      emailPlaceholder: 'email@company.md',
      companyLabel: 'Компания / Учреждение',
      companyPlaceholder: 'Fitness Club SRL',
      messageLabel: 'Сообщение (необязательно)',
      messagePlaceholder: 'Кратко опишите проект или оборудование…',
      submit: 'Отправить заявку',
      submitting: 'Отправляем…',
      required: 'Обязательное поле',
      thankTitle: 'Спасибо!',
      thankBody: 'Мы получили вашу заявку. Консультант свяжется с вами в ближайшее время.',
      thankClose: 'Закрыть',
    },
    maintenance: {
      title: 'Записаться на\nБесплатный Осмотр',
      sub: 'Заполните форму — техник свяжется с вами в течение 4 часов.',
      clientTypeLabel: 'Тип клиента',
      individual: 'Физическое лицо',
      company: 'Юридическое лицо',
      nameLabel: 'Имя и фамилия',
      namePlaceholder: 'Иван Петров',
      phoneLabel: 'Телефон',
      phonePlaceholder: '+373 69 000 000',
      emailLabel: 'Email',
      emailPlaceholder: 'email@company.md',
      companyLabel: 'Компания / Учреждение',
      companyPlaceholder: 'Fitness Club SRL',
      messageLabel: 'Сообщение (необязательно)',
      messagePlaceholder: 'Кратко опишите проект или оборудование…',
      submit: 'Отправить заявку',
      submitting: 'Отправляем…',
      required: 'Обязательное поле',
      thankTitle: 'С��асибо!',
      thankBody: 'Мы получили вашу заявку. Техник свяжется с вами в ближайшее время.',
      thankClose: 'Закрыть',
    },
  },
};

interface FormState {
  clientType: 'individual' | 'company';
  name: string;
  phone: string;
  email: string;
  company: string;
  message: string;
}

interface Errors {
  name?: string;
  phone?: string;
  company?: string;
}

export function ConsultationModal({ open, onClose, type }: ConsultationModalProps) {
  const { language } = useLanguage();
  const lang = language as Lang;
  const T = TEXT[lang][type];

  const [form, setForm] = useState<FormState>({ clientType: 'company', name: '', phone: '', email: '', company: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDone(false);
      setForm({ clientType: 'company', name: '', phone: '', email: '', company: '', message: '' });
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = T.required;
    if (!form.phone.trim()) e.phone = T.required;
    if (form.clientType === 'company' && !form.company.trim()) e.company = T.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      // 1. Save to Supabase (consultation_requests table if exists, otherwise clients)
      await supabase.from('consultation_requests').insert({
        client_type:  form.clientType,
        name:         form.name,
        phone:        form.phone,
        email:        form.email || null,
        company:      form.company || null,
        message:      form.message || null,
        request_type: type,
        created_at:   new Date().toISOString(),
      }).then(() => { /* silent — table may not exist yet */ });

      // 2. Send admin notification via EmailJS
      if (isEmailConfigured() && EMAILJS.tplAdmin) {
        emailjs.init({ publicKey: EMAILJS.publicKey });
        await emailjs.send(EMAILJS.serviceId, EMAILJS.tplAdmin, {
          to_email:         EMAILJS.adminEmail,
          order_id:         `CONS-${Date.now().toString(36).toUpperCase()}`,
          order_date:       new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()),
          client_name:      form.name,
          client_email:     form.email    || '—',
          client_phone:     form.phone,
          client_company:   form.company  || '—',
          delivery_address: '—',
          notes:            `[${type.toUpperCase()}] ${form.message || '—'}`,
          total_items:      1,
          total_price:      '—',
          items_list:       `Тип заявки: ${type}\nКомпания: ${form.company || '—'}\nСообщение: ${form.message || '—'}`,
          admin_url:        `${window.location.origin}/admin/requests`,
        }).catch(() => { /* silent */ });
      }
    } catch { /* silent */ }

    setSubmitting(false);
    setDone(true);
  };

  const setField = (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (field === 'name' || field === 'phone' || field === 'company') {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current || (e.target as HTMLElement).dataset.backdrop === 'true') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        data-backdrop="true"
      />

      {/* Panel */}
      <div
        className="relative z-10 bg-white w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col rounded-t-xl sm:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-8 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          /* ── THANK YOU STATE ── */
          <div className="flex flex-col items-center justify-center text-center px-6 py-12 sm:px-10 sm:py-16 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black flex items-center justify-center mb-6 sm:mb-8">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl tracking-tight text-black mb-3 sm:mb-4 whitespace-pre-line">
              {T.thankTitle}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-8 sm:mb-10">
              {T.thankBody}
            </p>
            <button
              onClick={onClose}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors border-b border-gray-200 hover:border-black pb-0.5"
            >
              {T.thankClose}
            </button>
          </div>
        ) : (
          /* ── FORM STATE ── */
          <form onSubmit={handleSubmit} noValidate>

            {/* Header */}
            <div className="px-5 pt-4 pb-5 sm:px-8 sm:pt-10 sm:pb-8 border-b border-gray-100">
              <h2 className="text-lg sm:text-[clamp(1.4rem,3vw,1.9rem)] leading-[1.15] sm:leading-[1.1] tracking-tight text-black whitespace-pre-line mb-2 sm:mb-3">
                {T.title}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">{T.sub}</p>
            </div>

            {/* Fields */}
            <div className="px-5 py-5 space-y-4 sm:px-8 sm:py-8 sm:space-y-6">

              {/* Client type toggle */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">
                  {T.clientTypeLabel}
                </label>
                <div className="flex border border-gray-200 w-full">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, clientType: 'individual', company: '' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-[11px] sm:text-xs uppercase tracking-wider transition-colors ${
                      form.clientType === 'individual'
                        ? 'bg-black text-white'
                        : 'text-gray-500 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    <UserCircle className="w-3.5 h-3.5" />
                    {T.individual}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, clientType: 'company' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-[11px] sm:text-xs uppercase tracking-wider border-l border-gray-200 transition-colors ${
                      form.clientType === 'company'
                        ? 'bg-black text-white'
                        : 'text-gray-500 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    {T.company}
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5 sm:mb-2">
                  {T.nameLabel} <span className="text-black">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={form.name}
                  onChange={setField('name')}
                  placeholder={T.namePlaceholder}
                  className={`w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${
                    errors.name ? 'border-black' : 'border-gray-200'
                  }`}
                />
                {errors.name && <p className="mt-1 text-[10px] text-black">{errors.name}</p>}
              </div>

              {/* Phone + Email side by side on mobile too */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-1">
                {/* Phone */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5 sm:mb-2">
                    {T.phoneLabel} <span className="text-black">*</span>
                  </label>
                  <PhoneInput
                    value={form.phone}
                    onChange={v => setForm(prev => ({ ...prev, phone: v }))}
                    placeholder="+373 (69) 12-34-56"
                    className={`w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${
                      errors.phone ? 'border-black' : 'border-gray-200'
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-[10px] text-black">{errors.phone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5 sm:mb-2">
                    {T.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder={T.emailPlaceholder}
                    className="w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Company — only for legal entities */}
              {form.clientType === 'company' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5 sm:mb-2">
                    {T.companyLabel} <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={setField('company')}
                    placeholder={T.companyPlaceholder}
                    className={`w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${
                      errors.company ? 'border-black' : 'border-gray-200'
                    }`}
                  />
                  {errors.company && <p className="mt-1 text-[10px] text-black">{errors.company}</p>}
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5 sm:mb-2">
                  {T.messageLabel}
                </label>
                <textarea
                  value={form.message}
                  onChange={setField('message')}
                  placeholder={T.messagePlaceholder}
                  rows={2}
                  className="w-full px-4 py-2.5 sm:py-3 text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors resize-none sm:rows-3"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="px-5 pb-6 sm:px-8 sm:pb-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    {T.submitting}
                  </>
                ) : (
                  <>
                    {T.submit}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}