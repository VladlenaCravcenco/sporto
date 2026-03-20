import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { X, ArrowRight, Check, FileSpreadsheet, Briefcase, UserCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { EMAILJS, isEmailConfigured } from '../../lib/emailService';
import emailjs from '@emailjs/browser';

interface Props {
  open: boolean;
  onClose: () => void;
}

const T = {
  ro: {
    badge:          'Prețuri B2B',
    title:          'Solicitați\nPricelistul',
    sub:            'Completați formularul — vă trimitem pricelistul complet cu prețuri wholesale în câteva ore.',
    clientTypeLabel: 'Tip client',
    individual:     'Persoană fizică',
    company:        'Persoană juridică',
    nameLabel:      'Nume și prenume',
    phoneLabel:     'Telefon',
    emailLabel:     'Email *',
    companyLabel:   'Compania / Instituția',
    noteLabel:      'Categorii de interes (opțional)',
    notePlaceholder:'Ex: aparate cardio, gantere, echipamente sală…',
    submit:         'Trimite solicitarea',
    submitting:     'Se trimite…',
    required:       'Câmp obligatoriu',
    thankTitle:     'Pricelistul\ne pe drum!',
    thankBody:      'Am primit solicitarea dvs. Vă vom trimite pricelistul complet în cel mai scurt timp posibil.',
    thankClose:     'Închide',
  },
  ru: {
    badge:          'B2B Цены',
    title:          'Запросить\nПрайс-лист',
    sub:            'Заполните форму — отправим полный прайс-лист с оптовыми ценами в течение нескольких часов.',
    clientTypeLabel: 'Тип клиента',
    individual:     'Физическое лицо',
    company:        'Юридическое лицо',
    nameLabel:      'Имя и фамилия',
    phoneLabel:     'Телефон',
    emailLabel:     'Email *',
    companyLabel:   'Компания / Учреждение',
    noteLabel:      'Категории интереса (необязательно)',
    notePlaceholder:'Напр: кардиотренажёры, гантели, силовое оборудование…',
    submit:         'Отправить запрос',
    submitting:     'Отправляем…',
    required:       'Обязательное поле',
    thankTitle:     'Прайс-лист\nуже в пути!',
    thankBody:      'Мы получили ваш запрос. Отправим полный прайс-лист с ценами в ближайшее время.',
    thankClose:     'Закрыть',
  },
};

interface FormState {
  clientType: 'individual' | 'company';
  name: string;
  phone: string;
  email: string;
  company: string;
  note: string;
}
interface Errors { name?: string; phone?: string; email?: string; company?: string; }

export function PriceListModal({ open, onClose }: Props) {
  const { language } = useLanguage();
  const C = T[language as 'ro' | 'ru'];

  const [form, setForm] = useState<FormState>({
    clientType: 'company', name: '', phone: '', email: '', company: '', note: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDone(false);
      setForm({ clientType: 'company', name: '', phone: '', email: '', company: '', note: '' });
      setErrors({});
      setTimeout(() => firstRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.name.trim())  e.name  = C.required;
    if (!form.phone.trim()) e.phone = C.required;
    if (!form.email.trim()) e.email = C.required;
    if (form.clientType === 'company' && !form.company.trim()) e.company = C.required;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      // 1. Save to Supabase
      await supabase.from('pricelist_requests').insert({
        client_type: form.clientType,
        name:        form.name,
        phone:       form.phone,
        email:       form.email,
        company:     form.company || null,
        note:        form.note   || null,
        created_at:  new Date().toISOString(),
      }).then(() => { /* silent */ });

      // 2. Notify admin via EmailJS
      if (isEmailConfigured() && EMAILJS.tplAdmin) {
        emailjs.init({ publicKey: EMAILJS.publicKey });
        await emailjs.send(EMAILJS.serviceId, EMAILJS.tplAdmin, {
          to_email:         EMAILJS.adminEmail,
          order_id:         `PRL-${Date.now().toString(36).toUpperCase()}`,
          order_date:       new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()),
          client_name:      form.name,
          client_email:     form.email,
          client_phone:     form.phone,
          client_company:   form.company || '—',
          delivery_address: '—',
          notes:            `[PRICELIST REQUEST]\nКатегории: ${form.note || '—'}`,
          total_items:      1,
          total_price:      '—',
          items_list:       `Запрос прайс-листа\nТип клиента: ${form.clientType}\nКатегории: ${form.note || '—'}`,
          admin_url:        `${window.location.origin}/admin`,
        }).catch(() => { /* silent */ });
      }
    } catch { /* silent */ }

    setSubmitting(false);
    setDone(true);
  };

  const setField = (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      if (field in errors) setErrors(p => ({ ...p, [field]: undefined }));
    };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative z-10 bg-white w-full sm:max-w-md max-h-[92vh] sm:max-h-[88vh] overflow-y-auto shadow-2xl flex flex-col rounded-t-xl sm:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-8 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          /* ── Thank you ── */
          <div className="flex flex-col items-center justify-center text-center px-8 py-16 flex-1">
            <div className="w-14 h-14 bg-black flex items-center justify-center mb-6">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl tracking-tight text-black mb-3 whitespace-pre-line leading-tight">
              {C.thankTitle}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-8">{C.thankBody}</p>
            <button
              onClick={onClose}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black border-b border-gray-200 hover:border-black pb-0.5 transition-colors"
            >
              {C.thankClose}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <div className="px-6 pt-5 pb-5 sm:px-8 sm:pt-10 sm:pb-8 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400">{C.badge}</span>
              </div>
              <h2 className="text-xl sm:text-2xl tracking-tight text-black whitespace-pre-line leading-tight mb-2">
                {C.title}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">{C.sub}</p>
            </div>

            {/* Fields */}
            <div className="px-6 py-5 space-y-4 sm:px-8 sm:py-7 sm:space-y-5">

              {/* Client type */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-2">
                  {C.clientTypeLabel}
                </label>
                <div className="flex border border-gray-200">
                  {(['individual', 'company'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, clientType: type, company: type === 'individual' ? '' : p.company }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider transition-colors border-r last:border-0 border-gray-200 ${
                        form.clientType === type
                          ? 'bg-black text-white'
                          : 'text-gray-500 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      {type === 'individual'
                        ? <><UserCircle className="w-3.5 h-3.5" />{C.individual}</>
                        : <><Briefcase className="w-3.5 h-3.5" />{C.company}</>
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                  {C.nameLabel} <span className="text-black">*</span>
                </label>
                <input
                  ref={firstRef}
                  type="text"
                  value={form.name}
                  onChange={setField('name')}
                  placeholder={language === 'ro' ? 'Ion Popescu' : 'Иван Петров'}
                  className={`w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.name ? 'border-black' : 'border-gray-200'}`}
                />
                {errors.name && <p className="mt-1 text-[10px] text-black">{errors.name}</p>}
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                    {C.phoneLabel} <span className="text-black">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="+373 69 ···"
                    className={`w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.phone ? 'border-black' : 'border-gray-200'}`}
                  />
                  {errors.phone && <p className="mt-1 text-[10px] text-black">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                    {C.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="email@..."
                    className={`w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.email ? 'border-black' : 'border-gray-200'}`}
                  />
                  {errors.email && <p className="mt-1 text-[10px] text-black">{errors.email}</p>}
                </div>
              </div>

              {/* Company (if juridical) */}
              {form.clientType === 'company' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                    {C.companyLabel} <span className="text-black">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={setField('company')}
                    placeholder="Fitness Club SRL"
                    className={`w-full h-10 sm:h-11 px-4 text-sm bg-gray-50 border placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors ${errors.company ? 'border-black' : 'border-gray-200'}`}
                  />
                  {errors.company && <p className="mt-1 text-[10px] text-black">{errors.company}</p>}
                </div>
              )}

              {/* Interest note */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                  {C.noteLabel}
                </label>
                <textarea
                  value={form.note}
                  onChange={setField('note')}
                  placeholder={C.notePlaceholder}
                  rows={2}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-black transition-colors resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    {C.submitting}
                  </>
                ) : (
                  <>
                    {C.submit}
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
