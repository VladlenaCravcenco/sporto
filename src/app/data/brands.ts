export interface Brand {
  id: string;
  name: string;
  country: { ro: string; ru: string };
  countryFlag: string;
  founded?: number;
  segment: { ro: string; ru: string };
  tagline: { ro: string; ru: string };
  description: { ro: string; ru: string };
  categories: string[]; // product category IDs
  website?: string;
  catalogPdf?: string; // URL to brand's PDF catalog
}

export const brands: Brand[] = [
  {
    id: 'technogym',
    name: 'TECHNOGYM',
    country: { ro: 'Italia', ru: 'Италия' },
    countryFlag: '🇮🇹',
    founded: 1983,
    segment: { ro: 'Comercial Premium', ru: 'Коммерческий премиум' },
    tagline: {
      ro: 'Lider mondial în echipamente fitness de clasă comercială',
      ru: 'Мировой лидер в коммерческом фитнес-оборудовании',
    },
    description: {
      ro: 'Technogym este furnizorul oficial al Jocurilor Olimpice și al celor mai prestigioase cluburi de fitness din lume. Echipamentele sale combină design italian cu tehnologie de top — benzi de alergat, biciclete, eliptice și aparate de forță pentru sălile comerciale de nivel înalt.',
      ru: 'Technogym — официальный поставщик Олимпийских игр и наиболее престижных фитнес-клубов мира. Оборудование сочетает итальянский дизайн с передовыми технологиями: беговые дорожки, велотренажёры, эллипсы и силовые тренажёры для коммерческих залов высшего класса.',
    },
    categories: ['aparate-cardio', 'aparate-forta'],
    website: 'technogym.com',
  },
  {
    id: 'hms',
    name: 'HMS',
    country: { ro: 'Polonia', ru: 'Польша' },
    countryFlag: '🇵🇱',
    founded: 1992,
    segment: { ro: 'Accesorii Fitness', ru: 'Фитнес-аксессуары' },
    tagline: {
      ro: 'Gama completă de accesorii fitness la standarde europene',
      ru: 'Полный ассортимент фитнес-аксессуаров по европейским стандартам',
    },
    description: {
      ro: 'HMS este unul dintre cei mai mari producători europeni de accesorii fitness. Gama include gantere neoprene, role pilates, expandere, saltele yoga, mingi medicinale, bare tractiuni și sute de alte accesorii — toate fabricate la standarde de calitate europene și disponibile în stoc larg.',
      ru: 'HMS — один из крупнейших европейских производителей фитнес-аксессуаров. Ассортимент включает неопреновые гантели, ролики для пилатеса, эспандеры, коврики для йоги, медицинские мячи, турники и сотни других аксессуаров — всё производится по европейским стандартам качества.',
    },
    categories: ['greutati', 'fitness-yoga', 'aparate-forta', 'aparate-cardio'],
    website: 'hms-sport.pl',
  },
  {
    id: 'nils',
    name: 'NILS',
    country: { ro: 'Polonia', ru: 'Польша' },
    countryFlag: '🇵🇱',
    segment: { ro: 'Înot & Sport', ru: 'Плавание и спорт' },
    tagline: {
      ro: 'Echipamente pentru înot, sporturi și activități recreative',
      ru: 'Оборудование для плавания, спорта и активного отдыха',
    },
    description: {
      ro: 'NILS oferă o gamă largă de produse pentru înot (ochelari, căciuli silicon), badminton (fluturași, palete, plase), sporturi colective și accesorii recreative. Produse accesibile ca preț, disponibile în cantități mari pentru instituții, cluburi și revânzători.',
      ru: 'NILS предлагает широкий ассортимент продуктов для плавания (очки, силиконовые шапочки), бадминтона (воланы, ракетки, сетки), командных видов спорта и рекреационных аксессуаров. Доступные цены, наличие больших партий для учреждений, клубов и реселлеров.',
    },
    categories: ['inot', 'sporturi-individuale', 'sporturi-colective'],
    website: 'nilsextreme.com',
  },
  {
    id: 'suhs',
    name: 'SUHS',
    country: { ro: 'Internațional', ru: 'Международный' },
    countryFlag: '🌍',
    segment: { ro: 'Sport & Fitness', ru: 'Спорт и фитнес' },
    tagline: {
      ro: 'Accesorii sportive pentru toate disciplinele',
      ru: 'Спортивные аксессуары для всех дисциплин',
    },
    description: {
      ro: 'SUHS acoperă o gamă largă de accesorii sportive: mănuși box, mingi fotbal, genunchiere volei, căciuli înot, echipament box, sticle shaker, kinesiotape și mult mai mult. Soluție practică pentru echiparea completă a cluburilor sportive multidisciplinare.',
      ru: 'SUHS охватывает широкий спектр спортивных аксессуаров: боксёрские перчатки, футбольные мячи, волейбольные наколенники, шапочки для плавания, боксёрское снаряжение, шейкеры, кинезио-тейп и многое другое. Практическое решение для полного оснащения многодисциплинарных спортивных клубов.',
    },
    categories: ['arte-martiale', 'sporturi-colective', 'inot', 'fitness-yoga'],
    website: 'suhs.com',
  },
  {
    id: 'dittmann',
    name: 'DITTMANN',
    country: { ro: 'Germania', ru: 'Германия' },
    countryFlag: '🇩🇪',
    segment: { ro: 'Accesorii Fitness', ru: 'Фитнес-аксессуары' },
    tagline: {
      ro: 'Calitate germană în accesorii pentru fitness și reabilitare',
      ru: 'Немецкое качество в аксессуарах для фитнеса и реабилитации',
    },
    description: {
      ro: 'Dittmann este un brand german specializat în accesorii pentru fitness funcțional și reabilitare. Gama include expandere, benzi elastice, curele pentru glezne, accesorii pentru antrenament funcțional — produse de calitate germană apreciate de fizioterapeuți și antrenori profesioniști.',
      ru: 'Dittmann — немецкий бренд, специализирующийся на аксессуарах для функционального фитнеса и реабилитации. Ассортимент включает эспандеры, эластичные ленты, ремни для лодыжек, аксессуары для функционального тренинга — продукция немецкого качества, ценимая физиотерапевтами и профессиональными тренерами.',
    },
    categories: ['fitness-yoga'],
    website: 'dittmann-sport.de',
  },
  {
    id: 'ezous',
    name: 'EZOUS',
    country: { ro: 'Internațional', ru: 'Международный' },
    countryFlag: '🌍',
    segment: { ro: 'Fitness Funcțional', ru: 'Функциональный фитнес' },
    tagline: {
      ro: 'Accesorii practice pentru antrenamentul funcțional modern',
      ru: 'Практичные аксессуары для современного функционального тренинга',
    },
    description: {
      ro: 'EZOUS oferă o gamă de accesorii pentru antrenament funcțional, inclusiv curele pentru glezne, benzi pentru stretching și accesorii pentru yoga. Produse ergonomice și durabile, concepute pentru antrenamentul zilnic în sălile de fitness și acasă.',
      ru: 'EZOUS предлагает ассортимент аксессуаров для функционального тренинга, включая ремни для лодыжек, ленты для стретчинга и аксессуары для йоги. Эргономичные и долговечные продукты, разработанные для ежедневных тренировок в залах и дома.',
    },
    categories: ['fitness-yoga'],
  },
  {
    id: 'cima',
    name: 'CIMA',
    country: { ro: 'Italia', ru: 'Италия' },
    countryFlag: '🇮🇹',
    segment: { ro: 'Înot', ru: 'Плавание' },
    tagline: {
      ro: 'Echipamente italiene pentru înot și activități aquatice',
      ru: 'Итальянское снаряжение для плавания и водных видов спорта',
    },
    description: {
      ro: 'CIMA este un brand italian cu tradiție în echipamente pentru înot. Gamele de labe scurte din silicon, ochelari și căciuli sunt folosite de cluburi de natație, piscinele publice și sportivii amatori. Combinație de calitate italiană și preț accesibil.',
      ru: 'CIMA — итальянский бренд с традициями в оборудовании для плавания. Ласты из силикона, очки и шапочки используются плавательными клубами, общественными бассейнами и любителями. Сочетание итальянского качества и доступной цены.',
    },
    categories: ['inot'],
  },
  {
    id: 'one',
    name: 'ONE',
    country: { ro: 'Internațional', ru: 'Международный' },
    countryFlag: '🌍',
    segment: { ro: 'Accesorii Buget', ru: 'Бюджетные аксессуары' },
    tagline: {
      ro: 'Accesorii practice la prețuri accesibile',
      ru: 'Практичные аксессуары по доступным ценам',
    },
    description: {
      ro: 'Linia ONE oferă accesorii sportive de bază la prețuri competitive: gantere vinil, expandere loop, bare pentru ușă și alte accesorii esențiale. Ideal pentru echiparea bugetară a instituțiilor, școlilor și clienților individuali.',
      ru: 'Линейка ONE предлагает базовые спортивные аксессуары по конкурентным ценам: виниловые гантели, петлевые эспандеры, турники для двери и другие базовые аксессуары. Идеально для бюджетного оснащения учреждений, школ и индивидуальных клиентов.',
    },
    categories: ['greutati', 'fitness-yoga', 'aparate-forta'],
  },
];

export function getBrandById(id: string): Brand | undefined {
  return brands.find(b => b.id === id);
}

/** Case-insensitive match by name or id — used to link product.brand → brand page */
export function getBrandByName(name: string): Brand | undefined {
  const n = name.toLowerCase().trim();
  return brands.find(b => b.name.toLowerCase() === n || b.id === n);
}