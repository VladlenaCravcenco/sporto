import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase, fetchAllSupabaseRows } from '../../lib/supabase';
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

export function AdminHub() {
  const { t, lang } = useAdminLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Price list export state ───────────────────────────────────────────────
  const [exporting, setExporting]           = useState(false);
  const [exportLang, setExportLang]         = useState<'ro' | 'ru' | 'both'>('both');
  const [exportActive, setExportActive]     = useState(true);
  const [exportCategory, setExportCategory] = useState('all');
  const [categories, setCategories]         = useState<{ id: string; slug: string; name_ro: string }[]>([]);

  useEffect(() => {
    (async () => {
      const data = await fetchAllSupabaseRows<{ active: boolean; featured: boolean; image_url: string | null; qty: number | null }>((from, to) =>
        supabase
          .from('products')
          .select('active, featured, image_url, qty')
          .range(from, to)
      );
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

      const data = await fetchAllSupabaseRows((from, to) => {
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

  // ── All modules (flat) ────────────────────────────────────────────────────
  const modules = [
    { to: '/admin/attributes', icon: <Settings className="w-6 h-6" />, title: lang === 'ru' ? 'Характеристики' : 'Caracteristici', desc: lang === 'ru' ? 'Параметры товаров и фильтры' : 'Parametri și filtre pentru produse', stat: '—', statBad: null, primary: false },
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

  const groups = [
    { title: t.hub.tabClients, routes: ['requests', 'clients'] },
    { title: t.hub.tabProducts, routes: ['products', 'brands', 'categories', 'attributes', 'featured', 'import'] },
    { title: t.hub.tabContent, routes: ['banners', 'contacts', 'popup', 'faq', 'services', 'maintenance', 'content-pages'] },
  ];

  return <div className="admin-dashboard">
    <div className="admin-dashboard-heading">
      <div><p className="admin-eyebrow">Sportosfera S.R.L.</p><h1>{lang === 'ru' ? 'Рабочая панель' : 'Panou de administrare'}</h1><p>{lang === 'ru' ? 'Заявки, каталог и содержание сайта — в одном месте.' : 'Cereri, catalog și conținutul site-ului într-un singur loc.'}</p></div>
      <Link to="/admin/requests" className="admin-primary-link"><ClipboardList size={16} />{lang === 'ru' ? 'Открыть заявки' : 'Deschide cererile'}</Link>
    </div>
    <div className="admin-stats">
      {[
        { label: t.hub.totalLabel, value: stats?.total, icon: <Box size={16} /> },
        { label: t.hub.activeLabel, value: stats?.active, icon: <Eye size={16} /> },
        { label: t.hub.featuredLabel, value: stats?.featured, icon: <Star size={16} /> },
        { label: t.hub.noImageLabel, value: stats?.noImage, icon: <AlertCircle size={16} />, warn: true },
      ].map(stat => <div className={`admin-stat ${stat.warn && stat.value ? 'has-warning' : ''}`} key={stat.label}>
        <span>{stat.label}{stat.icon}</span><strong>{loadingStats ? '—' : stat.value ?? 0}</strong>
      </div>)}
    </div>
    <div className="admin-module-groups">
      {groups.map(group => <section className="admin-module-group" key={group.title}>
        <h2>{group.title}</h2>
        {group.routes.map(route => {
          const item = modules.find(module => module.to === `/admin/${route}`)!;
          return <Link className="admin-module-link" to={item.to} key={item.to}>
            <span className="admin-module-icon">{item.icon}</span>
            <span><strong>{item.title}</strong><small>{item.stat !== '—' ? item.stat : item.desc}</small>{item.statBad && <small className="admin-module-warning">{item.statBad}</small>}</span>
            <TrendingUp size={14} className="admin-module-arrow" />
          </Link>;
        })}
      </section>)}
    </div>
    <details className="admin-export">
      <summary><Download size={17} /><span>{lang === 'ru' ? 'Экспорт прайс-листа' : 'Exportă lista de prețuri'}</span><small>Excel .xlsx</small><ChevronDown size={16} /></summary>
      <div className="admin-export-fields">
        <label>{lang === 'ru' ? 'Язык' : 'Limba'}<select value={exportLang} onChange={e => setExportLang(e.target.value as 'both' | 'ru' | 'ro')}>
          <option value="both">{lang === 'ru' ? 'Оба языка' : 'Ambele limbi'}</option><option value="ru">Русский</option><option value="ro">Română</option>
        </select></label>
        <label>{lang === 'ru' ? 'Категория' : 'Categoria'}<select value={exportCategory} onChange={e => setExportCategory(e.target.value)}>
          <option value="all">{lang === 'ru' ? 'Все категории' : 'Toate categoriile'}</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name_ro}</option>)}
        </select></label>
        <label className="admin-export-check"><input type="checkbox" checked={exportActive} onChange={e => setExportActive(e.target.checked)} />{lang === 'ru' ? 'Только активные' : 'Doar active'}</label>
        <button onClick={handleExport} disabled={exporting} className="admin-primary-link">{exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}{exporting ? (lang === 'ru' ? 'Подготовка…' : 'Se pregătește…') : (lang === 'ru' ? 'Скачать Excel' : 'Descarcă Excel')}</button>
      </div>
    </details>
    <p className="admin-dashboard-note">{lang === 'ru' ? 'Сохранённые изменения используются на сайте. Перед удалением проверьте выбранные записи.' : 'Modificările salvate sunt folosite pe site. Verifică înregistrările selectate înainte de ștergere.'}</p>
  </div>;
}
