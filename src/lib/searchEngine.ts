/**
 * ─── Sporto Universal Search Engine ──────────────────────────────────────────
 * Поддерживает: точный, нечёткий (Левенштейн), синонимы, концепты/смысл,
 * парсинг цены из строки, историю, популярные запросы.
 */

import type { Product } from '../app/data/products';
import type { Language } from '../app/contexts/LanguageContext';

// ─── Нормализация ──────────────────────────────────────────────────────────────
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i')
    .trim();
}

// ─── Расстояние Левенштейна (оптимизировано TypedArray) ────────────────────────
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  const dp = new Uint16Array((m + 1) * (n + 1));
  for (let i = 0; i <= m; i++) dp[i * (n + 1)] = i;
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i * (n + 1) + j] = a[i - 1] === b[j - 1]
        ? dp[(i - 1) * (n + 1) + (j - 1)]
        : 1 + Math.min(
            dp[(i - 1) * (n + 1) + j],
            dp[i * (n + 1) + (j - 1)],
            dp[(i - 1) * (n + 1) + (j - 1)]
          );
    }
  }
  return dp[m * (n + 1) + n];
}

// Допустимое количество ошибок по длине токена
function maxDist(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

// Нечёткий матч токена по полю — возвращает -1 (не совпало) или 1-15 (качество)
export function fuzzyFieldScore(token: string, field: string): number {
  if (!token || !field) return -1;
  if (field.startsWith(token)) return 15;
  if (field.includes(token)) return 10;
  const allowed = maxDist(token.length);
  if (allowed === 0) return -1;
  const words = field.split(/[\s\-_/]+/).filter(w => w.length >= 2);
  let best = -1;
  for (const word of words) {
    if (Math.abs(word.length - token.length) > allowed + 1) continue;
    const dist = levenshtein(token, word);
    if (dist <= allowed) best = Math.max(best, allowed - dist + 1);
  }
  return best;
}

// ─── Таблица синонимов ─────────────────────────────────────────────────────────
const SYNONYM_MAP: Record<string, string[]> = {
  // ── Кардио ──
  'беговая':       ['banda', 'treadmill', 'alergare', 'cardio', 'alergator'],
  'дорожка':       ['banda', 'treadmill', 'alergare'],
  'беговая дорожка':['banda alergare', 'treadmill'],
  'велосипед':     ['bicicleta', 'bike', 'cycling', 'spinning', 'велик'],
  'велик':         ['bicicleta', 'bike', 'велосипед'],
  'велотренажер':  ['bicicleta', 'spinning', 'ciclism', 'bike', 'pedalat'],
  'велотренажёр':  ['bicicleta', 'spinning', 'ciclism', 'bike'],
  'эллипс':        ['eliptic', 'elliptical', 'orbitrek', 'orbital'],
  'эллиптический': ['eliptic', 'elliptical', 'orbitrek'],
  'орбитрек':      ['eliptic', 'elliptical', 'orbitrek'],
  'орбитрэк':      ['eliptic', 'elliptical', 'orbitrek'],
  'степпер':       ['stepper', 'trepte', 'cardio'],
  'гребной':       ['vaslit', 'rowing', 'canotaj', 'veslire', 'aparat vaslit'],
  'прогулочный':   ['cross trainer', 'eliptic', 'cardio'],

  // ── Силовые ──
  'гантели':       ['gantere', 'dumbbell', 'greutati', 'halter'],
  'гантель':       ['gantera', 'dumbbell', 'greutate'],
  'штанга':        ['bara', 'haltera', 'barbell', 'disc'],
  'гриф':          ['bara', 'barbell', 'grip'],
  'блин':          ['disc', 'greutate', 'диск', 'plate'],
  'диск':          ['disc', 'greutate', 'блин', 'plate', 'haltera'],
  'гиря':          ['ghiulea', 'kettlebell', 'greutate'],
  'турник':        ['bara fixa', 'pull-up', 'tractiuni', 'bare orizontale'],
  'перекладина':   ['bara fixa', 'pull-up', 'tractiuni', 'турник'],
  'брусья':        ['paralele', 'dips', 'bare paralele', 'triceps'],
  'скамья':        ['banca', 'bench', 'panca', 'impins'],
  'жим':           ['bench press', 'impins', 'banca', 'press'],
  'присед':        ['squat', 'genuflexiuni', 'rack', 'bara'],
  'тренажер':      ['aparat', 'masina', 'echipament', 'statie'],
  'тренажёр':      ['aparat', 'masina', 'echipament', 'statie'],
  'многофункциональный': ['multifunctional', 'complex', 'statie'],
  'рама':          ['rack', 'cadru', 'frame', 'suport'],
  'стойка':        ['rack', 'suport', 'stand', 'cadru'],
  'силовая':       ['forta', 'powerlifting', 'haltera', 'aparat'],
  'кроссовер':     ['crossover', 'cablu', 'блок'],
  'блок':          ['cablu', 'crossover', 'scripete'],
  'пресс':         ['abdominal', 'ab', 'roman chair', 'crunch', 'bara abdominal'],
  'гиперэкстензия':['hiperextensie', 'spate', 'lombar'],

  // ── Бокс и единоборства ──
  'бокс':          ['box', 'boxing', 'arte martiale', 'lupta'],
  'боксерский':    ['box', 'sac', 'manusi', 'ring'],
  'карате':        ['karate', 'arte martiale', 'kick', 'kimono'],
  'борьба':        ['lupte', 'wrestling', 'arte martiale', 'judo', 'sambo'],
  'дзюдо':         ['judo', 'arte martiale', 'lupte', 'kimono'],
  'самбо':         ['sambo', 'lupte', 'arte martiale'],
  'кикбоксинг':    ['kickboxing', 'box', 'arte martiale'],
  'тайский':       ['muay thai', 'thai box', 'arte martiale'],
  'мма':           ['mma', 'arte martiale mixte', 'grappling'],
  'перчатки':      ['manusi', 'gloves', 'box', 'manusite'],
  'груша':         ['sac', 'punching bag', 'box', 'манекен'],
  'мешок':         ['sac', 'punching bag', 'box'],
  'боксерский мешок':['sac box', 'punching bag'],
  'кимоно':        ['kimono', 'karate', 'judo', 'arte martiale'],
  'татами':        ['tatami', 'covor', 'lupte', 'saltea sport'],
  'манекен':       ['manechin', 'dummy', 'sac antrenament', 'box'],
  'шингарды':      ['aparatoare tibie', 'shin guard', 'protectie'],
  'капа':          ['protector dentar', 'gum shield', 'box'],
  'бинты':         ['fasa', 'bandaj', 'box', 'maini'],

  // ── Мячи и командные ──
  'мяч':           ['minge', 'ball'],
  'футбол':        ['fotbal', 'football', 'soccer', 'minge'],
  'футбольный':    ['fotbal', 'football', 'soccer'],
  'баскетбол':     ['baschet', 'basketball', 'minge baschet'],
  'волейбол':      ['volei', 'volleyball', 'minge volei'],
  'теннис':        ['tenis', 'tennis', 'racheta'],
  'настольный теннис':['tenis masa', 'ping pong', 'masa'],
  'пинг понг':     ['tenis masa', 'ping pong', 'paleta'],
  'пинг':          ['tenis masa', 'ping pong', 'masa'],
  'понг':          ['tenis masa', 'ping pong', 'masa'],
  'ракетка':       ['racheta', 'paleta', 'racket'],
  'бадминтон':     ['badminton', 'racheta', 'volant', 'fluturase'],
  'гандбол':       ['handbal', 'minge handbal', 'poarta'],
  'регби':         ['rugby', 'minge rugby', 'oval'],
  'хоккей':        ['hochei', 'stick', 'puc', 'gheata'],
  'сетка':         ['fileu', 'net', 'plasa'],
  'ворота':        ['poarta', 'gol', 'goal'],
  'стойка ворот':  ['poarta fotbal', 'poarta', 'cadru gol'],
  'мяч волейбольный':['minge volei', 'volleyball'],
  'мяч баскетбольный':['minge baschet', 'basketball'],
  'мяч футбольный':['minge fotbal', 'football'],

  // ── Фитнес и йога ──
  'коврик':        ['saltea', 'mat', 'saltea fitness', 'yoga mat'],
  'йога':          ['yoga', 'fitness', 'saltea', 'pilates', 'meditatie'],
  'пилатес':       ['pilates', 'yoga', 'fitness', 'reformer'],
  'фитбол':        ['fitball', 'minge fitness', 'gymball', 'minge aerobic'],
  'фитбол мяч':    ['fitball', 'gymball', 'minge fitness'],
  'резинка':       ['banda elastica', 'elastic', 'guma', 'expander'],
  'эластичная лента':['banda elastica', 'elastic'],
  'эспандер':      ['expander', 'banda elastica', 'elastic', 'spring'],
  'скакалка':      ['coarda', 'skiping', 'jump rope', 'sarit'],
  'обруч':         ['hula hoop', 'cerc', 'hula'],
  'хула хуп':      ['hula hoop', 'cerc', 'обруч'],
  'аэробика':      ['aerobic', 'step', 'fitness', 'cardio'],
  'степ':          ['step aerobic', 'trepte', 'stepper', 'aerobic'],
  'роллер':        ['roller', 'cilindru foam', 'masaj'],
  'массажный ролик':['roller', 'cilindru', 'masaj'],
  'стретчинг':     ['stretching', 'intindere', 'flexibilitate'],
  'растяжка':      ['stretching', 'intindere', 'flexibilitate', 'saltea'],
  'тренировочный мяч':['minge fitness', 'fitball', 'medicinala'],
  'медбол':        ['minge medicinala', 'medicinala', 'greutate'],
  'утяжелитель':   ['greutate', 'gantere', 'lastare', 'вес'],

  // ── Плавание ──
  'плавание':      ['inot', 'swimming', 'piscina', 'aqua'],
  'бассейн':       ['piscina', 'inot', 'swimming'],
  'ласты':         ['aripioare', 'fins', 'inot'],
  'очки':          ['ochelari', 'goggles', 'inot'],
  'очки для плавания':['ochelari inot', 'goggles', 'swimming'],
  'шапочка':       ['casca inot', 'swim cap'],
  'доска для плавания':['placa inot', 'kick board'],
  'аквааэробика':  ['aqua aerobic', 'inot', 'piscina'],

  // ── Зимние ──
  'лыжи':          ['schi', 'ski', 'iarna', 'winter'],
  'сноуборд':      ['snowboard', 'tabla', 'iarna'],
  'коньки':        ['patine', 'ice skate', 'gheata', 'ice'],

  // ─��� Защита ──
  'шлем':          ['casca', 'helmet', 'protectie', 'cap'],
  'защита':        ['protectie', 'protection', 'echipament', 'pad'],
  'наколенники':   ['genunchiere', 'knee pads', 'genunchi'],
  'налокотники':   ['cotiere', 'elbow pads', 'cot'],
  'бандаж':        ['bandaj', 'support', 'protectie'],
  'суппорт':       ['suport', 'bandaj', 'protectie articulatie'],
  'жилет':         ['vesta', 'vest', 'greutate', 'zbroia'],

  // ── Спортзалы и учреждения ──
  'школьный':      ['scoala', 'school', 'inventar', 'educatie fizica'],
  'школа':         ['scoala', 'school', 'educatie', 'copii'],
  'детский':       ['copii', 'junior', 'kids', 'school', 'scoala'],
  'спортзал':      ['sala', 'gym', 'sport', 'institutii'],
  'стадион':       ['stadion', 'teren', 'outdoor', 'sport'],
  'детская площадка':['loc de joaca', 'copii', 'exterior'],

  // ── RO → RU/EN ──
  'banda':         ['беговая', 'treadmill', 'alergare', 'cardio'],
  'bicicleta':     ['велосипед', 'bike', 'cycling', 'spinning'],
  'gantere':       ['гантели', 'dumbbell', 'halter'],
  'minge':         ['мяч', 'ball', 'fotbal', 'baschet', 'volei'],
  'aparat':        ['тренажер', 'masina', 'echipament', 'fitness'],
  'saltea':        ['коврик', 'mat', 'yoga', 'pilates'],
  'manusi':        ['перчатки', 'gloves', 'box'],
  'sac':           ['груша', 'punching bag', 'box', 'мешок'],
  'tenis':         ['теннис', 'tennis', 'racheta'],
  'fotbal':        ['футбол', 'football', 'soccer'],
  'baschet':       ['баскетбол', 'basketball'],
  'volei':         ['волейбол', 'volleyball'],
  'yoga':          ['йога', 'fitness', 'saltea', 'pilates'],
  'inot':          ['плавание', 'swimming', 'piscina'],
  'schi':          ['лыжи', 'ski', 'iarna'],
  'haltera':       ['штанга', 'barbell', 'bara'],
  'bara':          ['штанга', 'гриф', 'турник', 'barbell'],
  'eliptic':       ['эллипс', 'elliptical', 'orbitrek'],
  'banca':         ['скамья', 'bench', 'press', 'жим'],
  'rack':          ['стойка', 'рама', 'suport', 'cadru'],
  'coarda':        ['скакалка', 'jump rope', 'skiping'],
  'elastic':       ['резинка', 'эспандер', 'banda', 'guma'],
  'copii':         ['детский', 'kids', 'junior', 'школьный'],
  'casa':          ['домашний', 'home', 'compact', 'складной'],
  'sala':          ['спортзал', 'gym', 'sport'],
  'profesional':   ['профессиональный', 'pro', 'commercial'],
  'tatami':        ['татами', 'covor', 'lupte'],
  'racheta':       ['ракетка', 'racket', 'tenis', 'badminton'],
  'fileu':         ['сетка', 'net', 'plasa'],
  'poarta':        ['ворота', 'gol', 'goal'],
  'covor':         ['татами', 'tatami', 'борьба', 'saltea'],
  'disc':          ['блин', 'диск', 'plate', 'haltera'],
  'kimono':        ['кимоно', 'karate', 'judo', 'arte martiale'],
  'vaslit':        ['гребной', 'rowing', 'canotaj'],
  'stepper':       ['степпер', 'trepte', 'cardio'],
  'orbitrek':      ['орбитрек', 'eliptic', 'elliptical'],

  // ── Частые опечатки / транслит ──
  'ганттели':      ['gantere', 'dumbbell', 'гантели'],
  'ганделя':       ['gantere', 'dumbbell', 'гантели'],
  'штанги':        ['bara', 'haltera', 'barbell'],
  'бигвой':        ['беговая', 'banda', 'treadmill'],
  'hms':           ['hms'],
  'kettler':       ['kettler'],
  'technogym':     ['technogym'],
  'torneo':        ['torneo'],
  'kettlebell':    ['гиря', 'ghiulea', 'kettlebell'],
  'dumbbell':      ['гантели', 'gantere', 'halter'],
  'treadmill':     ['беговая', 'banda', 'alergare'],
  'barbell':       ['штанга', 'haltera', 'bara'],
  'squat':         ['присед', 'genuflexiuni', 'rack'],
  'bench':         ['скамья', 'banca', 'press'],
  'cardio':        ['кардио', 'alergare', 'bicicleta', 'eliptic'],
  'fitness':       ['фитнес', 'sport', 'sala', 'antrenament'],
  'gym':           ['спортзал', 'sala', 'fitness', 'sport'],
};

// ─── Концепт-карта (семантика / намерение) ────────────────────────────────────
const CONCEPT_MAP: Array<[RegExp, string[]]> = {
  // Цели
  [Symbol()]: [/\b()/i, []],
} as unknown as Array<[RegExp, string[]]>;

// Используем массив для порядка
const CONCEPTS: Array<{ pattern: RegExp; keywords: string[] }> = [
  // Цели
  { pattern: /похуде|slabire|slabit|pierdere.*greutate|для.*похудения|burn fat/i,
    keywords: ['cardio', 'alergare', 'bicicleta', 'eliptic', 'stepper', 'aerobic', 'coarda', 'banda'] },
  { pattern: /набрать.*масс|masa.*muscul|crestere.*muscul|накачать|build.*muscle/i,
    keywords: ['haltera', 'gantere', 'aparat', 'banca', 'rack', 'powerlifting', 'bara'] },
  { pattern: /для.*дома|acasa|home.*gym|домашн.*трен|compact.*gym/i,
    keywords: ['compact', 'pliabil', 'casa', 'домашний', 'складной', 'foldable'] },
  { pattern: /для.*зала|sala.*sport|gym.*equip|коммерч|тренажерный.*зал/i,
    keywords: ['profesional', 'commercial', 'sala', 'gym', 'statie'] },
  { pattern: /для.*детей|pentru.*copii|kids.*sport|детск|junior.*sport/i,
    keywords: ['copii', 'junior', 'kids', 'scoala', 'детский', 'mic'] },
  { pattern: /для.*школ|scoala|physical.*educ|физкульт|inventar.*scoala/i,
    keywords: ['scoala', 'inventar', 'copii', 'educatie', 'fizica'] },
  { pattern: /начинающ|incepator|beginner|новичок|первые.*трениров/i,
    keywords: ['basic', 'standard', 'incepator', 'light', 'usor', 'entry'] },
  { pattern: /профессионал|profesional|professional|pro\b|commercial.*grade/i,
    keywords: ['profesional', 'commercial', 'competition', 'heavy', 'duty'] },
  { pattern: /реабилитац|recuperare|rehabilitation|восстановлен/i,
    keywords: ['recuperare', 'reabilitare', 'elastic', 'masaj', 'roller', 'salt'] },

  // Части тела
  { pattern: /для.*ног|picioare|leg.*workout|накачать.*ног|квадрицепс|бицепс.*бедра/i,
    keywords: ['bicicleta', 'stepper', 'presa', 'genuflexiuni', 'alergare', 'squat'] },
  { pattern: /для.*рук|maini|arms.*workout|накачать.*рук|бицепс|трицепс/i,
    keywords: ['gantere', 'bara', 'biceps', 'triceps', 'box', 'curl'] },
  { pattern: /для.*спины|spate|back.*workout|укрепить.*спин|широчайш/i,
    keywords: ['vaslit', 'tractiuni', 'bara', 'hiperextensie', 'rowing'] },
  { pattern: /для.*пресс|abdomen|ab.*workout|кубики|рельеф.*живот/i,
    keywords: ['abdominal', 'saltea', 'roman chair', 'crunch', 'ab trainer'] },
  { pattern: /для.*груди|piept|chest.*workout|грудные|жим.*лёжа/i,
    keywords: ['banca', 'bench press', 'fluture', 'cablu', 'piept'] },
  { pattern: /для.*плеч|umeri|shoulder.*workout|дельты|военный.*жим/i,
    keywords: ['gantere', 'bara', 'press', 'deltoid', 'umeri'] },
  { pattern: /для.*ягодиц|fese|glute.*workout|попа|ягодичн/i,
    keywords: ['bicicleta', 'stepper', 'squat', 'fese', 'kickback'] },

  // Виды тренировок
  { pattern: /кардио.*трениров|antrenament.*cardio|cardio.*training/i,
    keywords: ['banda', 'bicicleta', 'eliptic', 'stepper', 'vaslit', 'aerobic'] },
  { pattern: /силовой.*трениров|antrenament.*forta|strength.*training/i,
    keywords: ['haltera', 'gantere', 'aparat forta', 'banca', 'rack', 'bara'] },
  { pattern: /растяжк|stretching.*exercit|flexibil|гибкост/i,
    keywords: ['saltea', 'yoga', 'elastic', 'coarda', 'pilates', 'strap'] },
  { pattern: /восстановл|recuperare|recovery|foam.*roll|миофасциал/i,
    keywords: ['masaj', 'roller', 'elastic', 'crioterapie', 'recuperare'] },
  { pattern: /соревнован|competitie|competition|турнир/i,
    keywords: ['profesional', 'competition', 'certificat', 'omologat', 'fiba', 'fifa'] },
  { pattern: /групповые.*занят|group.*fitness|зумба|танцы.*фитнес/i,
    keywords: ['step', 'aerobic', 'fitball', 'elastic', 'coarda', 'dans'] },
  { pattern: /функциональн.*трениров|functional.*training|кроссфит|crossfit/i,
    keywords: ['kettlebell', 'elastic', 'coarda', 'bara', 'box', 'gantere'] },
  { pattern: /интервальн|hiit|высокоинтенсивн|interval.*training/i,
    keywords: ['coarda', 'gantere', 'kettlebell', 'box', 'step', 'interval'] },

  // Виды спорта
  { pattern: /бокс.*трениров|box.*antrenament|boxing.*training/i,
    keywords: ['sac', 'manusi', 'ring', 'box', 'bara'] },
  { pattern: /борьба.*трениров|lupte.*antrenament|wrestling.*train/i,
    keywords: ['tatami', 'covor', 'kimono', 'centura', 'saltea sport'] },
  { pattern: /плавание.*трениров|antrenament.*inot|swim.*training/i,
    keywords: ['ochelari', 'casca', 'aripioare', 'placa', 'inot'] },
  { pattern: /велосипедн|ciclism.*antrenament|cycling.*train/i,
    keywords: ['bicicleta', 'spinning', 'saua', 'pedale', 'ciclism'] },
  { pattern: /командн.*спорт|sport.*colectiv|team.*sport/i,
    keywords: ['fotbal', 'baschet', 'volei', 'minge', 'poarta', 'fileu'] },
  { pattern: /теннис.*трениров|tenis.*antrenament/i,
    keywords: ['racheta', 'minge tenis', 'fileu', 'tenis'] },
  { pattern: /футбол.*трениров|fotbal.*antrenament|football.*train/i,
    keywords: ['minge fotbal', 'poarta', 'fotbal', 'marci', 'con'] },
];

// ─── Популярные запросы ────────────────────────────────────────────────────────
export const POPULAR_QUERIES: Record<'ro' | 'ru', string[]> = {
  ro: ['Bandă de alergare', 'Gantere', 'Bicicletă fitness', 'Sac de box', 'Saltea yoga', 'HMS', 'Minge fotbal', 'Aparat multifuncțional', 'Stepper', 'Coarda'],
  ru: ['Беговая дорожка', 'Гантели', 'Велотренажёр', 'Боксёрский мешок', 'Коврик для йоги', 'HMS', 'Футбольный мяч', 'Многофункциональный тренажёр', 'Скакалка', 'Степпер'],
};

// ─── История поиска (localStorage) ────────────────────────────────────────────
const HISTORY_KEY = 'sporto_search_history';
const MAX_HISTORY = 7;

export function getSearchHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
export function addToHistory(query: string): void {
  if (!query.trim() || query.trim().length < 2) return;
  const h = getSearchHistory().filter(q => q.toLowerCase() !== query.toLowerCase());
  h.unshift(query.trim());
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}
export function removeFromHistory(query: string): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getSearchHistory().filter(q => q !== query)));
}
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ─── Парсинг цены из строки поиска ────────────────────────────────────────────
export interface PriceRange { min?: number; max?: number }

export function parsePrice(query: string): { price: PriceRange; cleanQuery: string } {
  let clean = query;
  let min: number | undefined;
  let max: number | undefined;

  // Диапазон: "500-1000", "500 – 2000 лей"
  const range = clean.match(/(\d[\d\s]{0,4})\s*[-–]\s*(\d[\d\s]{0,4})/);
  if (range) {
    const a = parseInt(range[1].replace(/\s/g, ''));
    const b = parseInt(range[2].replace(/\s/g, ''));
    if (!isNaN(a) && !isNaN(b) && a < b && b < 1_000_000) {
      min = Math.min(a, b); max = Math.max(a, b);
    }
    clean = clean.replace(range[0], '').trim();
  }

  // "до N", "max N", "pana la N", "sub N"
  if (!max) {
    const m = clean.match(/(?:до|max|pana\s+la|sub|не\s+больше|under|менее|дешевле)\s*(\d[\d\s]{0,5})/i);
    if (m) { max = parseInt(m[1].replace(/\s/g, '')); clean = clean.replace(m[0], '').trim(); }
  }

  // "от N", "min N", "de la N", "peste N", "от 1000"
  if (!min) {
    const m = clean.match(/(?:от|min|de\s+la|peste|от\s+\d|начиная|from|свыше|дороже)\s*(\d[\d\s]{0,5})/i);
    if (m) { min = parseInt(m[1].replace(/\s/g, '')); clean = clean.replace(m[0], '').trim(); }
  }

  return { price: { min, max }, cleanQuery: clean.replace(/\s+/g, ' ').trim() };
}

// ─── Раскрытие токенов ─────────────────────────────────────────────────────────
export interface ExpandedTokens {
  raw: string[];
  withSynonyms: string[];
  conceptKeywords: string[];
}

export function expandTokens(rawTokens: string[], originalQuery: string): ExpandedTokens {
  const withSynonyms = new Set<string>(rawTokens);

  // Синонимы по отдельным токенам
  for (const t of rawTokens) {
    (SYNONYM_MAP[t] ?? []).forEach(s => withSynonyms.add(norm(s)));
  }
  // Синонимы по биграммам
  for (let i = 0; i < rawTokens.length - 1; i++) {
    const bigram = `${rawTokens[i]} ${rawTokens[i + 1]}`;
    (SYNONYM_MAP[bigram] ?? []).forEach(s => withSynonyms.add(norm(s)));
  }
  // Синонимы по всей строке (мультиворд запросы)
  const normQuery = norm(originalQuery);
  for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
    if (normQuery.includes(key)) syns.forEach(s => withSynonyms.add(norm(s)));
  }

  // Концептуальные ключевые слова
  const conceptKeywords = new Set<string>();
  for (const { pattern, keywords } of CONCEPTS) {
    if (pattern.test(originalQuery) || pattern.test(normQuery)) {
      keywords.forEach(k => conceptKeywords.add(norm(k)));
    }
  }

  return {
    raw: rawTokens,
    withSynonyms: Array.from(withSynonyms),
    conceptKeywords: Array.from(conceptKeywords),
  };
}

// ─── Тип результата ────────────────────────────────────────────────────────────
export type MatchType = 'exact' | 'fuzzy' | 'synonym' | 'concept';

export interface ScoredProduct {
  product: Product;
  score: number;
  matchType: MatchType;
}

// ─── Основная функция скоринга ─────────────────────────────────────────────────
export function scoreProduct(
  product: Product,
  rawTokens: string[],
  lang: Language,
  expanded: ExpandedTokens,
  price?: PriceRange,
): ScoredProduct | null {
  // Фильтр по цене
  if (price?.min !== undefined && product.price < price.min) return null;
  if (price?.max !== undefined && product.price > price.max) return null;

  // Нет токенов — только фильтр цены, все проходят
  if (rawTokens.length === 0) return { product, score: 1, matchType: 'exact' };

  const otherLang: Language = lang === 'ro' ? 'ru' : 'ro';
  const name      = norm(product.name[lang]);
  const nameOther = norm(product.name[otherLang]);
  const desc      = norm(product.description[lang]);
  const descOther = norm(product.description[otherLang]);
  const cat       = norm(product.category);
  const sub       = norm(product.subcategory);
  const brand     = norm(product.brand || '');
  const sku       = norm(product.sku || '');
  const cod       = norm(String(product.cod || ''));
  const combined  = `${name} ${nameOther} ${desc} ${descOther} ${cat} ${sub} ${brand} ${sku} ${cod}`;

  let score = 0;
  let matchType: MatchType = 'exact';
  let allMatched = true;

  for (const token of rawTokens) {
    let tokenMatched = false;

    // ── 1. SKU / артикул — наивысший приоритет ──
    if (sku === token || cod === token)          { return { product, score: 1000, matchType: 'exact' }; }
    if (sku.includes(token))                     { score += 80; tokenMatched = true; }
    else if (cod.includes(token))               { score += 70; tokenMatched = true; }

    // ── 2. Бренд ──
    else if (brand === token)                    { score += 60; tokenMatched = true; }
    else if (brand.startsWith(token))            { score += 45; tokenMatched = true; }
    else if (brand.includes(token))              { score += 30; tokenMatched = true; }

    // ── 3. Название (активный язык) ──
    else if (name.startsWith(token))             { score += 20; tokenMatched = true; }
    else if (name.includes(token))               { score += 12; tokenMatched = true; }

    // ── 4. Название (другой язык) ──
    else if (nameOther.startsWith(token))        { score += 16; tokenMatched = true; }
    else if (nameOther.includes(token))          { score += 8;  tokenMatched = true; }

    // ── 5. Описание / категория ──
    else if (desc.includes(token) || descOther.includes(token)) { score += 4; tokenMatched = true; }
    else if (cat.includes(token) || sub.includes(token))        { score += 6; tokenMatched = true; }

    // ── 6. Нечёткий матч (опечатки) ──
    else {
      const fName = fuzzyFieldScore(token, name);
      if (fName > 0) { score += fName + 2; matchType = 'fuzzy'; tokenMatched = true; }
      else {
        const fBrand = fuzzyFieldScore(token, brand);
        if (fBrand > 0) { score += fBrand + 3; matchType = 'fuzzy'; tokenMatched = true; }
        else {
          const fOther = fuzzyFieldScore(token, nameOther);
          if (fOther > 0) { score += fOther + 1; matchType = 'fuzzy'; tokenMatched = true; }
        }
      }
    }

    if (tokenMatched) continue;

    // ── 7. Синонимы ──
    let synMatched = false;
    for (const syn of expanded.withSynonyms) {
      if (syn === token) continue;
      if (combined.includes(syn)) {
        score += 5;
        if (matchType === 'exact') matchType = 'synonym';
        synMatched = true;
        break;
      }
    }
    if (synMatched) continue;

    // ── 8. Концептуальный / семантический ──
    let conceptMatched = false;
    for (const concept of expanded.conceptKeywords) {
      if (combined.includes(concept)) {
        score += 3;
        if (matchType === 'exact') matchType = 'concept';
        conceptMatched = true;
        break;
      }
    }
    if (conceptMatched) continue;

    // Токен не найден ни одним методом
    allMatched = false;
    break;
  }

  if (!allMatched || score <= 0) return null;
  return { product, score, matchType };
}

// ─── Результат поиска ──────────────────────────────────────────────────────────
export interface SearchResult {
  hits: ScoredProduct[];
  total: number;
  priceRange?: PriceRange;
  matchedBrands: string[];
  matchedCategories: string[];
  hasFuzzy: boolean;
  hasSynonym: boolean;
  hasConcept: boolean;
  rawTokens: string[];
  expandedTokens: ExpandedTokens;
}

// ─── Главная функция поиска ────────────────────────────────────────────────────
export function searchProducts(
  products: Product[],
  query: string,
  lang: Language,
  limit = 8,
): SearchResult {
  const { price, cleanQuery } = parsePrice(query);
  const rawTokens = norm(cleanQuery).split(/\s+/).filter(t => t.length >= 1);
  const expanded = expandTokens(rawTokens, query);
  const hasPriceFilter = price.min !== undefined || price.max !== undefined;

  const scored: ScoredProduct[] = [];
  for (const product of products) {
    const result = scoreProduct(product, rawTokens, lang, expanded, hasPriceFilter ? price : undefined);
    if (result) scored.push(result);
  }
  scored.sort((a, b) => b.score - a.score);

  const brandSet = new Set<string>();
  const catSet = new Set<string>();
  let hasFuzzy = false, hasSynonym = false, hasConcept = false;

  scored.forEach(({ product, matchType }) => {
    if (product.brand) brandSet.add(product.brand);
    catSet.add(product.category);
    if (matchType === 'fuzzy')   hasFuzzy = true;
    if (matchType === 'synonym') hasSynonym = true;
    if (matchType === 'concept') hasConcept = true;
  });

  return {
    hits: scored.slice(0, limit),
    total: scored.length,
    priceRange: hasPriceFilter ? price : undefined,
    matchedBrands: Array.from(brandSet).slice(0, 6),
    matchedCategories: Array.from(catSet).slice(0, 4),
    hasFuzzy,
    hasSynonym,
    hasConcept,
    rawTokens,
    expandedTokens: expanded,
  };
}

// ─── Умные подсказки при нулевых результатах ──────────────────────────────────
export function getSuggestions(products: Product[], rawTokens: string[], lang: Language): string[] {
  if (rawTokens.length <= 1) return [];
  const suggestions: string[] = [];
  // Попробовать каждый токен по отдельности
  for (const token of rawTokens) {
    if (token.length < 3) continue;
    const expanded = expandTokens([token], token);
    const res = products
      .map(p => scoreProduct(p, [token], lang, expanded))
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score);
    if (res.length > 0 && !suggestions.includes(token)) suggestions.push(token);
    if (suggestions.length >= 3) break;
  }
  return suggestions;
}
