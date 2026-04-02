import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ro' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ro: {
    // Header & Navigation
    'nav.home': 'Acasă',
    'nav.catalog': 'Catalog',
    'nav.about': 'Despre Noi',
    'nav.turnkey': 'Soluții la Cheie',
    'nav.maintenance': 'Service & Mentenanță',
    'nav.login': 'Autentificare',
    'nav.register': 'Înregistrare',
    'nav.logout': 'Deconectare',
    'nav.account': 'Contul Meu',
    
    // Hero Section
    'hero.title': 'Furnizor Wholesale de Echipamente Sportive & Fitness',
    'hero.subtitle': 'Soluții profesionale pentru cluburi fitness, magazine sportive, școli și instituții',
    'hero.cta': 'Solicită Ofertă',
    'hero.catalog': 'Vezi Catalogul',
    
    // Categories
    'categories.title': 'Categorii de Produse',
    'categories.subtitle': 'Gamă completă de echipamente pentru diverse nevoi',
    'categories.fitness': 'Fitness',
    'categories.fitness.desc': 'Echipamente profesionale pentru sălile de fitness',
    'categories.sport': 'Sport',
    'categories.sport.desc': 'Echipamente pentru diverse discipline sportive',
    'categories.kids': 'Kids Club',
    'categories.kids.desc': 'Echipamente sigure pentru copii și grădinițe',
    'categories.outdoor': 'Outdoor',
    'categories.outdoor.desc': 'Echipamente pentru activități în aer liber',
    'categories.accessories': 'Accesorii',
    'categories.accessories.desc': 'Accesorii și consumabile sportive',
    
    // Products
    'products.featured': 'Produse Recomandate',
    'products.all': 'Toate Produsele',
    'products.filter': 'Filtrează',
    'products.category': 'Categorie',
    'products.subcategory': 'Subcategorie',
    'products.search': 'Caută produse...',
    'products.noResults': 'Nu am găsit produse',
    'products.price': 'Preț',
    'products.loginToSee': 'Autentifică-te pentru a vedea prețurile wholesale',
    'products.addToRequest': 'Adaugă la Cerere',
    'products.details': 'Detalii Produs',
    'products.specifications': 'Specificații',
    'products.description': 'Descriere',
    'products.requestQuote': 'Solicită Ofertă',
    
    // Services
    'services.title': 'Servicii Profesionale',
    'services.turnkey.title': 'Soluții Cheie în Mână pentru Cluburi Fitness',
    'services.turnkey.desc': 'Proiectare, echipare și amenajare completă',
    'services.maintenance.title': 'Service & Mentenanță Echipamente',
    'services.maintenance.desc': 'Mentenanță preventivă și reparații profesionale',
    'services.learnMore': 'Află Mai Mult',
    
    // About
    'about.title': 'De Ce Să Ne Alegi',
    'about.experience': 'Fondată în 2023',
    'about.experience.desc': 'Activăm în mai multe segmente de piață: B2C, B2B și B2G.',
    'about.quality': 'Calitate Garantată',
    'about.quality.desc': 'Varietatea articolelor provine atât din statele Uniunii Europene, cât și din state din afara acesteia.',
    'about.support': 'Servicii Specifice',
    'about.support.desc': 'Pe lângă produsele comercializate, SPORTOSFERA S.R.L. prestează și servicii specifice domeniului său de activitate.',
    'about.prices': 'Prețuri Competitive',
    'about.prices.desc': 'Clienților noștri le oferim o abordare individuală, prețuri competitive și soluții avantajoase, adaptate necesităților fiecăruia.',
    
    // CTA
    'cta.title': 'Gata să Începem?',
    'cta.subtitle': 'Contactează-ne pentru o ofertă personalizată',
    'cta.button': 'Solicită Ofertă',
    
    // Footer
    'footer.about': 'Despre Noi',
    'footer.about.text': 'Activăm în mai multe segmente de piață: B2C, B2B și B2G.',
    'footer.contact': 'Contact',
    'footer.links': 'Link-uri Utile',
    'footer.legal': 'Informații Juridice',
    'footer.terms': 'Condiții de Colaborare',
    'footer.delivery': 'Condiții de Livrare',
    'footer.privacy': 'Politica de Confidențialitate',
    'footer.rights': 'Toate drepturile rezervate',
    
    // Auth
    'auth.login.title': 'Autentificare',
    'auth.login.subtitle': 'Accesează contul tău de partener',
    'auth.email': 'Email',
    'auth.password': 'Parolă',
    'auth.name': 'Nume Complet',
    'auth.company': 'Companie',
    'auth.login.button': 'Autentifică-te',
    'auth.register.button': 'Înregistrează-te',
    'auth.register.title': 'Înregistrare Partener',
    'auth.register.subtitle': 'Creează un cont pentru acces la prețuri wholesale',
    'auth.noAccount': 'Nu ai cont?',
    'auth.hasAccount': 'Ai deja cont?',
    'auth.error': 'Email sau parolă incorectă',
    'auth.exists': 'Email-ul este deja înregistrat',
    
    // Order Request
    'order.title': 'Cerere de Comandă',
    'order.subtitle': 'Completează formularul și te vom contacta în cel mai scurt timp',
    'order.cart': 'Coșul Tău',
    'order.empty': 'Coșul este gol',
    'order.quantity': 'Cantitate',
    'order.remove': 'Elimină',
    'order.info': 'Informații Comandă',
    'order.notes': 'Observații',
    'order.submit': 'Trimite Cererea',
    'order.success': 'Cererea ta a fost trimisă cu succes!',
    
    // Common
    'common.loading': 'Se încarcă...',
    'common.error': 'A apărut o eroare',
    'common.back': 'Înapoi',
    'common.close': 'Închide',
    'common.save': 'Salvează',
    'common.cancel': 'Anulează',
  },
  ru: {
    // Header & Navigation
    'nav.home': 'Главная',
    'nav.catalog': 'Каталог',
    'nav.about': 'О нас',
    'nav.turnkey': 'Решения под Ключ',
    'nav.maintenance': 'Сервис и Обслуживание',
    'nav.login': 'Вход',
    'nav.register': 'Регистрация',
    'nav.logout': 'Выход',
    'nav.account': 'Мой Аккаунт',
    
    // Hero Section
    'hero.title': 'Оптовый Поставщик Спортивного и Фитнес Оборудования',
    'hero.subtitle': 'Профессиональные решения для фитнес-клубов, спортивных магазинов, школ и учреждений',
    'hero.cta': 'Запросить Предложение',
    'hero.catalog': 'Смотреть Каталог',
    
    // Categories
    'categories.title': 'Категории Продукции',
    'categories.subtitle': 'Полный ассортимент оборудования для различных нужд',
    'categories.fitness': 'Фитнес',
    'categories.fitness.desc': 'Профессиональное оборудование для фитнес-залов',
    'categories.sport': 'Спорт',
    'categories.sport.desc': 'Оборудование для различных спортивных дисциплин',
    'categories.kids': 'Детский Клуб',
    'categories.kids.desc': 'Безопасное оборудование для детей и детских садов',
    'categories.outdoor': 'Уличное',
    'categories.outdoor.desc': 'Оборудование для активного отдыха на открытом воздухе',
    'categories.accessories': 'Аксессуары',
    'categories.accessories.desc': 'Спортивные аксессуары и расходные материалы',
    
    // Products
    'products.featured': 'Рекомендуемые Продукты',
    'products.all': 'Все Продукты',
    'products.filter': 'Фильтр',
    'products.category': 'Категория',
    'products.subcategory': 'Подкатегория',
    'products.search': 'Поиск продуктов...',
    'products.noResults': 'Продукты не найдены',
    'products.price': 'Цена',
    'products.loginToSee': 'Войдите, чтобы увидеть оптовые цены',
    'products.addToRequest': 'Добавить в Запрос',
    'products.details': 'Детали Продукта',
    'products.specifications': 'Характеристики',
    'products.description': 'Описание',
    'products.requestQuote': 'Запросить Предложение',
    
    // Services
    'services.title': 'Профессиональные Услуги',
    'services.turnkey.title': 'Решения под Ключ для Фитнес-Клубов',
    'services.turnkey.desc': 'Проектирование, оснащение и полное обустройство',
    'services.maintenance.title': 'Сервис и Обслуживание Оборудования',
    'services.maintenance.desc': 'Профилактическое обслуживание и профессиональный ремонт',
    'services.learnMore': 'Узнать Больше',
    
    // About
    'about.title': 'Почему Мы',
    'about.experience': 'Основана в 2023 году',
    'about.experience.desc': 'Мы работаем в нескольких рыночных сегментах: B2C, B2B и B2G.',
    'about.quality': 'Гарантированное Качество',
    'about.quality.desc': 'Ассортимент товаров включает продукцию как из стран Европейского союза, так и из других стран.',
    'about.support': 'Специализированные Услуги',
    'about.support.desc': 'Помимо продажи товаров, SPORTOSFERA S.R.L. также предоставляет услуги, связанные с её сферой деятельности.',
    'about.prices': 'Конкурентные Цены',
    'about.prices.desc': 'Нашим клиентам мы предлагаем индивидуальный подход, конкурентные цены и выгодные решения, адаптированные к их потребностям.',
    
    // CTA
    'cta.title': 'Готовы Начать?',
    'cta.subtitle': 'Свяжитесь с нами для индивидуального предложения',
    'cta.button': 'Запросить Предложение',
    
    // Footer
    'footer.about': 'О Нас',
    'footer.about.text': 'Мы работаем в нескольких рыночных сегментах: B2C, B2B и B2G.',
    'footer.contact': 'Контакты',
    'footer.links': 'Полезные Ссылки',
    'footer.legal': 'Правовая Информация',
    'footer.terms': 'Условия сотрудничества',
    'footer.delivery': 'Условия доставки',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.rights': 'Все права защищены',
    
    // Auth
    'auth.login.title': 'Вход',
    'auth.login.subtitle': 'Войдите в ваш партнерский аккаунт',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.name': 'Полное Имя',
    'auth.company': 'Компания',
    'auth.login.button': 'Войти',
    'auth.register.button': 'Зарегистрироваться',
    'auth.register.title': 'Регистрация Партнера',
    'auth.register.subtitle': 'Создайте аккаунт для доступа к оптовым ценам',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.hasAccount': 'Уже есть аккаунт?',
    'auth.error': 'Неверный email или пароль',
    'auth.exists': 'Email уже зарегистрирован',
    
    // Order Request
    'order.title': 'Запрос Заказа',
    'order.subtitle': 'Заполните форму, и мы свяжемся с вами в ближайшее время',
    'order.cart': 'Ваша Корзина',
    'order.empty': 'Корзина пуста',
    'order.quantity': 'Количество',
    'order.remove': 'Удалить',
    'order.info': 'Информация о Заказе',
    'order.notes': 'Примечания',
    'order.submit': 'Отправить Запрос',
    'order.success': 'Ваш запрос успешно отправлен!',
    
    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Произошла ошибка',
    'common.back': 'Назад',
    'common.close': 'Закрыть',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getLanguageFromUrl(): Language | null {
  if (typeof window === 'undefined') return null;
  const lang = new URLSearchParams(window.location.search).get('lang');
  return lang === 'ro' || lang === 'ru' ? lang : null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const urlLang = getLanguageFromUrl();
    if (urlLang) return urlLang;
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('language') as Language | null;
      if (storedLang === 'ro' || storedLang === 'ru') return storedLang;
    }
    return 'ro';
  });

  useEffect(() => {
    const syncLangFromUrl = () => {
      const urlLang = getLanguageFromUrl();
      if (urlLang) {
        setLanguageState(urlLang);
        localStorage.setItem('language', urlLang);
      }
    };

    syncLangFromUrl();
    window.addEventListener('popstate', syncLangFromUrl);
    return () => window.removeEventListener('popstate', syncLangFromUrl);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
