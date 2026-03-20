import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, MapPin, Clock, Truck, Package, WarehouseIcon, Globe } from 'lucide-react';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';
import type { ReactNode } from 'react';

type Lang = 'ro' | 'ru';

export function DeliveryTerms() {
  const { language } = useLanguage();
  const lang = language as Lang;

  const C = {
    ro: {
      back: 'Înapoi',
      eyebrow: 'Documente · Logistică',
      title: 'Condiții de Livrare',
      subtitle: 'Livrăm pe întreg teritoriul Republicii Moldova. Fiecare comandă este pregătită cu grijă și expediată la timp.',
      updated: 'Actualizat: martie 2026',
      zones: [
        { city: 'Chișinău', time: '1–2 zile lucrătoare', price: 'Gratuit de la 500 MDL', priceAlt: 'Sub 500 MDL — calculat individual' },
        { city: 'Alte orașe și localități RM', time: '2–5 zile lucrătoare', price: 'Calculat individual', priceAlt: 'Confirmat la plasarea comenzii' },
      ],
      sections: [
        {
          icon: 'Truck',
          title: '1. Livrare standard',
          items: [
            'Livrare cu transport propriu sau parteneri de curierat certificați',
            'Confirmarea comenzii: în 2–4 ore în zile lucrătoare (Lun–Vin, 9:00–18:00)',
            'Notificare SMS/email cu data și intervalul orar de livrare',
            'Livrare la adresa indicată: depozit, magazin, instituție',
            'La recepție se semnează avizul de însoțire a mărfii',
          ],
          note: 'Comenzile plasate după ora 15:00 se procesează în ziua lucrătoare următoare.',
        },
        {
          icon: 'WarehouseIcon',
          title: '2. Echipamente mari și instalare',
          items: [
            'Aparate cardio, simulatoare, echipamente de sală: livrare cu echipă specializată',
            'Includere opțională a serviciului de instalare și montaj la fața locului',
            'Necesită programare prealabilă cu min. 48 ore înainte',
            'Accesul la etaje superioare fără lift: suprataxă calculată individual',
            'Verificare funcțională inclusă la instalare (test run)',
          ],
          note: 'Instalarea echipamentelor în pachete "cheie în mână" este inclusă în prețul proiectului.',
        },
        {
          icon: 'Package',
          title: '3. Ambalare și protecție',
          items: [
            'Ambalare industrială standard pentru toate produsele',
            'Echipamente fragile: protecție suplimentară cu spumă și folie bubble-wrap',
            'Etichetare clară: numărul comenzii, datele destinatarului, instrucțiuni de manipulare',
            'Fotografierea coletelor înainte de expediere (disponibil la cerere)',
          ],
          note: 'La recepție, verificați vizual integritatea ambalajului înainte de a semna. Daunele de transport se raportează în 24 ore.',
        },
        {
          icon: 'Clock',
          title: '4. Termene și stocuri',
          items: [
            'Produse în stoc: expediate în 1–2 zile lucrătoare',
            'Produse la comandă (fără stoc): termen 7–21 zile lucrătoare (confirmat individual)',
            'Comenzi mixte: expediate după disponibilitatea tuturor articolelor (sau în tranșe, la cerere)',
            'Stocul disponibil este afișat în timp real în catalogul online',
          ],
          note: 'Termenele pot varia în perioada sărbătorilor sau în caz de forță majoră. Veți fi notificat în avans.',
        },
        {
          icon: 'MapPin',
          title: '5. Ridicare din depozit (self-pickup)',
          items: [
            'Adresă: Chișinău (adresa exactă se comunică la confirmarea comenzii)',
            'Program depozit: Lun–Vin 9:00–17:30, Sâm 10:00–14:00',
            'Necesită programare prealabilă cu cel puțin 24 ore înainte',
            'La ridicare: act de identitate sau delegație din partea companiei',
            'Ridicarea se efectuează după confirmarea plății',
          ],
          note: null,
        },
        {
          icon: 'Globe',
          title: '6. Livrare internațională',
          items: [
            'Export în România: 3–5 zile lucrătoare, termen și tarif confirmate la cerere',
            'Export în UE: disponibil prin parteneri de freight, termen 5–10 zile lucrătoare',
            'Documentație vamală: factura comercială, packing list și certificate de origine — pregătite de noi',
            'Toate taxele vamale și TVA la import sunt responsabilitatea cumpărătorului',
          ],
          note: 'Contactați-ne pentru un calcul detaliat al costurilor de export.',
        },
      ],
      contact: {
        title: 'Aveți o întrebare despre livrare?',
        body: 'Departamentul logistică este disponibil Lun–Vin, 9:00–17:00.',
        cta: 'Contactează-ne',
      },
      zonesTitle: 'Zone de livrare și tarife',
      zonesCols: ['Localitate', 'Termen', 'Livrare gratuită', 'Sub minim'],
    },
    ru: {
      back: 'Назад',
      eyebrow: 'Документы · Логистика',
      title: 'Условия доставки',
      subtitle: 'Доставляем по всей территории Республики Молдова. Каждый заказ тщательно подготавливается и отправляется в срок.',
      updated: 'Обновлено: март 2026',
      zones: [
        { city: 'Кишинёв', time: '1–2 рабочих дня', price: 'Бесплатно от 500 MDL', priceAlt: 'До 500 MDL — рассчитывается отдельно' },
        { city: 'Другие города и населённые пункты РМ', time: '2–5 рабочих дней', price: 'Рассчитывается отдельно', priceAlt: 'Подтверждается при оформлении заказа' },
      ],
      sections: [
        {
          icon: 'Truck',
          title: '1. Стандартная доставка',
          items: [
            'Доставка собственным транспортом или сертифицированными курьерскими партнёрами',
            'Подтверждение заказа: в течение 2–4 часов в рабочие дни (Пн–Пт, 9:00–18:00)',
            'SMS/email-уведомление с датой и временным интервалом доставки',
            'Доставка по указанному адресу: склад, магазин, учреждение',
            'При получении подписывается товарная накладная',
          ],
          note: 'Заказы, оформленные после 15:00, обрабатываются на следующий рабочий день.',
        },
        {
          icon: 'WarehouseIcon',
          title: '2. Крупногабаритное оборудование и монтаж',
          items: [
            'Кардиооборудование, тренажёры, залы: доставка специализированной командой',
            'Опциональное включение услуги монтажа и установки на объекте',
            'Требует предварительного согласования минимум за 48 часов',
            'Подъём на этажи без лифта: доплата рассчитывается индивидуально',
            'Функциональная проверка включена в монтаж (тестовый запуск)',
          ],
          note: 'Монтаж оборудования в пакетах «под ключ» включён в стоимость проекта.',
        },
        {
          icon: 'Package',
          title: '3. Упаковка и защита',
          items: [
            'Стандартная промышленная упаковка для всех товаров',
            'Хрупкие товары: дополнительная защита из поролона и пузырчатой плёнки',
            'Чёткая маркировка: номер заказа, данные плучателя, инструкции по обращению',
            'Фотографирование посылок перед отправкой (по запросу)',
          ],
          note: 'При получении визуально проверьте целостность упаковки до подписания. Транспортные повреждения сообщаются в течение 24 часов.',
        },
        {
          icon: 'Clock',
          title: '4. Сроки и наличие товара',
          items: [
            'Товары в наличии: отгружаются в течение 1–2 рабочих дней',
            'Товары под заказ (нет на складе): срок 7–21 рабочий день (уточняется индивидуально)',
            'Смешанные заказы: отгружаются после наличия всех позиций (или частями, по запросу)',
            'Наличие на складе отображается в режиме реального времени в онлайн-каталоге',
          ],
          note: 'Сроки могут изменяться в праздничные дни или при форс-мажоре. Вы будете уведомлены заранее.',
        },
        {
          icon: 'MapPin',
          title: '5. Самовывоз со склада',
          items: [
            'Адрес: Кишинёв (точный адрес сообщается при подтверждении заказа)',
            'Режим работы склада: Пн–Пт 9:00–17:30, Сб 10:00–14:00',
            'Требует предварительной записи не менее чем за 24 часа',
            'При получении: удостоверение личности или доверенность от компании',
            'Самовывоз осуществляется после подтверждения оплаты',
          ],
          note: null,
        },
        {
          icon: 'Globe',
          title: '6. Международная доставка',
          items: [
            'Экспорт в Румынию: 3–5 рабочих дней, срок и тариф уточняются по запросу',
            'Экспорт в ЕС: возможен через партнёров по грузоперевозкам, срок 5–10 рабочих дней',
            'Таможенная документация: коммерческий счёт, упаковочный лист, сертификаты происхождения — готовим самостоятельно',
            'Таможенные пошлины и НДС при импорте — ответственность покупателя',
          ],
          note: 'Свяжитесь с нами для детального расчёта стоимости экспорта.',
        },
      ],
      contact: {
        title: 'Вопрос о доставке?',
        body: 'Отдел логистики работает Пн–Пт, 9:00–17:00.',
        cta: 'Связаться с нами',
      },
      zonesTitle: 'Зоны доставки и тарифы',
      zonesCols: ['Населённый пункт', 'Срок', 'Бесплатная доставка', 'Ниже минимума'],
    },
  };

  const content = C[lang];

  const iconMap: Record<string, ReactNode> = {
    Truck: <Truck className="w-4 h-4" />,
    WarehouseIcon: <WarehouseIcon className="w-4 h-4" />,
    Package: <Package className="w-4 h-4" />,
    Clock: <Clock className="w-4 h-4" />,
    MapPin: <MapPin className="w-4 h-4" />,
    Globe: <Globe className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={SEO_PAGES.delivery[lang].title}
        description={SEO_PAGES.delivery[lang].description}
        keywords={SEO_PAGES.delivery[lang].keywords}
        canonical="/delivery-terms"
        lang={lang}
      />
      {/* Hero */}
      <section className="border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors mb-10 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {content.back}
          </Link>

          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl text-black mb-6">{content.title}</h1>
            <p className="text-gray-500 leading-relaxed max-w-xl">{content.subtitle}</p>
            <p className="text-xs text-gray-300 mt-6 tracking-wide">{content.updated}</p>
          </div>
        </div>
      </section>

      {/* Zones table */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-6">{content.zonesTitle}</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {content.zonesCols.map((col, i) => (
                    <th key={i} className="text-left text-xs text-gray-400 uppercase tracking-[0.1em] pb-3 pr-8 first:pl-0 font-normal">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {content.zones.map((zone, i) => (
                  <tr key={i} className="group">
                    <td className="py-4 pr-8">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-sm text-black">{zone.city}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-8">
                      <span className="text-sm text-gray-600">{zone.time}</span>
                    </td>
                    <td className="py-4 pr-8">
                      <span className="text-sm text-gray-600">{zone.price}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-xs text-gray-400">{zone.priceAlt}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sticky sidebar */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-4">Cuprins</p>
              <nav className="space-y-1">
                {content.sections.map((s, i) => (
                  <a
                    key={i}
                    href={`#dsection-${i}`}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors py-1.5 border-l-2 border-transparent hover:border-black pl-3"
                  >
                    <span className="tabular-nums text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                    {s.title.replace(/^\d+\.\s/, '')}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <div className="lg:col-span-9 space-y-0 divide-y divide-gray-100">
            {content.sections.map((section, i) => (
              <div key={i} id={`dsection-${i}`} className="py-10 first:pt-0">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    {iconMap[section.icon]}
                  </div>
                  <h2 className="text-lg text-black">{section.title}</h2>
                </div>

                <ul className="space-y-3 mb-4 ml-12">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0 mt-2" />
                      <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {section.note && (
                  <div className="ml-12 mt-4 pl-4 border-l-2 border-gray-100">
                    <p className="text-xs text-gray-400 leading-relaxed">{section.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-xl">
            <h3 className="text-2xl text-black mb-3">{content.contact.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{content.contact.body}</p>
            <Link
              to="/contacts"
              className="inline-flex items-center gap-2 bg-black text-white text-xs px-6 py-3 hover:bg-gray-900 transition-colors"
            >
              {content.contact.cta}
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}