import { useState, useEffect } from 'react';
import { Save, X, ArrowRight, Monitor, Globe } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { toast } from 'sonner';

const STORAGE_KEY = 'sporto_popup';
const SEEN_KEY    = 'sporto_promo_seen';

interface PopupData {
  active: boolean;
  title_ro: string; title_ru: string;
  body_ro: string;  body_ru: string;
  cta_label_ro: string; cta_label_ru: string;
  cta_url: string;
  show_once: boolean;
  delay_seconds: number;
}

const DEFAULT: PopupData = {
  active: true,
  title_ro: 'Echipament sportiv\nla cel mai bun preț',
  title_ru: 'Спортивное оборудование\nпо лучшей цене',
  body_ro:  'Catalog de peste 8 000 de produse din Italia și UE. Prețuri angro pentru cluburi, școli și instituții.',
  body_ru:  'Каталог более 8 000 товаров из Италии и ЕС. Оптовые цены для клубов, школ и учреждений.',
  cta_label_ro: 'Vezi Catalogul',
  cta_label_ru: 'Смотреть каталог',
  cta_url: '/catalog',
  show_once: true,
  delay_seconds: 5,
};

function loadFromStorage(): PopupData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

// ── Toggle component ───────────────────────────────────────────────────────────
function Toggle({ value, onChange }: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-11 h-6 transition-colors duration-200 focus:outline-none ${
        value ? 'bg-white' : 'bg-white/10 border border-white/20'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 transition-all duration-200 ${
          value
            ? 'bg-black left-6'
            : 'bg-white/30 left-1'
        }`}
      />
    </button>
  );
}

// ── Popup card preview (reusable) ──────────────────────────────────────────────
function PopupCard({ data, lang, onClose }: {
  data: PopupData;
  lang: 'ro' | 'ru';
  onClose?: () => void;
}) {
  const title = lang === 'ro' ? data.title_ro : data.title_ru;
  const body  = lang === 'ro' ? data.body_ro  : data.body_ru;
  const cta   = lang === 'ro' ? data.cta_label_ro : data.cta_label_ru;
  const isEmpty = !title && !body;

  return (
    <div className="relative bg-black border border-white/15 max-w-md w-full shadow-2xl">
      {/* accent line */}
      <div className="absolute top-0 left-8 w-14 h-0.5 bg-white" />

      {/* close (decorative) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-gray-600 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="px-8 pt-10 pb-9">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-5">
          Sporto · SPORTOSFERA S.R.L.
        </p>

        {isEmpty ? (
          <div className="py-4">
            <p className="text-gray-700 text-sm italic">
              {lang === 'ro' ? '(completați câmpurile din stânga)' : '(заполните поля слева)'}
            </p>
          </div>
        ) : (
          <>
            {title && (
              <h2 className="text-[1.6rem] leading-[1.15] tracking-tight text-white mb-4 whitespace-pre-line">
                {title}
              </h2>
            )}
            {body && (
              <p className="text-sm text-gray-400 leading-relaxed mb-8">{body}</p>
            )}
          </>
        )}

        <div className="flex items-center gap-5">
          {(cta || !isEmpty) && (
            <div className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-widest opacity-90">
              {cta || (lang === 'ro' ? 'Buton CTA' : 'Кнопка CTA')}
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-[10px] text-gray-700 uppercase tracking-widest">
            {lang === 'ro' ? 'Închide' : 'Закрыть'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AdminPopup() {
  const { lang } = useAdminLang();
  const [data, setData] = useState<PopupData>(loadFromStorage);
  const [previewLang, setPreviewLang] = useState<'ro' | 'ru'>('ro');

  const isRu = lang === 'ru';

  useEffect(() => { setData(loadFromStorage()); }, []);

  const set = <K extends keyof PopupData>(key: K, value: PopupData[K]) =>
    setData(p => ({ ...p, [key]: value }));

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Reset seen flag so popup shows again after save
      sessionStorage.removeItem(SEEN_KEY);
      toast(isRu ? '✓ Попап сохранён — перезагрузите сайт' : '✓ Popup salvat — reîncărcați site-ul');
    } catch {
      toast(isRu ? 'Ошибка сохранения' : 'Eroare la salvare');
    }
  };

  const handleResetSeen = () => {
    sessionStorage.removeItem(SEEN_KEY);
    toast(isRu ? 'Память сброшена — попап покажется снова' : 'Memorie resetată — popup-ul va apărea din nou');
  };

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden bg-black">

      {/* ══════════════════════════════════════
          LEFT — EDITOR
      ══════════════════════════════════════ */}
      <div className="w-[400px] shrink-0 flex flex-col border-r border-white/10 overflow-y-auto">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-black border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">{isRu ? 'Контент' : 'Conținut'}</p>
              <h1 className="text-base text-white">{isRu ? 'Промо-попап' : 'Promo-popup'}</h1>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-white text-black px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              <Save className="w-3 h-3" />
              {isRu ? 'Сохранить' : 'Salvează'}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="px-5 py-5 space-y-6">

          {/* Active */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">
              {isRu ? 'Статус' : 'Status'}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{isRu ? 'Показывать попап' : 'Afișează popup'}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {isRu ? 'Появляется через N секунд после загрузки' : 'Apare după N secunde de la încărcare'}
                </p>
              </div>
              <Toggle
                value={data.active}
                onChange={v => set('active', v)}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">
              {isRu ? 'Заголовок' : 'Titlu'}
            </p>
            <div className="space-y-2">
              <div>
                <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">RO</div>
                <textarea
                  value={data.title_ro}
                  onChange={e => set('title_ro', e.target.value)}
                  rows={2}
                  placeholder={DEFAULT.title_ro}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-800 focus:border-white focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">RU</div>
                <textarea
                  value={data.title_ru}
                  onChange={e => set('title_ru', e.target.value)}
                  rows={2}
                  placeholder={DEFAULT.title_ru}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-800 focus:border-white focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">
              {isRu ? 'Описание' : 'Descriere'}
            </p>
            <div className="space-y-2">
              <div>
                <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">RO</div>
                <textarea
                  value={data.body_ro}
                  onChange={e => set('body_ro', e.target.value)}
                  rows={3}
                  placeholder={DEFAULT.body_ro}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-800 focus:border-white focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">RU</div>
                <textarea
                  value={data.body_ru}
                  onChange={e => set('body_ru', e.target.value)}
                  rows={3}
                  placeholder={DEFAULT.body_ru}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-800 focus:border-white focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">
              {isRu ? 'Кнопка' : 'Buton'}
            </p>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">{isRu ? 'Текст RO' : 'Text RO'}</div>
                  <input
                    value={data.cta_label_ro}
                    onChange={e => set('cta_label_ro', e.target.value)}
                    placeholder={DEFAULT.cta_label_ro}
                    className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white placeholder-gray-800 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">{isRu ? 'Текст RU' : 'Text RU'}</div>
                  <input
                    value={data.cta_label_ru}
                    onChange={e => set('cta_label_ru', e.target.value)}
                    placeholder={DEFAULT.cta_label_ru}
                    className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white placeholder-gray-800 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">URL</div>
                <input
                  value={data.cta_url}
                  onChange={e => set('cta_url', e.target.value)}
                  placeholder="/catalog"
                  className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white placeholder-gray-800 focus:border-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">
              {isRu ? 'Настройки показа' : 'Setări afișare'}
            </p>
            <div className="space-y-4">

              {/* Delay */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">{isRu ? 'Задержка появления' : 'Întârziere apariție'}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{isRu ? 'секунды после загрузки страницы' : 'secunde după încărcarea paginii'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={60}
                    value={data.delay_seconds}
                    onChange={e => set('delay_seconds', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 h-9 bg-black border border-white/20 px-2 text-sm text-white text-center focus:border-white focus:outline-none transition-colors"
                  />
                  <span className="text-xs text-gray-600">{isRu ? 'сек' : 'sec'}</span>
                </div>
              </div>

              {/* Show once */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white">{isRu ? 'Показывать один раз' : 'Afișează o singură dată'}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{isRu ? 'sessionStorage — до закрытия вкладки' : 'sessionStorage — până la închiderea tab-ului'}</p>
                </div>
                <Toggle
                  value={data.show_once}
                  onChange={v => set('show_once', v)}
                />
              </div>

              {/* Reset seen */}
              <button
                onClick={handleResetSeen}
                className="w-full border border-white/10 text-gray-600 hover:text-gray-300 hover:border-white/20 py-2 text-xs transition-colors"
              >
                {isRu ? 'Сбросить память браузера (показать снова)' : 'Resetați memoria browser-ului (afișați din nou)'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — PREVIEW
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Preview toolbar */}
        <div className="shrink-0 bg-[#111] border-b border-white/10 px-5 py-2.5 flex items-center gap-3">
          <Monitor className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] text-gray-600 flex-1 uppercase tracking-widest">
            {isRu ? 'Живое превью попапа' : 'Preview live al popup-ului'}
          </span>

          {/* Lang toggle */}
          <div className="flex items-center gap-1 border border-white/15">
            <button
              onClick={() => setPreviewLang('ro')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${previewLang === 'ro' ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}
            >
              <Globe className="w-2.5 h-2.5" /> RO
            </button>
            <button
              onClick={() => setPreviewLang('ru')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${previewLang === 'ru' ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}
            >
              <Globe className="w-2.5 h-2.5" /> RU
            </button>
          </div>
        </div>

        {/* Simulated site background */}
        <div className="flex-1 overflow-hidden relative">

          {/* Blurred site mockup behind */}
          <div className="absolute inset-0 bg-white">
            {/* fake nav */}
            <div className="h-12 bg-black border-b border-white/5 flex items-center px-8 gap-6">
              <div className="text-white text-xs tracking-widest">SPORTO</div>
              <div className="flex gap-4 ml-8">
                {['Catalog', 'Servicii', 'Contacte'].map(n => (
                  <div key={n} className="text-[10px] text-gray-600 uppercase tracking-widest">{n}</div>
                ))}
              </div>
            </div>
            {/* fake hero */}
            <div className="px-8 pt-12">
              <div className="h-3 bg-gray-100 w-1/3 mb-3 rounded" />
              <div className="h-8 bg-gray-100 w-2/3 mb-2 rounded" />
              <div className="h-8 bg-gray-100 w-1/2 mb-6 rounded" />
              <div className="h-3 bg-gray-100 w-1/2 mb-2 rounded" />
              <div className="h-3 bg-gray-100 w-2/5 mb-8 rounded" />
              <div className="h-10 bg-gray-100 w-36 rounded" />
            </div>
          </div>

          {/* Overlay + popup */}
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center p-6">

            {/* Status badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className={`flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-widest border ${
                data.active
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${data.active ? 'bg-green-400' : 'bg-red-400'}`} />
                {data.active
                  ? (isRu ? `Активен · через ${data.delay_seconds} сек` : `Activ · după ${data.delay_seconds} sec`)
                  : (isRu ? 'Выключен — не показывается' : 'Dezactivat — nu se afișează')}
              </div>
            </div>

            {/* The actual popup card */}
            <div className={`transition-opacity duration-300 ${data.active ? 'opacity-100' : 'opacity-40'}`}>
              <PopupCard
                data={data}
                lang={previewLang}
              />
            </div>
          </div>

          {/* Disabled overlay when inactive */}
          {!data.active && (
            <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
              <p className="text-xs text-gray-600 uppercase tracking-widest">
                {isRu ? 'Включите попап чтобы он появился на сайте' : 'Activați popup-ul pentru a apărea pe site'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}