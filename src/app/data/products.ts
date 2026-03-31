import { extraProducts } from './extra-products';

export interface Product {
  id: string;
  name: { ro: string; ru: string };
  description: { ro: string; ru: string };
  category: string;
  subcategory: string;
  price: number;
  sale_price?: number | null; // Акционная цена — если задана, старая цена перечёркивается
  image: string;           // first/main image (for catalog cards)
  images?: string[];       // full gallery (shown in product detail)
  featured: boolean;
  specifications: {
    ro: Record<string, string>;
    ru: Record<string, string>;
  };
  // B2B wholesale fields (optional — card computes fallbacks if absent)
  sku?: string;       // Catalog article code (e.g. 17-47-121) — from Supabase
  cod?: string;       // Internal warehouse code (e.g. 9459) — from Supabase
  inStock?: boolean;  // true = qty > 0, false = qty <= 0
  qty?: number;       // Stock quantity from Supabase
  minOrder?: number;  // undefined → auto-derived from price tier
  pricePerSet?: number; // undefined → price × minOrder
  brand?: string;     // Brand name (e.g. "HMS", "Technogym") — from Supabase
  youtubeId?: string;   // extracted from youtube_url in DB
}

export interface Category {
  id: string;
  name: { ro: string; ru: string };
  description: { ro: string; ru: string };
  subcategories: { id: string; name: { ro: string; ru: string } }[];
  icon?: string;
}

export const categories: Category[] = [
  {
    id: 'aparate-cardio',
    name: { ro: 'Aparate Cardio', ru: 'Кардио Тренажеры' },
    description: {
      ro: 'Benzi de alergat, eliptice, biciclete fitness și alte aparate cardio',
      ru: 'Беговые дорожки, эллипсоиды, велотренажеры и другое кардио оборудование',
    },
    subcategories: [
      { id: 'banda-alergat', name: { ro: 'Bandă de Alergat', ru: 'Беговая дорожка' } },
      { id: 'aparat-eliptic', name: { ro: 'Aparat Eliptic', ru: 'Эллиптический тренажер' } },
      { id: 'aparat-vaslit', name: { ro: 'Aparat de Vâslit', ru: 'Гребной тренажер' } },
      { id: 'bicicleta-orizontala', name: { ro: 'Bicicletă Orizontală', ru: 'Горизонтальный велотренажер' } },
      { id: 'bicicleta-fitness', name: { ro: 'Bicicletă Fitness', ru: 'Велотренажер' } },
      { id: 'bicicleta-airbike', name: { ro: 'Bicicletă AirBike', ru: 'Велотренажер AirBike' } },
      { id: 'bicicleta-speedbike', name: { ro: 'Bicicletă SpeedBike', ru: 'Велотренажер SpeedBike' } },
      { id: 'stepper', name: { ro: 'Stepper', ru: 'Степпер' } },
      { id: 'accesorii-cardio', name: { ro: 'Accesorii pentru utilizator', ru: 'Аксессуары для пользователя' } },
      { id: 'protectie-cardio', name: { ro: 'Protecție pentru Aparate Cardio', ru: 'Защитные ковры' } },
    ],
  },
  {
    id: 'aparate-forta',
    name: { ro: 'Aparate de Forță', ru: 'Силовое Оборудование' },
    description: {
      ro: 'Aparate de forță profesionale, bănci, rack-uri și aparate multifuncționale',
      ru: 'Профессиональные силовые тренажеры, скамейки, рамы и многофункциональные тренажеры',
    },
    subcategories: [
      { id: 'greutati-incorporate', name: { ro: 'Aparate cu greutăți incorporate', ru: 'Тренажеры со встроенными утяжелителями' } },
      { id: 'greutati-libere', name: { ro: 'Aparate cu greutăți libere', ru: 'Тренажеры со свободными весами' } },
      { id: 'banci-antrenament', name: { ro: 'Bănci pentru antrenament', ru: 'Тренировочные скамейки' } },
      { id: 'multifunctionale', name: { ro: 'Aparate Multifuncționale', ru: 'Многофункциональные тренажеры' } },
      { id: 'accesorii-forta', name: { ro: 'Accesorii pentru utilizator', ru: 'Аксессуары для пользователя' } },
      { id: 'protectie-forta', name: { ro: 'Protecție pentru Aparate de Forță', ru: 'Защитные ковры' } },
    ],
  },
  {
    id: 'greutati',
    name: { ro: 'Greutăți', ru: 'Тяжести' },
    description: {
      ro: 'Gantere, discuri, bare și suporturi pentru antrenament cu greutăți',
      ru: 'Гантели, диски, штанги и стойки для силовых тренировок',
    },
    subcategories: [
      { id: 'gri', name: { ro: 'Gri', ru: 'Гири' } },
      { id: 'gantere', name: { ro: 'Gantere', ru: 'Гантели' } },
      { id: 'discuri', name: { ro: 'Discuri', ru: 'Диски' } },
      { id: 'bare', name: { ro: 'Bare', ru: 'Штанги' } },
      { id: 'suporturi-greutati', name: { ro: 'Suporturi pentru greutăți', ru: 'Стойки для тяжестей' } },
      { id: 'accesorii-greutati', name: { ro: 'Accesorii pentru utilizator', ru: 'Аксессуары для пользователя' } },
    ],
  },
  {
    id: 'fitness-yoga',
    name: { ro: 'Fitness / Yoga / Pilates', ru: 'Фитнес / Йога / Пилатес' },
    description: {
      ro: 'Saltele, role, fitball, expandere, TRX și accesorii pentru fitness, yoga și pilates',
      ru: 'Коврики, ролики, фитболы, эспандеры, TRX и аксессуары для фитнеса, йоги и пилатеса',
    },
    subcategories: [
      { id: 'saltele', name: { ro: 'Saltele Fitness / Yoga / Pilates', ru: 'Коврики для фитнеса / йоги / пилатеса' } },
      { id: 'role', name: { ro: 'Role Fitness / Yoga / Pilates', ru: 'Ролики для фитнеса / йоги / пилатеса' } },
      { id: 'fitball', name: { ro: 'Fitball / Minge pentru Gimnastică', ru: 'Фитбол / имнастический мяч' } },
      { id: 'expandere', name: { ro: 'Expandere', ru: 'Эспандеры' } },
      { id: 'coarda-sarituri', name: { ro: 'Coardă pentru sărituri', ru: 'Скакалки' } },
      { id: 'disc-balans', name: { ro: 'Disc Balans', ru: 'Балансировочный диск' } },
      { id: 'trx', name: { ro: 'Benzi TRX', ru: 'TRX-ремни' } },
      { id: 'crossfit', name: { ro: 'CrossFit echipament', ru: 'Оборудование для кроссфита' } },
      { id: 'greutati-fitness', name: { ro: 'Greutăți Fitness', ru: 'Фитнес утяжелители' } },
      { id: 'minge-medicinala', name: { ro: 'Minge medicinală', ru: 'Медицинский мяч' } },
      { id: 'sticle-antrenament', name: { ro: 'Sticle pentru antrenament', ru: 'Тренировочные бутылки' } },
    ],
  },
  {
    id: 'sporturi-colective',
    name: { ro: 'Sporturi Colective', ru: 'Командные виды спорта' },
    description: {
      ro: 'Echipamente pentru fotbal, volei, baschet, handbal și polo',
      ru: 'Оборудование для футбола, волейбола, баскетбола, гандбола и водного поло',
    },
    subcategories: [
      { id: 'fotbal', name: { ro: 'Fotbal', ru: 'Футбол' } },
      { id: 'volei', name: { ro: 'Volei', ru: 'Волейбол' } },
      { id: 'baschet', name: { ro: 'Baschet', ru: 'Баскетбол' } },
      { id: 'polo-apa', name: { ro: 'Polo pe Apă', ru: 'Водное поло' } },
      { id: 'handball', name: { ro: 'HandBall', ru: 'Гандбол' } },
      { id: 'trofee-colective', name: { ro: 'Trofee', ru: 'Трофеи' } },
      { id: 'accesorii-colective', name: { ro: 'Accesorii', ru: 'Аксессуары' } },
      { id: 'inventar-colective', name: { ro: 'Inventar pentru antrenamente', ru: 'Инвентарь для тренировок' } },
    ],
  },
  {
    id: 'sporturi-individuale',
    name: { ro: 'Sporturi Individuale', ru: 'Индивидуальные виды спорта' },
    description: {
      ro: 'Echipamente pentru badminton, tenis, baseball, darts și alte sporturi individuale',
      ru: 'Оборудование для бадминтона, тенниса, бейсбола, дартса и других индивидуальных видов спорта',
    },
    subcategories: [
      { id: 'badminton', name: { ro: 'Badminton', ru: 'Бадминтон' } },
      { id: 'tenis-camp', name: { ro: 'Tenis de Câmp', ru: 'Большой теннис' } },
      { id: 'baseball', name: { ro: 'BaseBall', ru: 'Бейсбол' } },
      { id: 'darts', name: { ro: 'Darts', ru: 'Дартс' } },
      { id: 'trofee-individuale', name: { ro: 'Trofee', ru: 'Трофеи' } },
      { id: 'inventar-individuale', name: { ro: 'Inventar pentru antrenamente', ru: 'Инвентарь для тренировок' } },
      { id: 'accesorii-individuale', name: { ro: 'Accesorii', ru: 'Аксессуары' } },
    ],
  },
  {
    id: 'arte-martiale',
    name: { ro: 'Arte Marțiale', ru: 'Боевые искусства' },
    description: {
      ro: 'Echipamente pentru box, karate, judo, taekwondo și lupte',
      ru: 'Снаряжение для бокса, каратэ, дзюдо, тхэквондо и борьбы',
    },
    subcategories: [
      { id: 'box', name: { ro: 'Echipament pentru Box', ru: 'Снаряжение для бокса' } },
      { id: 'karate', name: { ro: 'Echipament pentru Karate', ru: 'Снаряжение для каратэ' } },
      { id: 'judo', name: { ro: 'Echipament pentru Judo', ru: 'Снаряжение для дзюдо' } },
      { id: 'taekwondo', name: { ro: 'Echipament pentru Taekwondo', ru: 'Снаряжение для тхэквондо' } },
      { id: 'lupte', name: { ro: 'Echipament pentru Lupte libere', ru: 'Борцовское снаряжение' } },
      { id: 'inventar-martiale', name: { ro: 'Inventar pentru antrenamente', ru: 'Инвентарь для тренировок' } },
    ],
  },
  {
    id: 'inot',
    name: { ro: 'Înot', ru: 'Плавание' },
    description: {
      ro: 'Ochelari, căciuli, măști, labe și echipamente pentru piscină',
      ru: 'Очки, шапочки, маски, ласты и оборудование для бассейна',
    },
    subcategories: [
      { id: 'ochelari-inot', name: { ro: 'Ochelari pentru Înot', ru: 'Очки для плавания' } },
      { id: 'caciula-inot', name: { ro: 'Căciulă pentru Înot', ru: 'Плавательная шапочка' } },
      { id: 'tuburi-inot', name: { ro: 'Tuburi pentru Înot', ru: 'Трубки для плавания' } },
      { id: 'masca-inot', name: { ro: 'Mască pentru Înot', ru: 'Маска для плавания' } },
      { id: 'labe-inot', name: { ro: 'Labe pentru Înot', ru: 'Ласты для плавания' } },
      { id: 'echipament-antrenament-inot', name: { ro: 'Echipament pentru antrenament', ru: 'Инвентарь для тренировок' } },
      { id: 'scufundari', name: { ro: 'Echipament pentru scufundări', ru: 'Водолазное снаряжение' } },
      { id: 'piscina', name: { ro: 'Echipament pentru piscină', ru: 'Оборудование для бассейна' } },
    ],
  },
  {
    id: 'tenis-masa',
    name: { ro: 'Tenis de Masă', ru: 'Настольный теннис' },
    description: {
      ro: 'Mese, palete, plase și mingi pentru tenis de masă',
      ru: 'Столы, ракетки, сетки и мячи для настольного тенниса',
    },
    subcategories: [
      { id: 'mese-tenis', name: { ro: 'Mese de Tenis de Masă', ru: 'Столы для настольного тенниса' } },
      { id: 'palete-tenis', name: { ro: 'Palete Tenis de Masă', ru: 'Ракетки для настольного тенниса' } },
      { id: 'plase-tenis', name: { ro: 'Plase Tenis de Masă', ru: 'Сетки для настольного тенниса' } },
      { id: 'minge-tenis', name: { ro: 'Minge Tenis de Masă', ru: 'Мяч для настольного тенниса' } },
    ],
  },
  {
    id: 'jocuri',
    name: { ro: 'Jocuri de Logică și alte Jocuri', ru: 'Логические и другие игры' },
    description: {
      ro: 'Jocuri de societate, șah, dame, narde, mese de joc și alte jocuri',
      ru: 'Настольные игры, шахматы, шашки, нарды, игровые столы и другие игры',
    },
    subcategories: [
      { id: 'jocuri-societate', name: { ro: 'Jocuri de Societate', ru: 'Настольные игры' } },
      { id: 'jocuri-logica', name: { ro: 'Jocuri de Logică', ru: 'Логические игры' } },
      { id: 'sah-dame', name: { ro: 'Șah / Dame / Narde', ru: 'Шахматы / Шашки / Нарды' } },
      { id: 'mese-joc', name: { ro: 'Mese de Joc', ru: 'Игровые столы' } },
      { id: 'alte-jocuri', name: { ro: 'Alte Jocuri', ru: 'Другие игры' } },
    ],
  },
  {
    id: 'forta-exterior',
    name: { ro: 'Aparate de Forță pentru Exterior', ru: 'Уличные тренажеры' },
    description: {
      ro: 'Aparate de forță rezistente la intemperii pentru parcuri și spații publice',
      ru: 'Всепогодные силовые тренажеры для парков и общественных пространств',
    },
    subcategories: [
      { id: 'aparate-exterior', name: { ro: 'Aparate de Forță pentru Exterior', ru: 'Уличные тренажеры' } },
    ],
  },
  {
    id: 'inventar-institutii',
    name: { ro: 'Inventar pentru Instituții și Proiecte', ru: 'Инвентарь для учреждений и проектов' },
    description: {
      ro: 'Inventar sportiv pentru instituții publice, școli, grădinițe și proiecte',
      ru: 'Спортивный инвентарь для государственных учреждений, школ, детских садов и проектов',
    },
    subcategories: [
      { id: 'inventar-public', name: { ro: 'Inventar pentru Instituții Publice', ru: 'Инвентарь для государственных учреждений' } },
    ],
  },
];

const _baseProducts: Product[] = [
  // Aparate Cardio
  {
    id: '1',
    name: {
      ro: 'Treadmill Profesional TRX-3000',
      ru: 'Профессиональная Беговая Дорожка TRX-3000',
    },
    description: {
      ro: 'Bandă de alergare profesională cu motor puternic și consolă avansată, perfectă pentru sălile de fitness comerciale.',
      ru: 'Профессиональная беговая дорожка с мощным мотором и продвинутой консолью, идеальна для коммерческих фитнес-залов.',
    },
    category: 'aparate-cardio',
    subcategory: 'banda-alergat',
    price: 45000,
    image: 'fitness-treadmill',
    featured: true,
    specifications: {
      ro: {
        Motor: '5.0 HP AC',
        'Suprafață alergare': '160 x 56 cm',
        'Viteză maximă': '25 km/h',
        Înclinare: '0-15%',
        'Greutate utilizator': 'până la 200 kg',
      },
      ru: {
        Мотор: '5.0 HP AC',
        'Беговая поверхность': '160 x 56 см',
        'Максимальная скорость': '25 км/ч',
        Наклон: '0-15%',
        'Вес пользователя': 'до 200 кг',
      },
    },
  },
  {
    id: '2',
    name: {
      ro: 'Bicicletă Eliptică EX-7000',
      ru: 'Эллиптический Тренажер EX-7000',
    },
    description: {
      ro: 'Eliptică comercială cu tracțiune frontală și rezistență electromagnetică, oferind o experiență de antrenament fluidă.',
      ru: 'Коммерческий эллиптический тренажер с передним приводом и электромагнитным сопротивлением.',
    },
    category: 'aparate-cardio',
    subcategory: 'aparat-eliptic',
    price: 38000,
    image: 'fitness-elliptical',
    featured: true,
    specifications: {
      ro: {
        Sistem: 'Tracțiune frontală',
        Rezistență: 'Electromagnetică, 32 niveluri',
        Pas: '51 cm',
        'Greutate volantă': '22 kg',
        'Greutate utilizator': 'până la 180 kg',
      },
      ru: {
        Система: 'Передний привод',
        Сопротивление: 'Электромагнитное, 32 уровня',
        Шаг: '51 см',
        'Вес маховик': '22 кг',
        'Вес пользователя': 'до 180 кг',
      },
    },
  },
  {
    id: '3',
    name: {
      ro: 'Bicicletă Ergometrică EB-5000',
      ru: 'Велоэргометр EB-5000',
    },
    description: {
      ro: 'Bicicletă ergometrică verticală cu poziție de antrenament confortabilă și monitorizare avansată.',
      ru: 'Вертикальный велоэргометр с удобным положением для тренировки и продвинутым мониторингом.',
    },
    category: 'aparate-cardio',
    subcategory: 'bicicleta-fitness',
    price: 28000,
    image: 'fitness-bike',
    featured: false,
    specifications: {
      ro: {
        Tip: 'Verticală',
        Rezistență: 'Electromagnetică',
        Niveluri: '24',
        'Greutate volantă': '15 kg',
        'Greutate utilizator': 'până la 150 kg',
      },
      ru: {
        Тип: 'Вертикальный',
        Сопротивление: 'Электромагнитное',
        Уровни: '24',
        'Вес маховика': '15 кг',
        'Вес пользователя': 'до 150 кг',
      },
    },
  },
  {
    id: '16',
    name: {
      ro: 'Aparat de Vâslit RW-4000',
      ru: 'Гребной Тренажер RW-4000',
    },
    description: {
      ro: 'Aparat de vâslit cu rezistență hidraulică, construcție robustă pentru utilizare intensivă în sălile comerciale.',
      ru: 'Гребной тренажер с гидравлическим сопротивлением, прочная конструкция для интенсивного использования.',
    },
    category: 'aparate-cardio',
    subcategory: 'aparat-vaslit',
    price: 32000,
    image: 'fitness-rack',
    featured: false,
    specifications: {
      ro: {
        Rezistență: 'Hidraulică',
        'Capacitate greutate': '120 kg',
        Dimensiuni: '240 x 55 x 90 cm',
        Display: 'LCD multifuncțional',
        Greutate: '38 kg',
      },
      ru: {
        Сопротивление: 'Гидравлическое',
        'Грузоподъёмность': '120 кг',
        Размеры: '240 x 55 x 90 см',
        Дисплей: 'Многофункциональный LCD',
        Вес: '38 кг',
      },
    },
  },

  // Aparate de Forță
  {
    id: '4',
    name: {
      ro: 'Rack Forță Multipurpose MR-800',
      ru: 'Многофункциональная Силовая Рама MR-800',
    },
    description: {
      ro: 'Rack profesional de forță cu săgeți reglabile, bare tractoare și platformă pentru genuflexiuni.',
      ru: 'Профессиональная силовая рама с регулируемыми держателями, перекладинами и платформой для приседаний.',
    },
    category: 'aparate-forta',
    subcategory: 'greutati-libere',
    price: 52000,
    image: 'fitness-rack',
    featured: true,
    specifications: {
      ro: {
        Material: 'Oțel comercial',
        Dimensiuni: '240 x 180 x 220 cm',
        'Greutate maximă': '500 kg',
        Opțiuni: 'Săgeți, bare tractoare, platformă',
        Finisaj: 'Vopsire electrostatică',
      },
      ru: {
        Материал: 'Коммерческая сталь',
        Размеры: '240 x 180 x 220 см',
        'Максимальный вес': '500 кг',
        Опции: 'Держатели, перекладины, платформа',
        Покрытие: 'Электростатическое окрашивание',
      },
    },
  },
  {
    id: '6',
    name: {
      ro: 'Aparat Smith Machine SM-1000',
      ru: 'Машина Смита SM-1000',
    },
    description: {
      ro: 'Mașină Smith cu ghidaj ultra-fluid și sistem de contrabalansare profesional.',
      ru: 'Машина Смита с ультра-плавным направляющим и профессиональной системой противовеса.',
    },
    category: 'aparate-forta',
    subcategory: 'greutati-libere',
    price: 42000,
    image: 'fitness-smith',
    featured: false,
    specifications: {
      ro: {
        Ghidaj: 'Liniar cu role',
        Contrabalansare: '20 kg',
        Bară: 'Olimpică 20 kg',
        Dimensiuni: '220 x 160 x 230 cm',
        'Greutate maximă': '300 kg',
      },
      ru: {
        Направляющая: 'Линейная с роликами',
        Противовес: '20 кг',
        Гриф: 'Олимпийский 20 кг',
        Размеры: '220 x 160 x 230 см',
        'Максимальный вес': '300 кг',
      },
    },
  },
  {
    id: '17',
    name: {
      ro: 'Bancă Reglabilă Profesională BN-600',
      ru: 'Профессиональная Регулируемая Скамья BN-600',
    },
    description: {
      ro: 'Bancă pentru antrenament cu unghiuri multiple reglabile, tapițerie rezistentă și construcție solidă.',
      ru: 'Тренировочная скамья с множеством регулируемых углов, прочной обивкой и надежной конструкцией.',
    },
    category: 'aparate-forta',
    subcategory: 'banci-antrenament',
    price: 8500,
    image: 'fitness-mats',
    featured: false,
    specifications: {
      ro: {
        Unghiuri: '7 poziții reglabile',
        Tapițerie: 'PVC 50mm',
        'Capacitate greutate': '300 kg',
        Dimensiuni: '130 x 65 x 50 cm',
        Material: 'Oțel + PVC',
      },
      ru: {
        Углы: '7 регулируемых позиций',
        Обивка: 'ПВХ 50мм',
        'Грузоподъёмность': '300 кг',
        Размеры: '130 x 65 x 50 см',
        Материал: 'Сталь + ПВХ',
      },
    },
  },

  // Greutăți
  {
    id: '5',
    name: {
      ro: 'Set Gantere Profesionale 2-50 kg',
      ru: 'Набор Профессиональных Гантелей 2-50 кг',
    },
    description: {
      ro: 'Set complet de gantere hexagonale din cauciuc, de la 2 kg la 50 kg, cu rack inclus.',
      ru: 'Полный набор шестигранных резиновых гантелей от 2 кг до 50 кг, с подставкой в комплекте.',
    },
    category: 'greutati',
    subcategory: 'gantere',
    price: 35000,
    image: 'fitness-dumbbells',
    featured: true,
    specifications: {
      ro: {
        Gamă: '2-50 kg (pași de 2 kg)',
        Material: 'Oțel + cauciuc',
        Formă: 'Hexagonală',
        Rack: 'Inclus, 3 nivele',
        Piese: '25 perechi',
      },
      ru: {
        Диапазон: '2-50 кг (шаг 2 кг)',
        Материал: 'Сталь + резина',
        Форма: 'Шестигранная',
        Стойка: 'Включена, 3 уровня',
        Штук: '25 пар',
      },
    },
  },
  {
    id: '18',
    name: {
      ro: 'Set Discuri Olimpice 2.5-25 kg',
      ru: 'Набор Олимпийских Дисков 2.5-25 кг',
    },
    description: {
      ro: 'Set de discuri olimpice din cauciuc cu miez metalic, compatibil cu toate barele olimpice standard.',
      ru: 'Набор олимпийских резиновых дисков с металлической сердцевиной, совместимых со всеми стандартными олимпийскими грифами.',
    },
    category: 'greutati',
    subcategory: 'discuri',
    price: 22000,
    image: 'fitness-dumbbells',
    featured: false,
    specifications: {
      ro: {
        Compatibilitate: 'Bară olimpică Ø50mm',
        Gamă: '2.5, 5, 10, 15, 20, 25 kg',
        Material: 'Cauciuc + miez oțel',
        Finisaj: 'Anti-alunecare',
        Culori: 'Codificate internațional',
      },
      ru: {
        Совместимость: 'Олимпийский гриф Ø50мм',
        Диапазон: '2.5, 5, 10, 15, 20, 25 кг',
        Материал: 'Резина + стальная сердцевина',
        Покрытие: 'Антискольжение',
        Цвета: 'Международная кодировка',
      },
    },
  },

  // Fitness / Yoga / Pilates
  {
    id: '7',
    name: {
      ro: 'Rig Funcțional CrossFit CF-2000',
      ru: 'Функциональная Рама CrossFit CF-2000',
    },
    description: {
      ro: 'Rig modular pentru antrenament funcțional, configurat pentru o sală completă.',
      ru: 'Модульная рама для функционального тренинга, сконфигурированная для полного зала.',
    },
    category: 'fitness-yoga',
    subcategory: 'crossfit',
    price: 85000,
    image: 'fitness-rig',
    featured: true,
    specifications: {
      ro: {
        Dimensiuni: '800 x 400 x 280 cm',
        Module: '10 stații',
        Accesorii: 'Bare tractoare, inele, TRX',
        Material: 'Oțel comercial HD',
        Capacitate: '15-20 utilizatori simultan',
      },
      ru: {
        Размеры: '800 x 400 x 280 см',
        Модули: '10 станций',
        Аксессуары: 'Перекладины, кольца, TRX',
        Материал: 'Коммерческая сталь HD',
        Вместимость: '15-20 пользователей одновременно',
      },
    },
  },
  {
    id: '8',
    name: {
      ro: 'Saltele Fitness Premium 1.5 cm',
      ru: 'Премиум Фитнес Маты 1.5 см',
    },
    description: {
      ro: 'Saltele modulare profesionale pentru zone funcționale și de CrossFit.',
      ru: 'Профессиональные модульные маты для функциональных зон и CrossFit.',
    },
    category: 'fitness-yoga',
    subcategory: 'saltele',
    price: 8500,
    image: 'fitness-mats',
    featured: false,
    specifications: {
      ro: {
        Dimensiune: '100 x 100 x 1.5 cm',
        Material: 'Cauciuc reciclat EPDM',
        Densitate: '950 kg/m³',
        Pachet: '10 buc (10 m²)',
        Culori: 'Negru, gri',
      },
      ru: {
        Размер: '100 x 100 x 1.5 см',
        Материал: 'Переработанная резина EPDM',
        Плотность: '950 кг/м³',
        Упаковка: '10 шт (10 м²)',
        Цвета: 'Черный, серый',
      },
    },
  },
  {
    id: '14',
    name: {
      ro: 'Set Mingi Medicinale 1-10 kg',
      ru: 'Набор Медицинских Мячей 1-10 кг',
    },
    description: {
      ro: 'Set profesional de mingi medicinale din cauciuc, de la 1 kg la 10 kg.',
      ru: 'Профессиональный набор резиновых медицинских мячей от 1 кг до 10 кг.',
    },
    category: 'fitness-yoga',
    subcategory: 'minge-medicinala',
    price: 4500,
    image: 'accessories-balls',
    featured: false,
    specifications: {
      ro: {
        Gamă: '1-10 kg (10 buc)',
        Material: 'Cauciuc',
        Diametru: '19-30 cm',
        Rack: 'Opțional',
        Culori: 'Codificate pe greutate',
      },
      ru: {
        Диапазон: '1-10 кг (10 шт)',
        Материал: 'Резина',
        Диаметр: '19-30 см',
        Стойка: 'Опционально',
        Цвета: 'Кодированы по весу',
      },
    },
  },
  {
    id: '15',
    name: {
      ro: 'Benzi Elastice Rezistență Set 5 Buc',
      ru: 'Набор Эластичных Лент 5 Шт',
    },
    description: {
      ro: 'Set de benzi elastice profesionale cu diferite niveluri de rezistență.',
      ru: 'Набор профессиональных эластичных лент с различными уровнями сопротивления.',
    },
    category: 'fitness-yoga',
    subcategory: 'expandere',
    price: 1200,
    image: 'accessories-bands',
    featured: false,
    specifications: {
      ro: {
        Piese: '5 benzi',
        Rezistență: '5-50 kg',
        Material: 'Latex natural',
        Lungime: '208 cm',
        Lățime: '1.3-6.4 cm',
      },
      ru: {
        Штук: '5 лент',
        Сопротивление: '5-50 кг',
        Материал: 'Натуральный латекс',
        Длина: '208 см',
        Ширина: '1.3-6.4 см',
      },
    },
  },

  // Sporturi Colective
  {
    id: '9',
    name: {
      ro: 'Poartă Fotbal Profesională 7.32 x 2.44 m',
      ru: 'Профессиональные Футбольные Ворота 7.32 x 2.44 м',
    },
    description: {
      ro: 'Poartă de fotbal cu dimensiuni standard FIFA, construcție robustă din aluminiu.',
      ru: 'Футбольные ворота стандартного размера FIFA, прочная алюминиевая конструкция.',
    },
    category: 'sporturi-colective',
    subcategory: 'fotbal',
    price: 18000,
    image: 'sport-goal',
    featured: false,
    specifications: {
      ro: {
        Dimensiuni: '7.32 x 2.44 x 2 m',
        Material: 'Aluminiu',
        Profil: '120 x 100 mm',
        Tip: 'Fix sau mobil',
        Plasă: 'Inclusă, polipropilen',
      },
      ru: {
        Размеры: '7.32 x 2.44 x 2 м',
        Материал: 'Алюминий',
        Профиль: '120 x 100 мм',
        Тип: 'Стационарные или мобильные',
        Сетка: 'Включена, полипропилен',
      },
    },
  },
  {
    id: '10',
    name: {
      ro: 'Panou Baschet Profesional cu Coș',
      ru: 'Профессиональный Баскетбольный Щит с Кольцом',
    },
    description: {
      ro: 'Panou din sticlă securizată 12 mm cu sistem de amortizare și coș reglabil.',
      ru: 'Щит из закаленного стекла 12 мм с амортизирующей системой и регулируемым кольцом.',
    },
    category: 'sporturi-colective',
    subcategory: 'baschet',
    price: 25000,
    image: 'sport-basketball',
    featured: false,
    specifications: {
      ro: {
        Panou: 'Sticlă securizată 12 mm',
        Dimensiuni: '180 x 105 cm',
        Coș: 'Reglabil, amortizat',
        Înălțime: '260-305 cm',
        Montare: 'Perete sau stâlp',
      },
      ru: {
        Щит: 'Закаленное стекло 12 мм',
        Размеры: '180 x 105 см',
        Кольцо: 'Регулируемое, амортизирующее',
        Высота: '260-305 см',
        Монтаж: 'Стена или столб',
      },
    },
  },
  {
    id: '19',
    name: {
      ro: 'Stâlpi Volei Profesionali cu Plasă',
      ru: 'Профессиональные Волейбольные Стойки с Сеткой',
    },
    description: {
      ro: 'Stâlpi de volei din aluminiu cu sistem de tensionare rapidă și plasă competiție inclusă.',
      ru: 'Алюминиевые волейбольные стойки с системой быстрого натяжения и соревновательной сеткой в комплекте.',
    },
    category: 'sporturi-colective',
    subcategory: 'volei',
    price: 12000,
    image: 'sport-goal',
    featured: false,
    specifications: {
      ro: {
        Material: 'Aluminiu anodizat',
        Diametru: '80 mm',
        Reglaj: 'Continuu 215-255 cm',
        Plasă: 'Competiție inclusă',
        Montare: 'Manșoane sau mobile',
      },
      ru: {
        Материал: 'Анодированный алюминий',
        Диаметр: '80 мм',
        Регулировка: 'Непрерывная 215-255 см',
        Сетка: 'Соревновательная в комплекте',
        Монтаж: 'Стаканы или мобильные',
      },
    },
  },

  // Arte Marțiale
  {
    id: '20',
    name: {
      ro: 'Sac de Box Profesional 100 kg',
      ru: 'Профессиональный Боксерский Мешок 100 кг',
    },
    description: {
      ro: 'Sac de box din piele artificială rezistentă, umplutură specială anti-impact, pentru sălile comerciale.',
      ru: 'Боксерский мешок из прочной искусственной кожи, специальный противоударный наполнитель для коммерческих залов.',
    },
    category: 'arte-martiale',
    subcategory: 'box',
    price: 6500,
    image: 'fitness-rig',
    featured: false,
    specifications: {
      ro: {
        Greutate: '100 kg',
        Material: 'Piele artificială',
        Umplutură: 'Textil + nisip',
        Înălțime: '180 cm',
        Diametru: '35 cm',
      },
      ru: {
        Вес: '100 кг',
        Материал: 'Искусственная кожа',
        Наполнитель: 'Текстиль + песок',
        Высота: '180 см',
        Диаметр: '35 см',
      },
    },
  },
  {
    id: '21',
    name: {
      ro: 'Saltea Judo / Tatami 4 cm',
      ru: 'Татами / Мат для Дзюдо 4 см',
    },
    description: {
      ro: 'Saltea tatami profesională din spumă EVA de înaltă densitate, certificată pentru competiții și antrenamente.',
      ru: 'Профессиональное татами из высокоплотной EVA пены, сертифицированное для соревнований и тренировок.',
    },
    category: 'arte-martiale',
    subcategory: 'judo',
    price: 3200,
    image: 'fitness-mats',
    featured: false,
    specifications: {
      ro: {
        Dimensiune: '100 x 100 x 4 cm',
        Material: 'Spumă EVA HD',
        Densitate: '120 kg/m³',
        Suprafață: 'Antiderapantă',
        Certificare: 'IJF omologat',
      },
      ru: {
        Размер: '100 x 100 x 4 см',
        Материал: 'Пена EVA HD',
        Плотность: '120 кг/м³',
        Поверхность: 'Нескользящая',
        Сертификация: 'Одобрено IJF',
      },
    },
  },

  // Înot
  {
    id: '22',
    name: {
      ro: 'Set Antrenament Înot Profesional',
      ru: 'Профессиональный Набор для Плавания',
    },
    description: {
      ro: 'Set complet pentru antrenament în piscină: ochelari, căciulă, palmare și kickboard.',
      ru: 'Полный набор для тренировок в бассейне: очки, шапочка, лопатки и доска для плавания.',
    },
    category: 'inot',
    subcategory: 'echipament-antrenament-inot',
    price: 2800,
    image: 'accessories-bands',
    featured: false,
    specifications: {
      ro: {
        Conținut: 'Ochelari + căciulă + palmare + kickboard',
        Material: 'Silicon + policarbonat',
        Vârstă: 'Adulți',
        Nivel: 'Competiție / Club',
        Ambalaj: 'Geantă depozitare',
      },
      ru: {
        Содержимое: 'Очки + шапочка + лопатки + доска',
        Материал: 'Силикон + поликарбонат',
        Возраст: 'Взрослые',
        Уровень: 'Соревновательный / Клубный',
        Упаковка: 'Сумка для хранения',
      },
    },
  },

  // Tenis de Masă
  {
    id: '23',
    name: {
      ro: 'Masă Tenis de Masă Profesională ITTF',
      ru: 'Профессиональный Теннисный Стол ITTF',
    },
    description: {
      ro: 'Masă de tenis de masă omologată ITTF cu suprafață de joc de 25mm și sistem de pliere simplu.',
      ru: 'Теннисный стол, одобренный ITTF, с игровой поверхностью 25 мм и простой системой складывания.',
    },
    category: 'tenis-masa',
    subcategory: 'mese-tenis',
    price: 15000,
    image: 'sport-basketball',
    featured: true,
    specifications: {
      ro: {
        Suprafață: '25 mm MDF',
        Dimensiuni: '274 x 152.5 x 76 cm',
        Certificare: 'ITTF omologat',
        Pliere: 'Sistem simplu, rotile',
        Plasă: 'Metal ajustabil inclus',
      },
      ru: {
        Поверхность: '25 мм MDF',
        Размеры: '274 x 152.5 x 76 см',
        Сертификация: 'Одобрено ITTF',
        Складывание: 'Простая система, колёса',
        Сетка: 'Регулируемый металл в комплекте',
      },
    },
  },

  // Jocuri
  {
    id: '24',
    name: {
      ro: 'Set Șah / Dame / Narde Profesional',
      ru: 'Профессиональный Набор Шахматы / Шашки / Нарды',
    },
    description: {
      ro: 'Set profesional cu piesele de joc din lemn masiv și tablă incluse, ideal pentru instituții și cluburi.',
      ru: 'Профессиональный набор с деревянными фигурами и доской в комплекте, идеален для учреждений и клубов.',
    },
    category: 'jocuri',
    subcategory: 'sah-dame',
    price: 1800,
    image: 'accessories-balls',
    featured: false,
    specifications: {
      ro: {
        Conținut: 'Șah + dame + narde',
        Material: 'Lemn masiv',
        Dimensiune: '50 x 50 cm',
        Piese: 'Complete, turnate',
        Ambalaj: 'Cutie lemn cu capac',
      },
      ru: {
        Содержимое: 'Шахматы + шашки + нарды',
        Материал: 'Массив дерева',
        Размер: '50 x 50 см',
        Фигуры: 'Полный комплект, литые',
        Упаковка: 'Деревянная коробка с крышкой',
      },
    },
  },

  // Forță Exterior
  {
    id: '13',
    name: {
      ro: 'Stație Fitness Outdoor 8 Aparate',
      ru: 'Уличная Фитнес Станция 8 Тренажеров',
    },
    description: {
      ro: 'Stație completă de fitness outdoor, rezistentă la intemperii, pentru parcuri și zone publice.',
      ru: 'Полная уличная фитнес станция, устойчивая к погодным условиям, для парков и общественных зон.',
    },
    category: 'forta-exterior',
    subcategory: 'aparate-exterior',
    price: 48000,
    image: 'outdoor-gym',
    featured: true,
    specifications: {
      ro: {
        Aparate: '8 tipuri diferite',
        Material: 'Oțel galvanizat + vopsit',
        Fundație: 'Betonare necesară',
        Utilizatori: 'Adulți și seniori',
        Garanție: '5 ani',
      },
      ru: {
        Тренажеры: '8 разных типов',
        Материал: 'Оцинкованная сталь + покраска',
        Фундамент: 'Требуется бетонирование',
        Пользователи: 'Взрослые и пожилые',
        Гарантия: '5 лет',
      },
    },
  },

  // Inventar Instituții
  {
    id: '11',
    name: {
      ro: 'Set Module Soft Kids 12 Piese',
      ru: 'Набор Мягких Модулей Kids 12 Шт',
    },
    description: {
      ro: 'Set de module soft colorate pentru dezvoltarea motorie a copiilor, materiale certificate EN.',
      ru: 'Набор мягких модулей для моторного развития детей, сертифицированные материалы EN.',
    },
    category: 'inventar-institutii',
    subcategory: 'inventar-public',
    price: 15000,
    image: 'kids-soft',
    featured: true,
    specifications: {
      ro: {
        Piese: '12 forme diferite',
        Material: 'Spumă + husă PVC',
        Vârstă: '1-6 ani',
        Certificare: 'EN 1176, EN 71',
        Culori: 'Multicolor',
      },
      ru: {
        Штук: '12 разных форм',
        Материал: 'Пена + чехол ПВХ',
        Возраст: '1-6 лет',
        Сертификация: 'EN 1176, EN 71',
        Цвета: 'Многоцветный',
      },
    },
  },
  {
    id: '12',
    name: {
      ro: 'Trambulină Copii cu Protecție',
      ru: 'Детский Батут с Защитой',
    },
    description: {
      ro: 'Trambulină pentru copii cu plasă de protecție și structură sigură, certificată pentru instituții.',
      ru: 'Детский батут с защитной сеткой и безопасной конструкцией, сертифицированный для учреждений.',
    },
    category: 'inventar-institutii',
    subcategory: 'inventar-public',
    price: 12000,
    image: 'kids-trampoline',
    featured: false,
    specifications: {
      ro: {
        Diametru: '240 cm',
        Protecție: 'Plasă + burete',
        Arcuri: '48 buc, galvanizate',
        'Greutate max': '100 kg',
        Vârstă: '3+ ani',
      },
      ru: {
        Диаметр: '240 см',
        Защита: 'Сетка + мягкие накладки',
        Пружины: '48 шт, оцинкованные',
        'Макс вес': '100 кг',
        Возраст: '3+ лет',
      },
    },
  },

  // ── Sporturi Individuale
  {
    id: '25',
    name: {
      ro: 'Set Badminton Profesional',
      ru: 'Профессиональный Набор для Бадминтона',
    },
    description: {
      ro: 'Set complet de badminton cu 4 rachete, fileu, stâlpi și 12 fluturași pentru utilizare comercială.',
      ru: 'Полный набор для бадминтона с 4 ракетками, сеткой, стойками и 12 воланами для коммерческого использования.',
    },
    category: 'sporturi-individuale',
    subcategory: 'badminton',
    price: 5500,
    image: 'sport-basketball',
    featured: false,
    specifications: {
      ro: {
        Conținut: '4 rachete + fileu + stâlpi + 12 fluturași',
        Material: 'Aluminiu + nailon',
        Fileu: 'Standard BWF 760cm',
        Stâlpi: 'Aluminiu reglabili',
        Ambalaj: 'Husă transport',
      },
      ru: {
        Содержимое: '4 ракетки + сетка + стойки + 12 воланов',
        Материал: 'Алюминий + нейлон',
        Сетка: 'Ста��дарт BWF 760 см',
        Стойки: 'Регулируемые алюминиевые',
        Упаковка: 'Транспортировочный чехол',
      },
    },
  },
];

export const products: Product[] = [..._baseProducts, ...extraProducts];
