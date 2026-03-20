import { useState, useEffect } from 'react';
import {
  Save, Monitor, FileText, Plus, Trash2,
  Building2, Mail, Phone, MapPin, Clock,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { CONTACTS } from '../../lib/contacts';
import { saveContacts } from '../hooks/useContacts';

// ── Типы ────────────────────────────────────────────────────────────────────
interface SocialEntry {
  id: string;
  type: SocialType;
  url: string;
}

type SocialType = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'telegram' | 'whatsapp' | 'viber';

interface ContactsData {
  phone: string;
  phone_2: string;
  email: string;
  address_ro: string;
  address_ru: string;
  hours_ro: string;
  hours_ru: string;
  legal_name: string;
  legal_idno: string;
  socials: SocialEntry[];
}

// ── Соцсети — конфиг ────────────────────────────────────────────────────────
const SOCIAL_CONFIG: Record<SocialType, { label: string; color: string; placeholder: string; icon: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', placeholder: 'https://instagram.com/sporto.md',     icon: '📸' },
  facebook:  { label: 'Facebook',  color: '#1877F2', placeholder: 'https://facebook.com/sporto.md',      icon: '👥' },
  tiktok:    { label: 'TikTok',    color: '#111111', placeholder: 'https://tiktok.com/@sporto.md',       icon: '🎵' },
  youtube:   { label: 'YouTube',   color: '#FF0000', placeholder: 'https://youtube.com/@sporto',         icon: '▶️' },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', placeholder: 'https://linkedin.com/company/sporto', icon: '💼' },
  telegram:  { label: 'Telegram',  color: '#29A8EB', placeholder: 'https://t.me/sporto_md',              icon: '✈️' },
  whatsapp:  { label: 'WhatsApp',  color: '#25D366', placeholder: 'https://wa.me/37361262777',           icon: '💬' },
  viber:     { label: 'Viber',     color: '#7360F2', placeholder: 'viber://chat?number=%2B37361262777',  icon: '📞' },
};

const ALL_SOCIAL_TYPES = Object.keys(SOCIAL_CONFIG) as SocialType[];

// ── Дефолты ─────────────────────────────────────────────────────────────────
const DEFAULTS: ContactsData = {
  phone:      CONTACTS.phoneDisplay,
  phone_2:    '',
  email:      CONTACTS.email,
  address_ro: CONTACTS.address_ro,
  address_ru: CONTACTS.address_ru,
  hours_ro:   CONTACTS.hours_ro,
  hours_ru:   CONTACTS.hours_ru,
  legal_name: CONTACTS.legal_name,
  legal_idno: CONTACTS.legal_idno,
  socials: [
    { id: '1', type: 'telegram', url: CONTACTS.telegram },
    { id: '2', type: 'whatsapp', url: CONTACTS.whatsapp },
    { id: '3', type: 'viber',    url: CONTACTS.viber    },
  ],
};

// ── Supabase helpers ─────────────────────────────────────────────────────────
function fromSupabase(rows: { key: string; value: string }[]): Partial<ContactsData> {
  const obj = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const result: Partial<ContactsData> = {};
  const fields = ['phone', 'phone_2', 'email', 'address_ro', 'address_ru', 'hours_ro', 'hours_ru', 'legal_name', 'legal_idno'] as const;
  fields.forEach(f => { if (obj[f] !== undefined) (result as any)[f] = obj[f]; });
  if (obj.socials) { try { result.socials = JSON.parse(obj.socials); } catch {} }
  return result;
}

function toSupabase(data: ContactsData): Record<string, string> {
  return {
    phone:        data.phone,
    phoneDisplay: data.phone,
    phone_2:      data.phone_2,
    email:        data.email,
    address_ro:   data.address_ro,
    address_ru:   data.address_ru,
    hours_ro:     data.hours_ro,
    hours_ru:     data.hours_ru,
    legal_name:   data.legal_name,
    legal_idno:   data.legal_idno,
    socials:      JSON.stringify(data.socials),
    // обратная совместимость
    telegram:     data.socials.find(s => s.type === 'telegram')?.url  || '',
    whatsapp:     data.socials.find(s => s.type === 'whatsapp')?.url  || '',
    viber:        data.socials.find(s => s.type === 'viber')?.url     || '',
    instagram:    data.socials.find(s => s.type === 'instagram')?.url || '',
    facebook:     data.socials.find(s => s.type === 'facebook')?.url  || '',
  };
}

// Телефон → raw для ссылки
function toRaw(phone: string) { return phone.replace(/[^\d+]/g, ''); }

// ── Поля ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 bg-black border border-white/20 px-3 text-xs text-white placeholder-gray-600 focus:border-white/60 focus:outline-none transition-colors" />
      {hint && <div className="text-[9px] text-gray-700 mt-1 leading-relaxed">{hint}</div>}
    </div>
  );
}

function BiField({ label, valRo, valRu, onRo, onRu }: {
  label: string; valRo: string; valRu: string; onRo: (v: string) => void; onRu: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[8px] text-gray-700 uppercase tracking-widest mb-1">RO</div>
          <input value={valRo} onChange={e => onRo(e.target.value)}
            className="w-full h-9 bg-black border border-white/20 px-3 text-xs text-white focus:border-white/60 focus:outline-none transition-colors" />
        </div>
        <div>
          <div className="text-[8px] text-gray-700 uppercase tracking-widest mb-1">RU</div>
          <input value={valRu} onChange={e => onRu(e.target.value)}
            className="w-full h-9 bg-black border border-white/20 px-3 text-xs text-white focus:border-white/60 focus:outline-none transition-colors" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ── SVG иконки соцсетей (те же что на сайте) ────────────────────────────────
const SOCIAL_SVGS: Record<SocialType, React.ReactNode> = {
  whatsapp:  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.555 4.104 1.523 5.826L.044 23.428a.5.5 0 0 0 .612.612l5.602-1.479A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.868 9.868 0 0 1-5.034-1.376l-.36-.214-3.733.985.999-3.642-.235-.374A9.869 9.869 0 0 1 2.118 12C2.118 6.533 6.533 2.118 12 2.118c5.467 0 9.882 4.415 9.882 9.882 0 5.467-4.415 9.882-9.882 9.882z"/></svg>,
  telegram:  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.537-.194 1.006.131.973.057z"/></svg>,
  viber:     <img src="https://cdn.simpleicons.org/viber/white" className="w-4 h-4" alt="Viber" />,
  instagram: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>,
  facebook:  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  tiktok:    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  youtube:   <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>,
  linkedin:  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
};

// ── Превью ───────────────────────────────────────────────────────────────────
function ContactsPreview({ d }: { d: ContactsData }) {
  const phone = d.phone || DEFAULTS.phone;
  const email = d.email || DEFAULTS.email;

  const infoRows = [
    { icon: <Building2 className="w-3.5 h-3.5" />, label: 'Denumire',   value: d.legal_name || DEFAULTS.legal_name },
    { icon: <FileText   className="w-3.5 h-3.5" />, label: 'Cod Fiscal', value: d.legal_idno || DEFAULTS.legal_idno },
    { icon: <MapPin     className="w-3.5 h-3.5" />, label: 'Adresă',     value: d.address_ro || DEFAULTS.address_ro },
    { icon: <Mail       className="w-3.5 h-3.5" />, label: 'Email',      value: email, href: `mailto:${email}` },
    { icon: <Phone      className="w-3.5 h-3.5" />, label: 'Telefon',    value: phone, href: `tel:${toRaw(phone)}` },
    ...(d.phone_2 ? [{ icon: <Phone className="w-3.5 h-3.5" />, label: 'Telefon 2', value: d.phone_2, href: `tel:${toRaw(d.phone_2)}` }] : []),
    { icon: <Clock      className="w-3.5 h-3.5" />, label: 'Ore lucru',  value: d.hours_ro || DEFAULTS.hours_ro },
  ];

  return (
    <div className="bg-white min-h-full">
      {/* Hero mock */}
      <div className="bg-black text-white px-8 py-8 border-b border-white/5">
        <div className="text-[9px] uppercase tracking-[0.2em] text-gray-600 mb-3 flex items-center gap-2">
          <div className="w-px h-3 bg-gray-700" /> Colaborare
        </div>
        <div className="text-2xl leading-tight tracking-tight text-white mb-2">
          Deveniți<br />Partenerul<br />Nostru
        </div>
        <div className="text-xs text-gray-500 max-w-xs mt-3 leading-relaxed">
          Lucrăm cu companii, instituții și antreprenori care doresc să ofere echipamente sportive de calitate.
        </div>
      </div>

      <div className="px-8 py-8 space-y-4">
        {/* Section label */}
        <div className="text-[9px] uppercase tracking-widest text-gray-400 flex items-center gap-3">
          <span>Date Juridice & Contact</span>
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-gray-300">preview · RO</span>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`mailto:${email}`} className="group border border-gray-100 hover:border-gray-300 p-4 flex items-start gap-3 transition-colors">
            <div className="w-8 h-8 bg-gray-50 group-hover:bg-black flex items-center justify-center flex-shrink-0 transition-colors">
              <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Email</div>
              <div className="text-xs text-gray-700 break-all">{email}</div>
            </div>
          </a>
          <a href={`tel:${toRaw(phone)}`} className="group border border-gray-100 hover:border-gray-300 p-4 flex items-start gap-3 transition-colors">
            <div className="w-8 h-8 bg-gray-50 group-hover:bg-black flex items-center justify-center flex-shrink-0 transition-colors">
              <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Telefon</div>
              <div className="text-xs text-gray-700">{phone}</div>
              {d.phone_2 && <div className="text-[10px] text-gray-400 mt-0.5">{d.phone_2}</div>}
            </div>
          </a>
        </div>

        {/* Legal card — точная копия стиля сайта */}
        <div className="border border-gray-100">
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-700">Date Juridice</span>
          </div>
          <div className="px-5 py-4 space-y-3.5">
            {infoRows.map((row, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 text-gray-300 flex-shrink-0">{row.icon}</div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">{row.label}</div>
                  {'href' in row && row.href ? (
                    <a href={row.href} className="text-xs text-gray-700 hover:text-black transition-colors">{row.value}</a>
                  ) : (
                    <div className="text-xs text-gray-700 leading-relaxed">{row.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messengers — квадратные кнопки с SVG как на сайте */}
        {d.socials.filter(s => s.url).length > 0 && (
          <div className="border border-gray-100 bg-white px-5 py-4">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Scrieți-ne direct</div>
            <div className="flex items-center gap-3 flex-wrap">
              {d.socials.filter(s => s.url).map(s => {
                const cfg = SOCIAL_CONFIG[s.type];
                const svgIcon = SOCIAL_SVGS[s.type];
                return (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                    title={cfg.label}
                    className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: cfg.color }}>
                    {svgIcon}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {d.socials.length === 0 && (
          <div className="border border-dashed border-gray-100 px-5 py-3 text-[10px] text-gray-300 text-center">
            Соцсети не добавлены — блок не показывается на сайте
          </div>
        )}
      </div>
    </div>
  );
}



// ── Главный компонент ────────────────────────────────────────────────────────
export function AdminContacts() {
  const { lang } = useAdminLang();
  const isRu = lang === 'ru';

  const [data, setData]           = useState<ContactsData>({ ...DEFAULTS });
  const [published, setPublished] = useState<ContactsData>({ ...DEFAULTS });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('key, value').then(({ data: rows }) => {
      if (rows && rows.length > 0) {
        const merged = { ...DEFAULTS, ...fromSupabase(rows) };
        setData(merged);
        setPublished(merged);
      }
      setLoading(false);
    });
  }, []);

  const set = <K extends keyof Omit<ContactsData, 'socials'>>(key: K, value: string) =>
    setData(p => ({ ...p, [key]: value }));

  const addSocial = (type: SocialType) => {
    if (data.socials.find(s => s.type === type)) return;
    setData(p => ({ ...p, socials: [...p.socials, { id: Date.now().toString(), type, url: '' }] }));
  };

  const updateSocial = (id: string, url: string) =>
    setData(p => ({ ...p, socials: p.socials.map(s => s.id === id ? { ...s, url } : s) }));

  const removeSocial = (id: string) =>
    setData(p => ({ ...p, socials: p.socials.filter(s => s.id !== id) }));

  const moveSocial = (id: string, dir: -1 | 1) => {
    setData(p => {
      const arr = [...p.socials];
      const idx = arr.findIndex(s => s.id === id);
      const to = idx + dir;
      if (to < 0 || to >= arr.length) return p;
      [arr[idx], arr[to]] = [arr[to], arr[idx]];
      return { ...p, socials: arr };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveContacts(toSupabase(data) as any);
      setPublished({ ...data });
      toast(isRu ? '✓ Сохранено — сайт обновлён' : '✓ Salvat — site actualizat');
    } catch {
      toast(isRu ? 'Ошибка сохранения' : 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm(isRu ? 'Сбросить к значениям по умолчанию?' : 'Resetați la valorile implicite?')) {
      setData({ ...DEFAULTS });
    }
  };

  const hasChanges = JSON.stringify(data) !== JSON.stringify(published);
  const usedTypes = data.socials.map(s => s.type);
  const availableTypes = ALL_SOCIAL_TYPES.filter(t => !usedTypes.includes(t));

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-48px)] items-center justify-center bg-black">
        <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden bg-black">

      {/* ══ LEFT — EDITOR ══ */}
      <div className="w-[400px] shrink-0 flex flex-col border-r border-white/10 overflow-y-auto">

        <div className="sticky top-0 z-10 bg-black border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">{isRu ? 'Контент' : 'Conținut'}</p>
              <h1 className="text-base text-white">{isRu ? 'Контакты' : 'Contacte'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset}
                className="h-8 px-3 text-[10px] text-gray-600 border border-white/10 hover:border-white/30 hover:text-gray-300 transition-colors uppercase tracking-wider">
                {isRu ? 'Сброс' : 'Reset'}
              </button>
              <button onClick={handleSave} disabled={saving || !hasChanges}
                className={`flex items-center gap-1.5 px-4 h-8 text-xs uppercase tracking-widest transition-colors ${hasChanges && !saving ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/10 text-gray-600 cursor-default'}`}>
                {saving
                  ? <span className="w-3 h-3 border border-gray-400 border-t-white rounded-full animate-spin" />
                  : <Save className="w-3 h-3" />}
                {isRu ? 'Сохранить' : 'Salvează'}
              </button>
            </div>
          </div>
          {hasChanges && (
            <div className="mt-2 text-[9px] text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
              {isRu ? 'Есть несохранённые изменения' : 'Modificări nesalvate'}
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-6">

          <Section title={isRu ? 'Телефоны' : 'Telefoane'}>
            <Field
              label={isRu ? 'Основной телефон' : 'Telefon principal'}
              value={data.phone} onChange={v => set('phone', v)} type="tel"
              placeholder="+373 61 262 777"
              hint={isRu
                ? 'Вводи с пробелами (+373 61 262 777) — красиво отобразится везде, ссылка создастся автоматически'
                : 'Introdu cu spații (+373 61 262 777) — se afișează frumos, link-ul se creează automat'}
            />
            <Field
              label={isRu ? 'Второй телефон (необязательно)' : 'Al 2-lea telefon (opțional)'}
              value={data.phone_2} onChange={v => set('phone_2', v)} type="tel"
              placeholder="+373 69 000 000"
            />
          </Section>

          <Section title="Email">
            <Field label="Email" value={data.email} onChange={v => set('email', v)} type="email" placeholder={DEFAULTS.email} />
          </Section>

          <Section title={isRu ? 'Адрес и часы' : 'Adresă și ore'}>
            <BiField label={isRu ? 'Адрес' : 'Adresă'}
              valRo={data.address_ro} valRu={data.address_ru}
              onRo={v => set('address_ro', v)} onRu={v => set('address_ru', v)} />
            <BiField label={isRu ? 'Часы работы' : 'Ore de lucru'}
              valRo={data.hours_ro} valRu={data.hours_ru}
              onRo={v => set('hours_ro', v)} onRu={v => set('hours_ru', v)} />
          </Section>

          <Section title={isRu ? 'Юридические данные' : 'Date juridice'}>
            <Field label={isRu ? 'Юр. название' : 'Denumire juridică'} value={data.legal_name} onChange={v => set('legal_name', v)} placeholder={DEFAULTS.legal_name} />
            <Field label={isRu ? 'Код фискал (IDNO)' : 'Cod fiscal (IDNO)'} value={data.legal_idno} onChange={v => set('legal_idno', v)} placeholder={DEFAULTS.legal_idno} />
          </Section>

          {/* ── Соцсети ── */}
          <Section title={isRu ? 'Соцсети и мессенджеры' : 'Rețele sociale & mesagerie'}>

            {data.socials.length > 0 && (
              <div className="space-y-2">
                {data.socials.map((s, idx) => {
                  const cfg = SOCIAL_CONFIG[s.type];
                  return (
                    <div key={s.id} className="border border-white/10 p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          <span className="text-[10px] text-white uppercase tracking-wider">{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => moveSocial(s.id, -1)} disabled={idx === 0}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 transition-colors text-xs">↑</button>
                          <button onClick={() => moveSocial(s.id, 1)} disabled={idx === data.socials.length - 1}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 transition-colors text-xs">↓</button>
                          <button onClick={() => removeSocial(s.id)}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <input type="url" value={s.url} onChange={e => updateSocial(s.id, e.target.value)}
                        placeholder={cfg.placeholder}
                        className="w-full h-8 bg-black border border-white/10 px-2.5 text-[11px] text-white placeholder-gray-700 focus:border-white/40 focus:outline-none transition-colors" />
                    </div>
                  );
                })}
              </div>
            )}

            {availableTypes.length > 0 && (
              <div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">
                  {isRu ? '+ Добавить сеть' : '+ Adaugă rețea'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTypes.map(type => {
                    const cfg = SOCIAL_CONFIG[type];
                    return (
                      <button key={type} onClick={() => addSocial(type)}
                        className="flex items-center gap-1 px-2 py-1.5 border border-white/10 text-[10px] text-gray-400 hover:border-white/30 hover:text-white transition-colors">
                        <Plus className="w-2.5 h-2.5" />
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          <div className="border border-white/10 px-4 py-3 text-[10px] text-gray-600 leading-relaxed">
            💡 {isRu
              ? 'После сохранения данные обновятся везде: шапка, футер, страница контактов.'
              : 'După salvare, datele se actualizează peste tot: antet, subsol, pagina de contacte.'}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — PREVIEW ══ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="shrink-0 bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-3">
          <Monitor className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] text-gray-500 flex-1 uppercase tracking-widest">/contacts</span>
          <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest ${hasChanges ? 'text-amber-500' : 'text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasChanges ? 'bg-amber-400' : 'bg-green-400'}`} />
            {hasChanges ? (isRu ? 'Не сохранено' : 'Nesalvat') : (isRu ? 'Актуально' : 'Actualizat')}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ContactsPreview d={data} />
        </div>
      </div>
    </div>
  );
}