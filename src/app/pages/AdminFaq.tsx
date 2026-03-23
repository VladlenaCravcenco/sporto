import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ChevronDown, GripVertical, Eye, EyeOff, Sparkles, Info } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { toast } from 'sonner';

const STORAGE_KEY = 'sporto_faq';

interface FaqItem {
  id: string;
  question_ro: string;
  question_ru: string;
  answer_ro: string;
  answer_ru: string;
  sort_order: number;
  active: boolean;
}

const SEO_DEFAULTS: Omit<FaqItem, 'id'>[] = [
  {
    question_ro: 'Livrați echipamente sportive în toată Moldova?',
    question_ru: 'Доставляете ли вы спортивное оборудование по всей Молдове?',
    answer_ro: 'Da, livrăm echipamente sportive în toată Republica Moldova. Comenzile din Chișinău sunt procesate în 1–2 zile lucrătoare, iar în restul țării — în 3–5 zile. Livrarea se efectuează prin curierat sau transport propriu pentru comenzi mari.',
    answer_ru: 'Да, мы доставляем спортивное оборудование по всей Молдове. Заказы по Кишинёву выполняются за 1–2 рабочих дня, по остальным регионам — за 3–5 дней. Доставка осуществляется курьером или собственным транспортом для крупных партий.',
    sort_order: 0,
    active: true,
  },
  {
    question_ro: 'Oferiți prețuri wholesale pentru echipamente fitness?',
    question_ru: 'Предоставляете ли вы оптовые цены на фитнес-оборудование?',
    answer_ro: 'Da, oferim prețuri speciale wholesale pentru cluburi fitness, săli de sport, magazine sportive și instituții. Condiții B2B individuale se stabilesc în funcție de volumul comenzii. Contactați-ne pentru o ofertă personalizată — consultanța este gratuită.',
    answer_ru: 'Да, мы предлагаем специальные оптовые цены для фитнес-клубов, спортивных залов, магазинов и учреждений. Условия B2B рассчитываются индивидуально в зависимости от объёма заказа. Свяжитесь с нами для персонального предложения — консультация бесплатна.',
    sort_order: 1,
    active: true,
  },
  {
    question_ro: 'Ce garanție oferiți pe echipamentele sportive?',
    question_ru: 'Какая гарантия предоставляется на спортивное оборудование?',
    answer_ro: 'Toate echipamentele sportive comercializate de Sporto (SPORTOSFERA S.R.L.) beneficiază de garanție de minimum 12 luni. Produsele provin din Italia și UE — branduri certificate cu reputație internațională. Serviciul post-vânzare și suportul tehnic sunt asigurate de echipa noastră.',
    answer_ru: 'Всё спортивное оборудование Sporto (SPORTOSFERA S.R.L.) имеет гарантию не менее 12 месяцев. Продукция поставляется из Италии и ЕС — сертифицированные бренды с международной репутацией. Постпродажное обслуживание и техническую поддержку обеспечивает наша команда.',
    sort_order: 2,
    active: true,
  },
  {
    question_ro: 'Puteți echipa o sală de sport pentru o școală sau instituție publică?',
    question_ru: 'Можете ли вы оснастить спортзал для школы или государственного учреждения?',
    answer_ro: 'Da, lucrăm activ în segmentul B2G — dotăm școli, licee, grădinițe, instituții publice și primării. Oferim inventar sportiv conform normativelor, prețuri speciale pentru licitații publice și documentație completă. Consultați-ne pentru un proiect la cheie.',
    answer_ru: 'Да, мы активно работаем в сегменте B2G — оснащаем школы, лицеи, детские сады, государственные учреждения и муниципальные объекты. Предлагаем спортивный инвентарь по нормативам, специальные цены для тендеров и полный пакет документов. Обратитесь к нам за проектом «под ключ».',
    sort_order: 3,
    active: true,
  },
];

function newItem(order: number): FaqItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question_ro: '', question_ru: '',
    answer_ro: '', answer_ru: '',
    sort_order: order,
    active: true,
  };
}

function loadFromStorage(): FaqItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function AdminFaq() {
  const { lang } = useAdminLang();
  const [items, setItems] = useState<FaqItem[]>(loadFromStorage);
  const [expanded, setExpanded] = useState<string | null>(null);

  const isRu = lang === 'ru';

  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      toast(isRu ? '✓ FAQ сохранён' : '✓ FAQ salvat');
    } catch {
      toast(isRu ? 'Ошибка сохранения' : 'Eroare la salvare');
    }
  };

  const handleSeed = () => {
    if (items.length > 0) {
      const ok = window.confirm(isRu
        ? 'Уже есть вопросы. Добавить SEO-вопросы поверх?'
        : 'Există deja întrebări. Adăugați întrebările SEO?');
      if (!ok) return;
    }
    const seeded: FaqItem[] = SEO_DEFAULTS.map((q, i) => ({
      ...q,
      id: `item-${Date.now()}-${i}`,
      sort_order: items.length + i,
    }));
    setItems(p => [...p, ...seeded]);
    toast(isRu ? '✓ 4 SEO-вопроса добавлены' : '✓ 4 întrebări SEO adăugate');
  };

  const addItem = () => {
    const it = newItem(items.length);
    setItems(p => [...p, it]);
    setExpanded(it.id);
  };

  const removeItem = (id: string) => {
    setItems(p => p.filter(i => i.id !== id));
    toast(isRu ? 'Удалено' : 'Șters');
  };

  const updateItem = (id: string, key: keyof FaqItem, value: any) => {
    setItems(p => p.map(i => i.id === id ? { ...i, [key]: value } : i));
  };

  return (
    <div className="bg-black text-white min-h-[calc(100vh-48px)]">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-[0.2em] mb-1">{isRu ? 'Контент · О нас' : 'Conținut · Despre noi'}</p>
            <h1 className="text-xl text-white">FAQ</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeed}
              title={isRu ? 'Загрузить 4 стартовых SEO-вопроса' : 'Încarcă 4 întrebări SEO de start'}
              className="flex items-center gap-1.5 border border-white/20 text-gray-400 hover:text-white hover:border-white/50 px-3 h-9 text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              SEO
            </button>
            <button onClick={addItem} className="flex items-center gap-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/50 px-4 h-9 text-xs uppercase tracking-wide transition-colors">
              <Plus className="w-3.5 h-3.5" />
              {isRu ? 'Добавить' : 'Adaugă'}
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-white text-black px-5 py-2 text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">
              <Save className="w-3.5 h-3.5" />
              {isRu ? 'Сохранить' : 'Salvează'}
            </button>
          </div>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-3 border border-white/10 bg-white/5 px-4 py-3 mb-6">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            {isRu
              ? 'Данные сохраняются локально в браузере. FAQ на странице «О нас» управляется через файл About.tsx.'
              : 'Datele se salvează local în browser. FAQ-ul de pe pagina «Despre noi» este gestionat prin fișierul About.tsx.'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="border border-white/10 bg-white/5 px-8 py-16 text-center">
            <p className="text-gray-500 text-sm mb-6">{isRu ? 'Вопросов пока нет' : 'Nicio întrebare încă'}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleSeed}
                className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-xs uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isRu ? 'Загрузить SEO-вопросы (4 шт)' : 'Încarcă întrebări SEO (4 buc)'}
              </button>
              <button onClick={addItem} className="inline-flex items-center gap-2 border border-white/20 text-gray-300 hover:text-white px-5 py-2.5 text-xs uppercase tracking-wide transition-colors">
                <Plus className="w-3.5 h-3.5" />
                {isRu ? 'Добавить вручную' : 'Adaugă manual'}
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-4 max-w-sm mx-auto">
              {isRu
                ? 'SEO-вопросы подобраны под поисковые запросы по спортивному оборудованию в Молдове'
                : 'Întrebările SEO sunt selectate pentru căutări de echipamente sportive în Moldova'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, idx) => {
              const isOpen = expanded === item.id;
              const displayQ = isRu ? item.question_ru || item.question_ro : item.question_ro || item.question_ru;
              return (
                <div key={item.id} className={`border transition-colors ${isOpen ? 'border-white/30 bg-white/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <GripVertical className="w-4 h-4 text-gray-700 flex-shrink-0 cursor-grab" />
                    <span className="text-[10px] text-gray-600 w-5 flex-shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                    <button onClick={() => setExpanded(isOpen ? null : item.id)} className="flex-1 text-left min-w-0">
                      <span className={`text-sm truncate block ${displayQ ? 'text-white' : 'text-gray-600 italic'}`}>
                        {displayQ || (isRu ? '(без текста)' : '(fără text)')}
                      </span>
                    </button>
                    {/* Active toggle */}
                    <button onClick={() => updateItem(item.id, 'active', !item.active)} className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1">
                      {item.active ? <Eye className="w-3.5 h-3.5 text-white/60" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => removeItem(item.id)} className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : item.id)} className="flex-shrink-0 text-gray-600 hover:text-white transition-colors p-1">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Вопрос RO' : 'Întrebare RO'}</label>
                          <input value={item.question_ro} onChange={e => updateItem(item.id, 'question_ro', e.target.value)}
                            className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white focus:border-white focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Вопрос RU' : 'Întrebare RU'}</label>
                          <input value={item.question_ru} onChange={e => updateItem(item.id, 'question_ru', e.target.value)}
                            className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white focus:border-white focus:outline-none transition-colors" />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Ответ RO' : 'Răspuns RO'}</label>
                          <textarea value={item.answer_ro} onChange={e => updateItem(item.id, 'answer_ro', e.target.value)} rows={3}
                            className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white focus:border-white focus:outline-none transition-colors resize-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Ответ RU' : 'Răspuns RU'}</label>
                          <textarea value={item.answer_ru} onChange={e => updateItem(item.id, 'answer_ru', e.target.value)} rows={3}
                            className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white focus:border-white focus:outline-none transition-colors resize-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={addItem} className="w-full border border-dashed border-white/15 py-3 text-xs text-gray-600 hover:text-gray-400 hover:border-white/30 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              {isRu ? 'Добавить вопрос' : 'Adaugă întrebare'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}