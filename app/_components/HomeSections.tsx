import { ArrowRight, Award, CheckCircle, TrendingUp, Users } from 'lucide-react';

const content = {
  ro: {
    title: 'De ce să ne alegi',
    items: [
      ['Fondată în 2023', 'Activăm în mai multe segmente de piață: B2C, B2B și B2G.'],
      ['Calitate garantată', 'Varietatea articolelor provine atât din statele Uniunii Europene, cât și din state din afara acesteia.'],
      ['Servicii specifice', 'Pe lângă produsele comercializate, SPORTOSFERA S.R.L. prestează și servicii specifice domeniului său de activitate.'],
      ['Prețuri competitive', 'Oferim o abordare individuală, prețuri competitive și soluții avantajoase, adaptate necesităților fiecăruia.'],
    ],
    cta: 'Gata să începem?', subtitle: 'Contactează-ne pentru o ofertă personalizată', button: 'Solicită ofertă',
  },
  ru: {
    title: 'Почему выбирают нас',
    items: [
      ['Основана в 2023 году', 'Мы работаем в нескольких рыночных сегментах: B2C, B2B и B2G.'],
      ['Гарантированное качество', 'Ассортимент включает продукцию как из стран Европейского союза, так и из других стран.'],
      ['Профильные услуги', 'Помимо продажи товаров, SPORTOSFERA S.R.L. предоставляет услуги, связанные со спортивной сферой.'],
      ['Конкурентные цены', 'Индивидуальный подход, конкурентные цены и выгодные решения, адаптированные к вашим потребностям.'],
    ],
    cta: 'Готовы начать?', subtitle: 'Свяжитесь с нами для индивидуального предложения', button: 'Запросить предложение',
  },
};
const icons = [TrendingUp, Award, Users, CheckCircle];

export function HomeBenefits({ language }: { language: 'ro' | 'ru' }) {
  const text = content[language];
  return <section className="border-t border-gray-200 py-12 md:py-16">
    <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-xl font-semibold text-gray-900">{text.title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {text.items.map(([title, description], index) => {
          const Icon = icons[index];
          return <div key={title} className="flex min-w-0 flex-col gap-4 rounded-[5px] border border-gray-100 bg-white p-5 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center bg-black text-white"><Icon className="h-5 w-5" aria-hidden="true" /></div>
              <span className="text-xs tabular-nums text-gray-400">0{index + 1}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm leading-relaxed text-gray-500">{description}</p>
          </div>;
        })}
      </div>
    </div>
  </section>;
}

export function HomeCallToAction({ language }: { language: 'ro' | 'ru' }) {
  const text = content[language];
  return <section className="w-full bg-black py-12 text-white md:py-16">
    <div className="mx-auto flex max-w-[1920px] flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
      <h2 className="text-3xl font-semibold">{text.cta}</h2>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a href={`/${language}/order-request`} className="inline-flex min-h-11 items-center justify-center gap-3 bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-100">{text.button}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
        <a href={`/${language}/catalog`} className="inline-flex min-h-11 items-center justify-center border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-white hover:text-white">{language === 'ro' ? 'Vezi catalogul' : 'Смотреть каталог'}</a>
      </div>
    </div>
  </section>;
}
