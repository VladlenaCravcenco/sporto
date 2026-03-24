import { useState, useEffect } from 'react';
import { Save, Eye } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { toast } from 'sonner';
import {
  type PageContent as PageData,
  type PageContentType as PageType,
  loadPageContent,
  savePageContent,
  invalidatePageContent,
} from '../hooks/usePageContent';

const DEFAULTS: Record<PageType, PageData> = {
  terms: {
    title_ro: 'Condiții de Colaborare',
    title_ru: 'Условия сотрудничества',
    content_ro: `# Condiții Generale de Colaborare

**SPORTOSFERA S.R.L. · Sporto**

## 1. Termeni generali

Prezentele Condiții de Colaborare reglementează relația comercială dintre SPORTOSFERA S.R.L. (denumită în continuare „Furnizor") și client (denumit „Partener").

## 2. Comenzi și confirmări

• Comenzile se pot face prin: website, email, telefon
• Confirmarea comenzii se realizează în maximum 24h
• Termenele de livrare sunt indicate în oferta comercială
• Modificările comenzii sunt posibile până la expediție

## 3. Prețuri și plăți

• Prețurile sunt exprimate în MDL și EUR
• TVA se calculează conform legislației în vigoare
• Plata: transfer bancar, cash la livrare (pentru comenzi până la...)
• Factura fiscală se emite la livrare/preluare

## 4. Livrare și recepție

• Livrarea se realizează conform termenelor convenite
• Clientul verifică marfa la recepție
• Eventualele defecte vizibile se consemnează în procesul-verbal
• Refuzul nejustificat al recepției nu anulează obligațiile de plată

## 5. Garanție și returnare

• Garanție conform termenelor producătorului (min. 12 luni)
• Returnarea produselor neconform — în termen de 14 zile
• Produsele returnate trebuie să fie în ambalaj original

## 6. Confidențialitate

Ambele părți se obligă să păstreze confidențialitatea informațiilor comerciale primite.

## Contact

Pentru detalii: contact@sporto.md · +373 61 262 777`,
    content_ru: `# Условия сотрудничества

**SPORTOSFERA S.R.L. · Sporto**

## 1. Общие положения

Настоящие Условия сотрудничества регулируют коммерческие отношения между SPORTOSFERA S.R.L. (далее «Поставщик») и клиентом (далее «Партнёр»).

## 2. Заказы и подтверждения

• Заказы принимаются через: сайт, email, телефон
• Подтверждение заказа производится в течение 24ч
• Сроки доставки указываются в коммерческом предложении
• Изменение заказа возможно до момента отгрузки

## 3. Цены и оплата

• Цены указываются в MDL и EUR
• НДС рассчитывается согласно действующему законодательству
• Оплата: банковский перевод, наличными при доставке (для заказов до...)
• Налоговая накладная выдаётся при доставке/передаче

## 4. Доставка и приёмка

• Доставка производится согласно договорённым срокам
• Клиент проверяет товар при получении
• Выявленные видимые дефекты фиксируются в акте приёма
• Необоснованный отказ от приёмки не отменяет обязательств по оплате

## 5. Гарантия и возврат

• Гарантия согласно условиям производителя (мин. 12 месяцев)
• Возврат несоответствующих товаров — в течение 14 дней
• Возвращаемые товары должны быть в оригинальной упаковке

## 6. Конфиденциальность

Обе стороны обязуются сохранять конфиденциальность полученной коммерческой информации.

## Контакты

Подробности: contact@sporto.md · +373 61 262 777`,
  },
  delivery: {
    title_ro: 'Condiții de Livrare',
    title_ru: 'Условия доставки',
    content_ro: `# Condiții de Livrare

**SPORTOSFERA S.R.L. · Sporto**

## 1. Zone de livrare

• Chișinău — 1–2 zile lucrătoare
• Alte orașe (Bălți, Cahul, Ungheni etc.) — 3–5 zile lucrătoare
• Sate și localități rurale — conform convenirii

## 2. Metode de livrare

### Curierat (pentru comenzi mici și medii)
• Pachete până la 30 kg
• Livrare la adresa indicată
• Programare în ziua precedentă

### Transport propriu (pentru comenzi mari)
• Echipamente fitness și aparate voluminoase
• Livrare + despachetare + instalare (opțional)
• Programare cu minim 48h înainte

## 3. Costuri de livrare

• **Chișinău**: GRATIS pentru comenzi >3000 MDL
• **Chișinău**: 100 MDL pentru comenzi <3000 MDL
• **Regiuni**: de la 150 MDL (în funcție de destinație și volum)
• **Instalare**: conform ofertei (pentru aparate de fitness)

## 4. La recepție

• Verificați ambalajul exterior înainte de semnare
• Deschideți coletul în prezența curierului
• Semn��ți documentele doar după verificare
• Fotografiați eventualele daune și contactați-ne imediat

## 5. Programare și contact

• Curierul vă contactează cu o zi înainte
• Dacă nu sunteți disponibil, livrarea se reprogramează
• Pentru urgențe: +373 61 262 777`,
    content_ru: `# Условия доставки

**SPORTOSFERA S.R.L. · Sporto**

## 1. Зоны доставки

• Кишинёв — 1–2 рабочих дня
• Другие города (Бельцы, Кагул, Унгены и др.) — 3–5 рабочих дней
• Сёла и сельские населённые пункты — по согласованию

## 2. Способы доставки

### Курьерская служба (для малых и средних заказов)
• Посылки до 30 кг
• Доставка по указанному адресу
• Планирование за день до доставки

### Собственный транспорт (для крупных заказов)
• Фитнес-оборудование и габаритные товары
• Доставка + распаковка + установка (опционально)
• Планирование минимум за 48ч

## 3. Стоимость доставки

• **Кишинёв**: БЕСПЛАТНО при заказе >3000 MDL
• **Кишинёв**: 100 MDL при заказе <3000 MDL
• **Регионы**: от 150 MDL (в зависимости от направления и объёма)
• **Установка**: по коммерческому предложению (для тренажёров)

## 4. При получении

• Проверьте внешнюю упаковку перед подписанием
• Вскройте посылку в присутствии курьера
• Подписывайте документы только после проверки
• Сфотографируйте возможные повреждения и свяжитесь с нами немедленно

## 5. Планирование и контакт

• Курьер связывается за день до доставки
• Если вы недоступны, доставка переносится
• Срочные вопросы: +373 61 262 777`,
  },
  privacy: {
    title_ro: 'Politica de Confidențialitate',
    title_ru: 'Политика конфиденциальности',
    content_ro: `# Politica de Confidențialitate

**SPORTOSFERA S.R.L. · Sporto**

Actualizat: martie 2026

## 1. Introducere

SPORTOSFERA S.R.L. („Sporto", „noi") respectă confidențialitatea datelor dvs. personale. Prezenta Politică explică ce date colectăm, cum le folosim și care sunt drepturile dvs.

## 2. Ce date colectăm

### Date de contact
• Nume, prenume
• Email
• Telefon
• Adresă de livrare

### Date tranzacționale
• Istoricul comenzilor
• Preferințe produse
• Feedback și recenzii

### Date tehnice
• Adresă IP
• Browser și dispozitiv
• Cookies (doar esențiale — nu folosim tracking)

## 3. Cum folosim datele

• Procesarea comenzilor și livrărilor
• Comunicare privind statusul comenzii
• Suport tehnic și service
• Îmbunătățirea serviciilor (analiză agregată, anonimă)

**Nu vindem și nu partajăm datele cu terți în scop de marketing.**

## 4. Stocarea datelor

• Datele sunt stocate pe servere securizate (Supabase / EU)
• Acces restricționat doar pentru personal autorizat
• Copii de siguranță regulate

## 5. Drepturile dvs.

Aveți dreptul de a:
• Accesa datele personale
• Corecta informații incorecte
• Șterge datele (cu excepția celor necesare legal)
• Retrage consimțământul pentru marketing

## 6. Cookies

Folosim doar cookies esențiale pentru funcționarea site-ului (coș, sesiune). Nu utilizăm cookies de tracking sau publicitate terță parte.

## 7. Contact

Pentru întrebări: contact@sporto.md · +373 61 262 777`,
    content_ru: `# Политика конфиденциальности

**SPORTOSFERA S.R.L. · Sporto**

Обновлено: март 2026

## 1. Введение

SPORTOSFERA S.R.L. («Sporto», «мы») уважает конфиденциальность ваших персональных данных. Настоящая Политика объясняет, какие данные мы собираем, как их используем и каковы ваши права.

## 2. Какие данные мы собираем

### Кон��актные данные
• Имя, фамилия
• Email
• Телефон
• Адрес доставки

### Данные о транзакциях
• История заказов
• Предпочтения по товарам
• Отзывы и рецензии

### Технические данные
• IP-адрес
• Браузер и устройство
• Cookies (только необходимые — не используем отслеживание)

## 3. Как мы используем данные

• Обработка заказов и доставки
• Коммуникация по статусу заказа
• Техническая поддержка и сервис
• Улучшение услуг (агрегированный анонимный анализ)

**Мы не продаём и не передаём данные третьим лицам в маркетинговых целях.**

## 4. Хранение данных

• Данные хранятся на защищённых серверах (Supabase / EU)
• Доступ ограничен только авторизованным сотрудникам
• Регулярное резервное копирование

## 5. Ваши права

Вы имеете право:
• Получить доступ к персональным данным
• ��справить неверную информацию
• Удалить данные (за исключением юридически необходимых)
• Отозвать согласие на маркетинговые рассылки

## 6. Cookies

Мы используем только необходимые cookies для работы сайта (корзина, сессия). Не используем отслеживающие cookies или стороннюю рекламу.

## 7. Контакты

По вопросам: contact@sporto.md · +373 61 262 777`,
  },
};

export function AdminContentPages() {
  const { lang } = useAdminLang();
  const isRu = lang === 'ru';

  const [activeTab, setActiveTab] = useState<PageType>('terms');
  const [data, setData] = useState<Record<PageType, PageData>>({
    terms: { ...DEFAULTS.terms },
    delivery: { ...DEFAULTS.delivery },
    privacy: { ...DEFAULTS.privacy },
  });
  const [published, setPublished] = useState<Record<PageType, PageData>>({
    terms: { ...DEFAULTS.terms },
    delivery: { ...DEFAULTS.delivery },
    privacy: { ...DEFAULTS.privacy },
  });
  const [previewLang, setPreviewLang] = useState<'ro' | 'ru'>('ro');

  useEffect(() => {
    Promise.all([
      loadPageContent('terms'),
      loadPageContent('delivery'),
      loadPageContent('privacy'),
    ]).then(([terms, delivery, privacy]) => {
      const next = {
        terms: terms ?? { ...DEFAULTS.terms },
        delivery: delivery ?? { ...DEFAULTS.delivery },
        privacy: privacy ?? { ...DEFAULTS.privacy },
      };
      setData(next);
      setPublished(next);
    });
  }, []);

  const current = data[activeTab];
  const hasChanges = JSON.stringify(data[activeTab]) !== JSON.stringify(published[activeTab]);

  const update = (field: keyof PageData, value: string) => {
    setData(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [field]: value },
    }));
  };

  const handleSave = async () => {
    await savePageContent(activeTab, current);
    invalidatePageContent(activeTab, current);
    setPublished(prev => ({ ...prev, [activeTab]: { ...current } }));
    toast(isRu ? '✓ Сохранено' : '✓ Salvat');
  };

  const handleReset = () => {
    if (window.confirm(isRu ? 'Сбросить к значениям по умолчанию?' : 'Resetați la valorile implicite?')) {
      setData(prev => ({ ...prev, [activeTab]: { ...DEFAULTS[activeTab] } }));
    }
  };

  const tabs: { key: PageType; label_ro: string; label_ru: string }[] = [
    { key: 'terms', label_ro: 'Colaborare', label_ru: 'Сотрудничество' },
    { key: 'delivery', label_ro: 'Livrare', label_ru: 'Доставка' },
    { key: 'privacy', label_ro: 'Confidențialitate', label_ru: 'Конфиденциальность' },
  ];

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden bg-black">
      
      {/* ══ LEFT — EDITOR ══ */}
      <div className="w-[520px] shrink-0 flex flex-col border-r border-white/10 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-black border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">Контентные страницы</p>
              <h1 className="text-base text-white">
                {isRu
                  ? (activeTab === 'terms' ? 'Условия сотрудничества' : activeTab === 'delivery' ? 'Условия доставки' : 'Конфиденциальность')
                  : (activeTab === 'terms' ? 'Condiții de Colaborare' : activeTab === 'delivery' ? 'Condiții de Livrare' : 'Politica de Confidențialitate')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="h-8 px-3 text-[10px] text-gray-600 border border-white/10 hover:border-white/30 hover:text-gray-300 transition-colors uppercase tracking-wider">
                {isRu ? 'Сброс' : 'Reset'}
              </button>
              <button onClick={handleSave} disabled={!hasChanges}
                className={`flex items-center gap-1.5 px-4 h-8 text-xs uppercase tracking-widest transition-colors ${hasChanges ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/10 text-gray-600 cursor-default'}`}>
                <Save className="w-3 h-3" />
                {isRu ? 'Сохранить' : 'Salvează'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white/10 text-white border-b-2 border-white'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {isRu ? tab.label_ru : tab.label_ro}
              </button>
            ))}
          </div>

          {hasChanges && (
            <div className="mt-2 text-[9px] text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
              {isRu ? 'Есть несохранённые изменения' : 'Modificări nesalvate'}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">
              {isRu ? 'Заголовок (RO)' : 'Titlu (RO)'}
            </label>
            <input
              value={current.title_ro}
              onChange={e => update('title_ro', e.target.value)}
              className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">
              {isRu ? 'Заголовок (RU)' : 'Titlu (RU)'}
            </label>
            <input
              value={current.title_ru}
              onChange={e => update('title_ru', e.target.value)}
              className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">
              {isRu ? 'Контент (RO) — Markdown' : 'Conținut (RO) — Markdown'}
            </label>
            <textarea
              value={current.content_ro}
              onChange={e => update('content_ro', e.target.value)}
              rows={20}
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white font-mono leading-relaxed focus:border-white focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">
              {isRu ? 'Контент (RU) — Markdown' : 'Conținut (RU) — Markdown'}
            </label>
            <textarea
              value={current.content_ru}
              onChange={e => update('content_ru', e.target.value)}
              rows={20}
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white font-mono leading-relaxed focus:border-white focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* ══ RIGHT — PREVIEW ══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 border-b border-white/10 flex items-center justify-between px-5 bg-black">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">Превью</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPreviewLang('ro')} className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${previewLang === 'ro' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}>RO</button>
            <button onClick={() => setPreviewLang('ru')} className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${previewLang === 'ru' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}>RU</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-8">
          <div className="max-w-3xl mx-auto prose prose-sm">
            <h1 className="text-2xl font-bold mb-4">{previewLang === 'ro' ? current.title_ro : current.title_ru}</h1>
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {previewLang === 'ro' ? current.content_ro : current.content_ru}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
