import { checkProductSkus, productSkuError } from '../../lib/product-sku';
import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { cacheInvalidate } from '../../lib/queryCache';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Download,
  Info,
  Tag,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';

const KNOWN_BRANDS = [
  'TECHNOGYM','HMS','NILS','SUHS','DITTMANN','EZOUS','CIMA',
  'WISH','FERRARI','LAMBORGHINI','REEBOK','ADIDAS','NIKE','KETTLER',
  'SPARTAN','TUNTURI','BAUER','WILSON','HEAD','YONEX','COSCO','SAN EI',
  'DIKE','DIKES','MIKASA','MOLTEN','SELECT','SONDICO','UMBRO','PUMA',
];

const CATEGORY_OPTIONS = [
  { slug: 'aparate-cardio',       ro: 'Aparate Cardio',         ru: 'Кардио тренажеры' },
  { slug: 'aparate-forta',        ro: 'Aparate Forta',          ru: 'Силовые тренажеры' },
  { slug: 'greutati',             ro: 'Greutati & Haltere',     ru: 'Гантели и штанги' },
  { slug: 'fitness-yoga',         ro: 'Fitness & Yoga',         ru: 'Фитнес и йога' },
  { slug: 'inot',                 ro: 'Inot & Natatie',         ru: 'Плавание' },
  { slug: 'sporturi-colective',   ro: 'Sporturi Colective',     ru: 'Командные виды спорта' },
  { slug: 'sporturi-individuale', ro: 'Sporturi Individuale',   ru: 'Индивидуальные виды спорта' },
  { slug: 'arte-martiale',        ro: 'Arte Martiale',          ru: 'Боевые искусства' },
  { slug: 'tenis-masa',           ro: 'Tenis de Masa',          ru: 'Настольный теннис' },
  { slug: 'jocuri',               ro: 'Jocuri & Recreatie',     ru: 'Игры и отдых' },
  { slug: 'forta-exterior',       ro: 'Forta Exterior',         ru: 'Уличный спорт' },
  { slug: 'inventar-institutii',  ro: 'Inventar Institutii',    ru: 'Инвентарь для учреждений' },
];

// Order matters: more specific first
const DETECT_RULES: { kw: string[]; slug: string }[] = [
  // Cardio
  { kw: ['banda alergat','banda de alergat','treadmill','myrun','artis run','skillrun','excite run','run personal'], slug: 'aparate-cardio' },
  { kw: ['bicicleta','bike','cycle','eliptic','elliptical','stepper','scara','skillrow','rowing','vaslit'], slug: 'aparate-cardio' },
  // Forta
  { kw: ['multifunctional','power tower','helcometru','smith','cadru forta','aparat forta','rack','banc press','bench'], slug: 'aparate-forta' },
  // Greutati — suport gantere & lifting wraps first
  { kw: ['suport gantere','suport gantera','suport p/u gantere','suport pt gantere','dumbbell rack','weight rack'], slug: 'greutati' },
  { kw: ['lifting wraps','wrist wraps','bandaje fixare','bandaj maini','bandaj incheietura'], slug: 'greutati' },
  { kw: ['greutati','haltera','gantera','dumbbell','kettlebell','disc','bara','mreana','weight'], slug: 'greutati' },
  // Arte martiale
  { kw: ['manusi box','manusi de box','sac de box','sac box','arte martiale','karate','judo','muay','kimono','tatami','centura','kick'], slug: 'arte-martiale' },
  // Tenis masa
  { kw: ['tenis masa','masa tenis','ping pong','paleta ping','paleta tenis masa','fileu tenis masa'], slug: 'tenis-masa' },
  // Sporturi colective — mingi first
  { kw: ['minge fotbal','minge de fotbal','minge baschet','minge volei','minge handbal','minge rugby','minge medicinala'], slug: 'sporturi-colective' },
  { kw: ['fotbal','soccer','baschet','basketball','volei','volleyball','handbal','handball','rugby'], slug: 'sporturi-colective' },
  { kw: ['poarta','poartă','portar','corner'], slug: 'sporturi-colective' },
  // Sporturi individuale
  { kw: ['badminton','fluturasi','volant','racheta badminton','tenis de camp','tenis camp','racheta tenis','squash'], slug: 'sporturi-individuale' },
  // Inot
  { kw: ['inot','natatie','swim','ochelari inot','palmare','snorkel','pluta','labe inot','labe scurti','labe lungi','labe silicon','labe de inot'], slug: 'inot' },
  // Fitness / yoga — kinesiotape, hoola hoop, bandaj genunchi, expander, training straps
  { kw: ['kinesiotape','kinesio tape','kinesio','taping','bandaj genunchi','bandaj pt genunchi','bandaj glezna','bandaj cot','genunchi silicon'], slug: 'fitness-yoga' },
  { kw: ['hoola hoop','hula hoop','cerc cu greutate','cerc hoola','cerc hula'], slug: 'fitness-yoga' },
  { kw: ['curea glezna','training straps','ankle strap','glezniera','manseta forta'], slug: 'fitness-yoga' },
  { kw: ['shaker','sticla sport','bidon sport','blender bottle','protein shaker'], slug: 'fitness-yoga' },
  { kw: ['yoga','pilates','aerobic','stretching','expandor','expander','elastic','coarda','coardă','saltea','fitball','bosu','fitness'], slug: 'fitness-yoga' },
  // Exterior — treking, nordic walking
  { kw: ['baston treking','baston nordic','nordic walking','treking','trekking','nordic pole','bastoane'], slug: 'forta-exterior' },
  { kw: ['exterior','outdoor','parcurs','teren','gazon','leagan','tobogan','loc de joaca'], slug: 'forta-exterior' },
  // Inventar
  { kw: ['plasa sportiva','plasa badminton','fileu','plasa volei','plasa fotbal','plasa 3in1','plasa 3 in 1'], slug: 'inventar-institutii' },
  { kw: ['inventar','arbitru','fluier','cronometru','tribuna','scorier','marcaj','con antren','jaloane','gardut'], slug: 'inventar-institutii' },
  { kw: ['diploma','trofeu','medalie','cupa','suvenire','trofee'], slug: 'jocuri' },
  // Jocuri
  { kw: ['sah','frisbee','dart','biliard','table','joc de masa','joc colectiv'], slug: 'jocuri' },
  // Accessories → fitness-yoga as fallback
  { kw: ['accesorii','creta','magnezi','rucsac','geanta sport','sac sport','prosop','bidon'], slug: 'fitness-yoga' },
  // Mingi generice → colective
  { kw: ['minge','mingi'], slug: 'sporturi-colective' },
  // Genuncheri / protectii → fitness-yoga (general protective gear)
  { kw: ['genuncheri','manseta','cotiera','aparatoare','protectie'], slug: 'fitness-yoga' },
  // Aparat generic → aparate-forta
  { kw: ['aparat multifunctional','aparat de forta'], slug: 'aparate-forta' },
  // Silic oil / lubrifiant → fitness-yoga
  { kw: ['silicone oil','lubrifiant','ulei'], slug: 'fitness-yoga' },
];

function detectCategory(text: string): string {
  const lo = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const { kw, slug } of DETECT_RULES) {
    if (kw.some(k => lo.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) return slug;
  }
  return '';
}

function extractBrand(name: string): string {
  const upper = name.toUpperCase();
  for (const b of KNOWN_BRANDS) {
    if (upper.includes(b)) return b;
  }
  return '';
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  return parseFloat(String(val).replace(/\s/g, '').replace(',', '.')) || 0;
}

// We also skip rows that somehow have a numeric Cod but price=0 AND qty=0
// (those are zero-balance phantom rows or sub-total lines)

interface ParsedRow {
  idx: number;      // original array index (for stable key)
  id: string;
  name_ro: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  unit: string;
  qty: number;
}

export function AdminImport() {
  const { lang } = useAdminLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; failed: number } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [filterNoCat, setFilterNoCat] = useState(false);
  const L = (ro: string, ru: string) => lang === 'ro' ? ro : ru;
  const categoryLabel = (slug: string) => {
    const category = CATEGORY_OPTIONS.find((item) => item.slug === slug);
    return category ? (lang === 'ro' ? category.ro : category.ru) : slug;
  };

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setParseError('');
    setRows([]);
    setImportResult(null);
    setStep('upload');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // 1. Find header row — must contain a cell exactly "Cod"
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
          if ((rawRows[i] as string[]).some(c => String(c).trim().toLowerCase() === 'cod')) {
            headerIdx = i;
            break;
          }
        }
        if (headerIdx === -1) {
          setParseError(L('Nu s-a găsit rândul cu antetul "Cod". Verifică dacă fișierul nu a fost modificat.', 'Не найдена строка с заголовком "Cod". Убедись, что файл не изменён.'));
          return;
        }

        // 2. Map columns
        const hdrs = (rawRows[headerIdx] as string[]).map(h => String(h).trim().toLowerCase());
        const cCod   = hdrs.findIndex(h => h === 'cod');
        const cName  = hdrs.findIndex(h => h.includes('denu'));
        const cSku   = hdrs.findIndex(h => h === 'catalog');
        const cUnit  = hdrs.findIndex(h => h === 'unit.' || h === 'unit');
        const cQty   = hdrs.findIndex(h => h.startsWith('cant'));
        const cPrice = hdrs.findIndex(h => h.startsWith('pret'));

        if (cCod === -1 || cName === -1) {
          setParseError(L('Nu s-au găsit coloanele "Cod" și "Denumirea". Verifică anteturile fișierului.', 'Не найдены колонки "Cod" и "Denumirea". Проверь заголовки файла.'));
          return;
        }

        // 3. Walk rows — track current section for context
        const results: ParsedRow[] = [];
        let currentSection = '';   // last recognised section/category text
        let idx = 0;

        for (let i = headerIdx + 1; i < rawRows.length; i++) {
          const row = rawRows[i] as string[];

          const codRaw  = String(row[cCod]  ?? '').trim();
          const nameRaw = String(row[cName] ?? '').trim();

          // Skip completely blank rows
          if (!codRaw && !nameRaw) continue;

          const codNum = parseFloat(codRaw.replace(',', '.'));
          const isProduct = !isNaN(codNum) && codNum > 0 && codNum < 1_000_000;

          if (!isProduct) {

            // Pick whichever cell has text (sometimes category name is in col A)
            const anyText = (row as string[])
              .map(c => String(c ?? '').trim())
              .find(c => c.length > 0 && c.length < 80) ?? '';
            if (anyText && !/^(depozit|sold|marfuri|total|burebista)/i.test(anyText)) {
              currentSection = anyText;
            }
            continue; // ← NEVER added to product list
          }

          if (!nameRaw) continue; // no name → skip

          const price = cPrice >= 0 ? parseNumber(row[cPrice]) : 0;
          const qty   = cQty   >= 0 ? parseNumber(row[cQty])   : 0;

          // Skip rows with zero price (phantom rows, sub-total ghost lines)
          if (price <= 0) continue;

          const sku   = cSku  >= 0 ? String(row[cSku]  ?? '').trim() : '';
          const unit  = cUnit >= 0 ? String(row[cUnit] ?? '').trim() : 'BUC.';
          const brand = extractBrand(nameRaw);

          // Category: try product name first, then section context
          const category = detectCategory(nameRaw) || detectCategory(currentSection);

          // Subcategory slug from section text
          const subcategory = currentSection
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/^[-\s]+/, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 60);

          results.push({
            idx: idx++,
            id: String(Math.round(codNum)),
            name_ro: nameRaw,
            sku,
            brand,
            category,
            subcategory,
            price,
            unit: unit || 'BUC.',
            qty,
          });
        }

        if (results.length === 0) {
          setParseError(L('Nu au fost găsite produse. Verifică să existe rânduri cu Cod numeric și preț > 0.', 'Не найдено товаров. Убедись что в файле есть строки с числовым Cod и ценой > 0.'));
          return;
        }

        setRows(results);
        setStep('preview');
      } catch (err) {
        setParseError(L('Eroare la citirea fișierului: ', 'Ошибка чтения файла: ') + String(err));
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const setRowCategory = (idx: number, slug: string) => {
    setRows(prev => prev.map(r => r.idx === idx ? { ...r, category: slug } : r));
  };

  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    setImportError(null);

    const toInsert = rows
      .filter(r => r.category)
      .map(r => ({
        id: r.id,
        name_ro: r.name_ro,
        name_ru: r.name_ro,
        sku: r.sku || null,
        brand: r.brand || null,
        category: r.category,
        subcategory: r.subcategory || null,
        price: r.price,
        unit: r.unit,
        qty: r.qty,
        description_ro: '',
        description_ru: '',
        featured: false,
        active: true,
      }));

    try {
      await checkProductSkus(supabase, toInsert);
    } catch (error) {
      setImportError(productSkuError(error, L('ro', 'ru') as 'ro' | 'ru'));
      setImporting(false);
      return;
    }

    const BATCH = 200;
    let okCount = 0;
    let failCount = 0;

    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const { error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'id' });
      if (error) {
        setImportError(productSkuError(error, L('ro', 'ru') as 'ro' | 'ru'));
        console.error('Batch error:', error.message);
        failCount += batch.length;
      } else {
        okCount += batch.length;
      }
    }

    setImportResult({ ok: okCount, failed: failCount });
    if (okCount > 0) {
      cacheInvalidate('products:');
      cacheInvalidate('brands:active');
      cacheInvalidate('brands:counts');
    }
    setImporting(false);
    if (failCount === 0) setStep('done');
  };

  const downloadCsv = () => {
    const good = rows.filter(r => r.category);
    const hdrs = ['id','name_ro','sku','brand','category','subcategory','price','unit','qty'];
    const csv = [
      hdrs.join(','),
      ...good.map(r =>
        [r.id, `"${r.name_ro.replace(/"/g,'""')}"`, r.sku, r.brand,
         r.category, r.subcategory, r.price, r.unit, r.qty].join(',')
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products_clean.csv';
    a.click();
  };

  const readyCount   = rows.filter(r => r.category).length;
  const noCatCount   = rows.filter(r => !r.category).length;
  const displayRows  = filterNoCat ? rows.filter(r => !r.category) : rows;

  return (
    <div className="admin-section">

      <div className="admin-section-heading">
        <div className="w-full">
          <h1 className="admin-ink">{L('Import produse din Excel', 'Импорт товаров из Excel')}</h1>
          <p className="admin-muted text-sm mt-1">
            {L(
              'Încarcă fișierul Excel — rândurile-separatoare și prețurile zero sunt ignorate automat',
              'Загрузи Excel-файл — строки-разделители и нулевые цены будут автоматически проигнорированы',
            )}
          </p>
        </div>
      </div>

      <div className="w-full">

        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="admin-import-drop transition-colors cursor-pointer"
              role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
            >
              <Upload className="w-10 h-10 admin-muted mx-auto mb-4" />
              <p className="admin-ink mb-1">{L('Trage fișierul sau apasă pentru a selecta', 'Перетащи файл или нажми для выбора')}</p>
              <p className="text-sm admin-muted">{L('Suportat: .xlsx, .xls', 'Поддерживается: .xlsx, .xls')}</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>

            {parseError && (
              <div className="mt-4 border border-red-200 bg-red-50 p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            )}

            <div className="mt-6 border admin-border admin-canvas p-5">
              <p className="text-xs admin-muted   mb-3 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> {L('Ce se întâmplă automat', 'Что происходит автоматически')}
              </p>
              <ul className="text-sm admin-muted space-y-1.5 list-disc list-inside">
                <li>{L('Linii-separatoare (Plase sportive, Volei, - TRENAJOARE…) — ignorate', 'Строки-разделители (Plase sportive, Volei, - TRENAJOARE…) — игнорируются')}</li>
                <li>{L('Linii cu preț = 0 — ignorate', 'Строки с ценой = 0 — игнорируются')}</li>
                <li>{L('Categoria este determinată după numele produsului și contextul secțiunii', 'Категория определяется по названию товара и контексту секции')}</li>
                <li>{L('Branduri (HMS, NILS, SUHS, TECHNOGYM…) sunt extrase din nume', 'Бренды (HMS, NILS, SUHS, TECHNOGYM…) извлекаются из названия')}</li>
                <li>{L('Produsele fără categorie recunoscută — pot fi atribuite manual în tabel', 'Товарам без распознанной категории можно назначить категорию вручную в таблице')}</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="border admin-border px-4 py-2 text-center min-w-[72px]">
                  <div className="text-xl admin-ink">{rows.length}</div>
                  <div className="text-xs admin-muted  ">{L('Produse', 'Товары')}</div>
                </div>
                <div className="border border-green-200 bg-green-50 px-4 py-2 text-center min-w-[72px]">
                  <div className="text-xl text-green-700">{readyCount}</div>
                  <div className="text-xs admin-muted  ">{L('Gata', 'Готово')}</div>
                </div>
                {noCatCount > 0 && (
                  <div className="border border-amber-200 bg-amber-50 px-4 py-2 text-center min-w-[72px]">
                    <div className="text-xl text-amber-600">{noCatCount}</div>
                    <div className="text-xs admin-muted  ">{L('Fără cat.', 'Без кат.')}</div>
                  </div>
                )}
                <span className="text-xs admin-muted hidden sm:block">{fileName}</span>
              </div>

              <div className="flex gap-2">
                {noCatCount > 0 && (
                  <button
                    onClick={() => setFilterNoCat(v => !v)}
                    className={`flex items-center gap-1.5 text-xs border px-3 py-2 transition-colors ${
                      filterNoCat ? 'bg-amber-500 admin-on-solid border-amber-500' : 'admin-border admin-muted admin-hover-border'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {filterNoCat ? L('Arată toate', 'Показать все') : L(`Atribuie categorii (${noCatCount})`, `Назначить категории (${noCatCount})`)}
                  </button>
                )}
                <button
                  onClick={downloadCsv}
                  className="flex items-center gap-1.5 text-xs border admin-border admin-hover-border px-3 py-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  onClick={() => { setStep('upload'); setRows([]); }}
                  className="flex items-center gap-1.5 text-xs border admin-border admin-hover-border px-3 py-2 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {L('Alt fișier', 'Другой файл')}
                </button>
              </div>
            </div>

            <div className="border admin-border overflow-hidden mb-6">
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="admin-solid admin-on-solid sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-normal ">Cod</th>
                      <th className="px-3 py-2.5 text-left font-normal  min-w-[280px]">{L('Denumirea', 'Наименование')}</th>
                      <th className="px-3 py-2.5 text-left font-normal ">SKU</th>
                      <th className="px-3 py-2.5 text-left font-normal ">Brand</th>
                      <th className="px-3 py-2.5 text-left font-normal  min-w-[160px]">{L('Categorie', 'Категория')}</th>
                      <th className="px-3 py-2.5 text-right font-normal ">{L('Preț', 'Цена')}</th>
                      <th className="px-3 py-2.5 text-right font-normal ">{L('Cant.', 'Кол-во')}</th>
                      <th className="px-3 py-2.5 text-left font-normal ">{L('Unit.', 'Ед.')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map(row => (
                      <tr
                        key={row.idx}
                        className={`border-t admin-border ${row.category ? 'hover:bg-gray-50/60' : 'bg-amber-50/40'}`}
                      >
                        <td className="px-3 py-1.5 font-mono admin-muted">{row.id}</td>
                        <td className="px-3 py-1.5 admin-ink">{row.name_ro}</td>
                        <td className="px-3 py-1.5 font-mono admin-muted text-[11px]">{row.sku}</td>
                        <td className="px-3 py-1.5 admin-muted">{row.brand}</td>
                        <td className="px-3 py-1.5">
                          <select
                            value={row.category}
                            onChange={e => setRowCategory(row.idx, e.target.value)}
                            className={`text-xs px-1.5 py-0.5 outline-none border rounded-none w-full max-w-[155px] ${
                              row.category
                                ? 'admin-border admin-surface admin-ink'
                                : 'border-amber-300 bg-amber-50 text-amber-700'
                            }`}
                          >
                            {!row.category && <option value="">{L('— alege —', '— выбрать —')}</option>}
                            {CATEGORY_OPTIONS.map(c => (
                              <option key={c.slug} value={c.slug}>{categoryLabel(c.slug)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono admin-ink">
                          {row.price.toLocaleString('ro-MD')}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono admin-muted">{row.qty.toLocaleString('ro-MD')}</td>
                        <td className="px-3 py-1.5 admin-muted">{row.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {importError && <p role="alert" className="mb-4 text-sm text-red-600">{importError}</p>}
            {importResult && (
              <div className={`mb-4 p-4 border flex items-center gap-3 ${
                importResult.failed === 0
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}>
                {importResult.failed === 0
                  ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                <p className="text-sm">
                  {L('Importat: ', 'Импортировано: ')}<strong>{importResult.ok}</strong>
                  {importResult.failed > 0 && (
                    <>, {L('erori: ', 'ошибок: ')}<strong className="text-red-600">{importResult.failed}</strong>{' '}
                    {L('(detalii în consola browserului)', '(подробности в консоли браузера)')}</>
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleImport}
                disabled={importing || readyCount === 0}
                className="flex items-center gap-2 admin-solid admin-on-solid px-8 py-3 text-sm   admin-hover-solid disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                {importing
                  ? L('Import...', 'Импорт...')
                  : L(`Importă ${readyCount} produse în Supabase`, `Импортировать ${readyCount} товаров в Supabase`)}
              </button>
              {noCatCount > 0 && (
                <p className="self-center text-xs admin-muted">
                  {L(
                    `${noCatCount} produs${noCatCount === 1 ? '' : 'e'} fără categorie — vor fi ignorate`,
                    `${noCatCount} товар${noCatCount === 1 ? '' : 'ов'} без категории — будут проигнорированы`,
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 'done' && importResult && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 admin-solid flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 admin-on-solid" />
            </div>
            <h2 className="text-2xl admin-ink mb-2">{L('Gata!', 'Готово!')}</h2>
            <p className="admin-muted mb-8">
              {L(
                `${importResult.ok} produse au fost încărcate în Supabase. Catalogul a fost actualizat.`,
                `${importResult.ok} товаров загружено в Supabase. Каталог обновлен.`,
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/catalog"
                className="admin-solid admin-on-solid px-8 py-3 text-sm   admin-hover-solid transition-colors"
              >
                {L('Deschide catalogul', 'Открыть каталог')}
              </a>
              <button
                onClick={() => { setStep('upload'); setRows([]); setImportResult(null); setFileName(''); }}
                className="border admin-border admin-hover-border px-6 py-3 text-sm transition-colors"
              >
                {L('Alt fișier', 'Другой файл')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
