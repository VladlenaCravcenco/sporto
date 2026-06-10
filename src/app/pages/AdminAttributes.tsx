import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCategories } from '../contexts/CategoriesContext';
import { useAdminLang } from '../contexts/AdminLangContext';
import type { ProductAttributeDefinition, ProductAttributeType } from '../hooks/useProductAttributes';

const EMPTY: Omit<ProductAttributeDefinition, 'id'> = {
  code: '',
  name_ro: '',
  name_ru: '',
  value_type: 'number',
  unit: '',
  options: [],
  category_ids: [],
  filter_enabled: true,
  specification_enabled: true,
  sort_order: 0,
  active: true,
};

export function AdminAttributes() {
  const { lang } = useAdminLang();
  const l = (ro: string, ru: string) => lang === 'ru' ? ru : ro;
  const categories = useCategories();
  const [rows, setRows] = useState<ProductAttributeDefinition[]>([]);
  const [form, setForm] = useState<Omit<ProductAttributeDefinition, 'id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data } = await supabase.from('product_attributes').select('*').order('sort_order').order('name_ro');
    setRows((data as ProductAttributeDefinition[] | null) ?? []);
  };

  useEffect(() => { load(); }, []);

  const edit = (row: ProductAttributeDefinition) => {
    const { id, ...next } = row;
    setEditId(id);
    setForm(next);
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      ...form,
      code: editId ? form.code : `attribute_${crypto.randomUUID().replaceAll('-', '')}`,
      unit: form.unit?.trim() || null,
      options: form.value_type === 'select'
        ? (form.options ?? []).map((option) => option.trim()).filter(Boolean)
        : [],
    };
    const { error } = editId
      ? await supabase.from('product_attributes').update(payload).eq('id', editId)
      : await supabase.from('product_attributes').insert(payload);
    setMessage(error ? error.message : l('Caracteristica a fost salvată', 'Характеристика сохранена'));
    if (!error) {
      setOpen(false);
      setEditId(null);
      setForm(EMPTY);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm(l('Ștergeți caracteristica?', 'Удалить характеристику?'))) return;
    await supabase.from('product_attributes').delete().eq('id', id);
    load();
  };

  const toggleCategory = (categoryId: string) => {
    setForm((current) => ({
      ...current,
      category_ids: current.category_ids.includes(categoryId)
        ? current.category_ids.filter((id) => id !== categoryId)
        : [...current.category_ids, categoryId],
    }));
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl text-gray-900">{l('Caracteristici și filtre', 'Характеристики и фильтры')}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {l('Configurați câmpurile disponibile pentru fiecare categorie.', 'Настройте поля, доступные для каждой категории.')}
          </p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(EMPTY); setOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 !text-xs uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          {l('Caracteristică nouă', 'Новая характеристика')}
        </button>
      </div>

      {message && <div className="mb-4 border border-gray-200 bg-white px-4 py-3 text-xs">{message}</div>}

      <div className="border border-gray-200 bg-white">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            {l('Nu există caracteristici. Rulați migrarea SQL și creați prima caracteristică.', 'Характеристик пока нет. Запустите SQL-миграцию и создайте первую.')}
          </div>
        ) : rows.map((row) => (
          <div key={row.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
            <button onClick={() => edit(row)} className="flex-1 text-left min-w-0">
              <div className="text-sm text-gray-900">{lang === 'ru' ? row.name_ru : row.name_ro}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {row.value_type}{row.unit ? ` · ${row.unit}` : ''} · {row.category_ids.length} cat.
              </div>
            </button>
            <span className={`text-[10px] px-2 py-1 ${row.filter_enabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
              {l('Filtru', 'Фильтр')}
            </span>
            <button onClick={() => remove(row.id)} className="text-gray-300 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto p-5 sm:p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg">{editId ? l('Editare', 'Редактирование') : l('Caracteristică nouă', 'Новая характеристика')}</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nume RO" placeholder="De ex.: Greutatea maximă a utilizatorului" value={form.name_ro} onChange={(name_ro) => setForm({ ...form, name_ro })} />
                <Field label="Название RU" placeholder="Например: Максимальный вес пользователя" value={form.name_ru} onChange={(name_ru) => setForm({ ...form, name_ru })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500">
                  {l('Tip valoare', 'Тип значения')}
                  <select
                    value={form.value_type}
                    onChange={(event) => {
                      const value_type = event.target.value as ProductAttributeType;
                      setForm({
                        ...form,
                        value_type,
                        unit: value_type === 'number' ? form.unit : '',
                        options: value_type === 'select' ? form.options : [],
                      });
                    }}
                    className="mt-1 w-full h-10 border border-gray-200 px-3 text-sm bg-white"
                  >
                    <option value="number">{l('Număr / interval', 'Число / диапазон')}</option>
                    <option value="select">{l('Listă de valori', 'Список значений')}</option>
                    <option value="boolean">{l('Da / Nu', 'Да / Нет')}</option>
                    <option value="text">{l('Text fără filtru', 'Текст без фильтра')}</option>
                  </select>
                </label>
                {form.value_type === 'number' ? (
                  <Field label={l('Unitate', 'Единица')} placeholder={l('De ex.: kg, cm, W', 'Например: кг, см, Вт')} value={form.unit ?? ''} onChange={(unit) => setForm({ ...form, unit })} />
                ) : form.value_type === 'select' ? (
                  <Field
                    label={l('Valori separate prin virgulă', 'Варианты через запятую')}
                    placeholder={l('De ex.: Oțel, Cauciuc, Plastic', 'Например: Сталь, Резина, Пластик')}
                    value={(form.options ?? []).join(',')}
                    onChange={(value) => setForm({
                      ...form,
                      options: value.split(','),
                    })}
                  />
                ) : (
                  <label className="text-xs text-gray-500">
                    {l('Valoare', 'Значение')}
                    <input
                      readOnly
                      placeholder={
                        form.value_type === 'boolean'
                          ? l('Da sau Nu', 'Да или Нет')
                          : l('De ex.: Motor cu curent alternativ', 'Например: Двигатель переменного тока')
                      }
                      className="mt-1 w-full h-10 border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400"
                    />
                  </label>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">{l('Categorii', 'Категории')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 border border-gray-100 px-3 py-2 text-xs">
                      <input type="checkbox" checked={form.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                      {category.name[lang]}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.specification_enabled} onChange={(event) => setForm({ ...form, specification_enabled: event.target.checked })} />
                {l('Afișează în caracteristicile produsului', 'Показывать в характеристиках товара')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.filter_enabled} disabled={form.value_type === 'text'} onChange={(event) => setForm({ ...form, filter_enabled: event.target.checked })} />
                {l('Afișează ca filtru în catalog', 'Показывать как фильтр в каталоге')}
              </label>
              <button onClick={save} className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 !text-xs uppercase tracking-wider">
                <Save className="w-4 h-4" />
                {l('Salvează', 'Сохранить')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="text-xs text-gray-500">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full h-10 border border-gray-200 px-3 text-sm"
      />
    </label>
  );
}
