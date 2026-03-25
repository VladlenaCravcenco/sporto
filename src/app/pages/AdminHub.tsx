import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
// npm install exceljs
import ExcelJS from 'exceljs';
import {
  Package, Star, Upload,
  TrendingUp, AlertCircle, Eye, Box, Layers, FolderOpen,
  Download, ChevronDown, Check, Loader2,
  Users, ClipboardList, Phone, Megaphone, HelpCircle, Wrench, Settings, FileText,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  noImage: number;
  outOfStock: number;
}

// ── Грузим ВСЕ строки чанками по 1000 (обходим лимит Supabase) ──────────────
const fetchAllChunked = async (buildQuery: (from: number, to: number) => any): Promise<any[]> => {
  const chunkSize = 1000;
  let offset = 0;
  let allData: any[] = [];

  while (true) {
    const { data, error } = await buildQuery(offset, offset + chunkSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < chunkSize) break; // последний чанк
    offset += chunkSize;
  }

  return allData;
};

export function AdminHub() {
  const { t, lang } = useAdminLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Price list export state ───────────────────────────────────────────────
  const [exporting, setExporting]           = useState(false);
  const [exportLang, setExportLang]         = useState<'ro' | 'ru' | 'both'>('both');
  const [exportActive, setExportActive]     = useState(true);
  const [exportCategory, setExportCategory] = useState('all');
  const [catOpen, setCatOpen]               = useState(false);
  const [categories, setCategories]         = useState<{ id: string; slug: string; name_ro: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('active, featured, image_url, qty');
      if (data) {
        const rows = data as { active: boolean; featured: boolean; image_url: string | null; qty: number | null }[];
        setStats({
          total:      rows.length,
          active:     rows.filter(r => r.active).length,
          inactive:   rows.filter(r => !r.active).length,
          featured:   rows.filter(r => r.featured).length,
          noImage:    rows.filter(r => !r.image_url).length,
          outOfStock: rows.filter(r => !r.qty || r.qty === 0).length,
        });
      }
      setLoadingStats(false);
    })();
  }, []);

  // ── Загружаем категории с slug ────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, slug, name_ro')
      .order('name_ro')
      .then(({ data }) => {
        if (data) setCategories(data as { id: string; slug: string; name_ro: string }[]);
      });
  }, []);

  // ── Экспорт ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const categorySlug =
        exportCategory !== 'all'
          ? categories.find(c => c.id === exportCategory)?.slug
          : null;

      const categoryLabel = exportCategory !== 'all'
        ? categories.find(c => c.id === exportCategory)?.name_ro || exportCategory
        : (lang === 'ru' ? 'Все категории' : 'Toate categoriile');

      const data = await fetchAllChunked((from, to) => {
        let q = supabase
          .from('products')
          .select('id, sku, name_ro, name_ru, category, subcategory, brand, price, qty, active')
          .range(from, to);
        if (exportActive) q = q.eq('active', true);
        if (categorySlug) q = q.eq('category', categorySlug);
        return q;
      });

      if (!data.length) throw new Error('Нет данных после фильтрации');

      // ── Колонки ────────────────────────────────────────────────────────────
      type ColDef = { key: string; header: string; width: number };
      const baseCols: ColDef[] = [
        { key: 'num',      header: '№',           width: 6  },
        { key: 'sku',      header: 'Артикул',      width: 16 },
        { key: 'category', header: 'Категория',    width: 22 },
        { key: 'brand',    header: 'Бренд',        width: 14 },
        { key: 'price',    header: 'Цена (MDL)',   width: 14 },
        { key: 'qty',      header: 'В наличии',    width: 12 },
      ];
      const nameCols: ColDef[] =
        exportLang === 'ro'  ? [{ key: 'name_ro', header: 'Наименование (RO)', width: 50 }] :
        exportLang === 'ru'  ? [{ key: 'name_ru', header: 'Наименование (RU)', width: 50 }] :
        [
          { key: 'name_ro', header: 'Наименование (RO)', width: 50 },
          { key: 'name_ru', header: 'Наименование (RU)', width: 50 },
        ];
      // вставить колонки с наименованием после бренда
      const cols: ColDef[] = [
        ...baseCols.slice(0, 4),
        ...nameCols,
        ...baseCols.slice(4),
      ];

      // ── ExcelJS ────────────────────────────────────────────────────────────
      const wb = new ExcelJS.Workbook();
      wb.creator  = 'Sportosfera Admin';
      wb.created  = new Date();
      const ws    = wb.addWorksheet('Прайс-лист');

      // Ширины колонок
      ws.columns = cols.map(c => ({ width: c.width }));

      // ── Строка 1: заголовок компании ───────────────────────────────────────
      const titleRow = ws.addRow(['Sportosfera S.R.L. — Прайс-лист']);
      ws.mergeCells(1, 1, 1, cols.length);
      titleRow.height = 28;
      const titleCell = titleRow.getCell(1);
      titleCell.font      = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      // ── Строка 2: мета ─────────────────────────────────────────────────────
      const metaText = [
        new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        `Категория: ${categoryLabel}`,
        `Товаров: ${data.length}`,
      ].join('   ·   ');
      const metaRow = ws.addRow([metaText]);
      ws.mergeCells(2, 1, 2, cols.length);
      metaRow.height = 18;
      const metaCell = metaRow.getCell(1);
      metaCell.font      = { name: 'Arial', size: 9, color: { argb: 'FFAAAAAA' } };
      metaCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
      metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      // ── Строка 3: заголовки колонок ────────────────────────────────────────
      const headerRow = ws.addRow(cols.map(c => c.header));
      headerRow.height = 22;
      headerRow.eachCell(cell => {
        cell.font      = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border    = { bottom: { style: 'thin', color: { argb: 'FF333333' } } };
      });

      // Заморозить до строки 4
      ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

      // ── Данные ─────────────────────────────────────────────────────────────
      const BG_ODD  = 'FFFAFAFA';
      const BG_EVEN = 'FFFFFFFF';

      data.forEach((p, i) => {
        const rowData = cols.map(c => {
          if (c.key === 'num')      return i + 1;
          if (c.key === 'sku')      return p.sku || `ID-${p.id}`;
          if (c.key === 'category') return p.category || '—';
          if (c.key === 'brand')    return p.brand || '—';
          if (c.key === 'name_ro')  return p.name_ro || '';
          if (c.key === 'name_ru')  return p.name_ru || p.name_ro || '';
          if (c.key === 'price')    return Number(p.price) || 0;
          if (c.key === 'qty')      return p.qty ? `${p.qty} шт` : '—';
          return '';
        });

        const row = ws.addRow(rowData);
        row.height = 16;
        const bgColor = i % 2 === 0 ? BG_ODD : BG_EVEN;

        row.eachCell((cell, colNumber) => {
          cell.font      = { name: 'Arial', size: 9 };
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.alignment = { vertical: 'middle' };
          cell.border    = { bottom: { style: 'hair', color: { argb: 'FFE5E5E5' } } };

          // Цена — выравниваем по правому краю
          const colKey = cols[colNumber - 1]?.key;
          if (colKey === 'price' || colKey === 'num') {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          }
          // Цена — формат числа
          if (colKey === 'price') {
            cell.numFmt = '#,##0.00';
          }
        });
      });

      // ── Строка ИТОГО ───────────────────────────────────────────────────────
      ws.addRow([]); // пустая строка-отступ
      const totalRow = ws.addRow(['ИТОГО:', data.length, lang === 'ru' ? 'позиций' : 'poziții']);
      totalRow.height = 18;
      totalRow.eachCell(cell => {
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        cell.alignment = { vertical: 'middle' };
      });

      // ── Скачать ────────────────────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      const slugForFilename = categorySlug || 'all';
      link.download = `sportosfera-${slugForFilename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (err: any) {
      alert('Ошибка при выгрузке: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const catLabel = exportCategory === 'all'
    ? (lang === 'ru' ? 'Все категории' : 'Toate categoriile')
    : (categories.find(c => c.id === exportCategory)?.name_ro || exportCategory);

  // ── All modules (flat) ────────────────────────────────────────────────────
  const modules = [
    { to: '/admin/requests',    icon: <ClipboardList className="w-6 h-6" />, title: t.hub.requestsTitle,   desc: t.hub.requestsDesc,   stat: '—',                                                              statBad: null,                                                                        primary: true  },
    { to: '/admin/clients',     icon: <Users         className="w-6 h-6" />, title: t.hub.clientsTitle,    desc: t.hub.clientsDesc,    stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/products',    icon: <Package       className="w-6 h-6" />, title: t.hub.productsTitle,   desc: t.hub.productsDesc,   stat: stats ? `${stats.active} ${t.hub.activeLabel}` : '—',             statBad: stats && stats.inactive > 0 ? `${stats.inactive} ${t.hub.inactiveLabel}` : null, primary: false },
    { to: '/admin/brands',      icon: <Box           className="w-6 h-6" />, title: t.hub.brandsTitle,     desc: t.hub.brandsDesc,     stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/categories',  icon: <FolderOpen    className="w-6 h-6" />, title: t.hub.categoriesTitle, desc: t.hub.categoriesDesc, stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/featured',    icon: <Star          className="w-6 h-6" />, title: t.hub.featuredTitle,   desc: t.hub.featuredDesc,   stat: stats ? `${stats.featured} ${t.hub.featuredLabel}` : '—',         statBad: null,                                                                        primary: false },
    { to: '/admin/import',      icon: <Upload        className="w-6 h-6" />, title: t.hub.importTitle,     desc: t.hub.importDesc,     stat: stats ? `${stats.total} ${t.hub.totalLabel.toLowerCase()}` : '—', statBad: null,                                                                        primary: false },
    { to: '/admin/banners',     icon: <Layers        className="w-6 h-6" />, title: t.hub.bannersTitle,    desc: t.hub.bannersDesc,    stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/contacts',    icon: <Phone         className="w-6 h-6" />, title: t.hub.contactsTitle,   desc: t.hub.contactsDesc,   stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/popup',       icon: <Megaphone     className="w-6 h-6" />, title: t.hub.popupTitle,      desc: t.hub.popupDesc,      stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/faq',         icon: <HelpCircle    className="w-6 h-6" />, title: t.hub.faqTitle,        desc: t.hub.faqDesc,        stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/services',    icon: <Wrench        className="w-6 h-6" />, title: t.hub.servicesTitle,   desc: t.hub.servicesDesc,   stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/maintenance', icon: <Settings      className="w-6 h-6" />, title: t.hub.maintenanceTitle, desc: t.hub.maintenanceDesc, stat: '—',                                                              statBad: null,                                                                        primary: false },
    { to: '/admin/content-pages', icon: <FileText    className="w-6 h-6" />, title: t.hub.contentPagesTitle, desc: t.hub.contentPagesDesc, stat: '—',                                                            statBad: null,                                                                        primary: false },
  ];

  return (
    <div className="bg-black text-white min-h-[calc(100vh-48px)]">

      {/* Pattern */}
      <svg className="fixed inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-hub" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-hub)" />
      </svg>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="mb-10">
          <p className="text-xs text-gray-600 uppercase tracking-[0.2em] mb-2">Sportosfera S.R.L.</p>
          <h1 className="text-2xl text-white">{t.hub.statsTitle}</h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 mb-8 border border-white/10">
          {[
            { label: t.hub.totalLabel,    value: stats?.total,    icon: <Box         className="w-3.5 h-3.5" /> },
            { label: t.hub.activeLabel,   value: stats?.active,   icon: <Eye         className="w-3.5 h-3.5" /> },
            { label: t.hub.featuredLabel, value: stats?.featured, icon: <Star        className="w-3.5 h-3.5" /> },
            { label: t.hub.noImageLabel,  value: stats?.noImage,  icon: <AlertCircle className="w-3.5 h-3.5" />, warn: true },
          ].map(s => (
            <div key={s.label} className="bg-black/80 px-5 py-4">
              <div className={`flex items-center gap-1.5 mb-2 ${s.warn && s.value ? 'text-amber-500' : 'text-gray-600'}`}>
                {s.icon}
                <span className="text-[10px] uppercase tracking-widest">{s.label}</span>
              </div>
              <div className={`text-2xl tabular-nums ${s.warn && s.value ? 'text-amber-400' : 'text-white'}`}>
                {loadingStats ? <span className="text-gray-700">—</span> : s.value ?? 0}
              </div>
            </div>
          ))}
        </div>

        {/* ── PRICE LIST EXPORT ─────────────────────────────────────────────── */}
        <div className="mb-8 border border-white/20 bg-white/5">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <div className="w-8 h-8 bg-white/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-white uppercase tracking-wider">
                {lang === 'ru' ? 'Выгрузить прайс-лист' : 'Exportă lista de prețuri'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {lang === 'ru' ? 'Актуальные данные из базы · Excel (.xlsx)' : 'Date actuale din bază · Excel (.xlsx)'}
              </p>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-wrap items-center gap-3">
            {/* Language */}
            <div className="flex items-center gap-1">
              {(['both', 'ru', 'ro'] as const).map(l => (
                <button key={l} onClick={() => setExportLang(l)}
                  className={`px-3 py-1.5 text-[11px] uppercase tracking-wider border transition-colors ${exportLang === l ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-white'}`}>
                  {l === 'both' ? (lang === 'ru' ? 'Оба яз.' : 'Ambele') : l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-white/10" />
            {/* Active only */}
            <button onClick={() => setExportActive(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-wider border transition-colors ${exportActive ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-white'}`}>
              {exportActive && <Check className="w-3 h-3" />}
              {lang === 'ru' ? 'Только активные' : 'Doar active'}
            </button>
            <div className="w-px h-5 bg-white/10" />
            {/* Category */}
            <div className="relative">
              <button onClick={() => setCatOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-wider border border-white/20 text-gray-400 hover:border-white/50 hover:text-white transition-colors">
                <span className="max-w-[160px] truncate">{catLabel}</span>
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/20 z-50 shadow-2xl min-w-[200px] max-h-60 overflow-y-auto">
                  {[{ id: 'all', slug: 'all', name_ro: lang === 'ru' ? 'Все категории' : 'Toate categoriile' }, ...categories].map(c => (
                    <button key={c.id} onClick={() => { setExportCategory(c.id); setCatOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[11px] flex items-center justify-between hover:bg-white/10 transition-colors ${exportCategory === c.id ? 'text-white' : 'text-gray-400'}`}>
                      <span>{c.name_ro}</span>
                      {exportCategory === c.id && <Check className="w-3 h-3 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1" />
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 bg-white text-black px-5 py-2 text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {exporting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{lang === 'ru' ? 'Генерация...' : 'Generare...'}</>
                : <><Download className="w-3.5 h-3.5" />{lang === 'ru' ? 'Скачать Excel' : 'Descarcă Excel'}</>
              }
            </button>
          </div>
        </div>

        {/* ── MODULE CARDS ──────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map(m => (
            <Link key={m.to} to={m.to}
              className={`group border transition-all duration-200 flex flex-col p-6 hover:border-white ${
                m.primary ? 'border-white bg-white text-black' : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-11 h-11 flex items-center justify-center ${m.primary ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                  {m.icon}
                </div>
                <TrendingUp className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${m.primary ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <h2 className={`text-sm uppercase tracking-wider mb-2 ${m.primary ? 'text-black' : 'text-white'}`}>
                {m.title}
              </h2>
              <p className={`text-xs leading-relaxed flex-1 mb-5 ${m.primary ? 'text-gray-600' : 'text-gray-500'}`}>
                {m.desc}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${m.primary ? 'text-gray-500' : 'text-gray-600'}`}>
                  {loadingStats ? '—' : m.stat}
                </span>
                {m.statBad && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-xs text-red-400">{m.statBad}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Connection note */}
        <div className="mt-8 border border-white/10 px-5 py-4 flex gap-3">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-400">
              {lang === 'ru' ? 'Всё подключено в реальном времени с сайтом.' : 'Totul este conectat live cu site-ul.'}
            </strong>{' '}
            {lang === 'ru'
              ? 'Любое изменение, сохранённое в панели администратора, немедленно отображается на сайте для посетителей.'
              : 'Orice modificare salvată în panou apare imediat pe site pentru vizitatori.'}
          </p>
        </div>
      </div>
    </div>
  );
}
