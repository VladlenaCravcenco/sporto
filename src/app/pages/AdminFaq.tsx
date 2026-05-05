import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, ChevronDown, GripVertical, Eye, EyeOff, Sparkles, Info } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { FAQ_SEO_DEFAULTS, type FaqItem, newFaqItem } from '../../lib/faq';

const SQL_SETUP = `CREATE TABLE IF NOT EXISTS public.faq_items (
  id text PRIMARY KEY,
  question_ro text NOT NULL DEFAULT '',
  question_ru text NOT NULL DEFAULT '',
  answer_ro text NOT NULL DEFAULT '',
  answer_ru text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'faq_items' AND policyname = 'Allow all'
  ) THEN
    CREATE POLICY "Allow all" ON public.faq_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;

export function AdminFaq() {
  const { lang } = useAdminLang();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noTable, setNoTable] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const isRu = lang === 'ru';

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('relation') || error.code === '42P01' || error.code === 'PGRST200') {
        setNoTable(true);
        setItems([]);
      } else {
        toast(isRu ? `Ошибка загрузки: ${error.message}` : `Eroare la încărcare: ${error.message}`);
      }
    } else {
      setItems((data as FaqItem[]) ?? []);
      setNoTable(false);
    }
    setLoading(false);
  }, [isRu]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const normalized = items.map((item, index) => ({
        ...item,
        sort_order: index,
      }));
      const { data: existingRows, error: existingError } = await supabase
        .from('faq_items')
        .select('id');

      if (existingError) throw existingError;

      const nextIds = new Set(normalized.map((item) => item.id));
      const idsToDelete = ((existingRows as Array<{ id: string }> | null) ?? [])
        .map((row) => row.id)
        .filter((id) => !nextIds.has(id));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('faq_items')
          .delete()
          .in('id', idsToDelete);
        if (deleteError) throw deleteError;
      }

      const { error: upsertError } = await supabase
        .from('faq_items')
        .upsert(normalized);

      if (upsertError) throw upsertError;

      setItems(normalized);
      toast(isRu ? '✓ FAQ сохранён' : '✓ FAQ salvat');
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : (isRu ? 'Ошибка сохранения' : 'Eroare la salvare');
      toast(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = () => {
    if (items.length > 0) {
      const ok = window.confirm(isRu
        ? 'Уже есть вопросы. Добавить SEO-вопросы поверх?'
        : 'Există deja întrebări. Adăugați întrebările SEO?');
      if (!ok) return;
    }
    const seeded: FaqItem[] = FAQ_SEO_DEFAULTS.map((q, i) => ({
      ...q,
      id: `faq-seed-${Date.now()}-${i}`,
      sort_order: items.length + i,
    }));
    setItems(p => [...p, ...seeded]);
    toast(isRu ? '✓ 4 SEO-вопроса добавлены' : '✓ 4 întrebări SEO adăugate');
  };

  const addItem = () => {
    const it = newFaqItem(items.length);
    setItems(p => [...p, it]);
    setExpanded(it.id);
  };

  const removeItem = (id: string) => {
    setItems(p => p.filter(i => i.id !== id));
    toast(isRu ? 'Удалено' : 'Șters');
  };

  const updateItem = (id: string, key: keyof FaqItem, value: any) => {
    setItems(p => p.map(i => i.id === id ? { ...i, [key]: value } : i));
  };

  return (
    <div className="bg-black text-white min-h-[calc(100vh-48px)]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-[0.2em] mb-1">{isRu ? 'Контент · О нас' : 'Conținut · Despre noi'}</p>
            <h1 className="text-xl text-white">FAQ</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              onClick={handleSeed}
              title={isRu ? 'Загрузить 4 стартовых SEO-вопроса' : 'Încarcă 4 întrebări SEO de start'}
              className="flex h-9 w-full items-center justify-center gap-1.5 border border-white/20 px-3 text-xs text-gray-400 transition-colors hover:border-white/50 hover:text-white sm:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              SEO
            </button>
            <button onClick={addItem} className="flex h-9 w-full items-center justify-center gap-2 border border-white/20 px-4 text-xs uppercase tracking-wide text-gray-300 transition-colors hover:border-white/50 hover:text-white sm:w-auto">
              <Plus className="w-3.5 h-3.5" />
              {isRu ? 'Добавить' : 'Adaugă'}
            </button>
            <button onClick={handleSave} disabled={saving || noTable} className="flex w-full items-center justify-center gap-2 bg-white px-5 py-2 text-xs uppercase tracking-widest text-black transition-colors hover:bg-gray-100 disabled:opacity-40 sm:w-auto">
              <Save className="w-3.5 h-3.5" />
              {saving ? (isRu ? 'Сохранение...' : 'Salvare...') : (isRu ? 'Сохранить' : 'Salvează')}
            </button>
          </div>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-3 border border-white/10 bg-white/5 px-4 py-3 mb-6">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            {isRu
              ? 'FAQ хранится в Supabase и используется и в админке, и на странице «О нас». Здесь вы редактируете текущий список вопросов, который видит сайт.'
              : 'FAQ-ul este stocat în Supabase și folosit atât în admin, cât și pe pagina «Despre noi». Aici editați lista curentă de întrebări pe care o vede site-ul.'}
          </p>
        </div>

        {noTable && (
          <div className="border border-amber-500/20 bg-amber-500/10 px-4 py-4 mb-6">
            <p className="text-sm text-amber-200 mb-1">
              {isRu
                ? 'Таблица FAQ ещё не создана в Supabase.'
                : 'Tabela FAQ nu este încă creată în Supabase.'}
            </p>
            <p className="text-xs text-amber-100/80 mb-3">
              {isRu
                ? 'Запустите SQL ниже, после чего эта админка будет показывать и сохранять реальные вопросы с сайта.'
                : 'Rulați SQL-ul de mai jos, apoi acest panou va afișa și salva întrebările reale de pe site.'}
            </p>
            <button
              onClick={() => setShowSql((v) => !v)}
              className="w-full border border-amber-200/30 px-3 py-2 text-xs uppercase tracking-wider text-amber-100 transition-colors hover:border-amber-100/60 sm:w-auto"
            >
              {showSql
                ? (isRu ? 'Скрыть SQL' : 'Ascunde SQL')
                : (isRu ? 'Показать SQL' : 'Arată SQL')}
            </button>
            {showSql && (
              <pre className="mt-3 p-3 bg-black/30 border border-white/10 text-[11px] text-amber-50 overflow-x-auto whitespace-pre-wrap">{SQL_SETUP}</pre>
            )}
          </div>
        )}

        {loading ? (
          <div className="border border-white/10 bg-white/5 px-8 py-16 text-center text-sm text-gray-500">
            {isRu ? 'Загрузка FAQ...' : 'Se încarcă FAQ...'}
          </div>
        ) : items.length === 0 ? (
          <div className="border border-white/10 bg-white/5 px-8 py-16 text-center">
            <p className="text-gray-500 text-sm mb-6">{isRu ? 'Вопросов пока нет' : 'Nicio întrebare încă'}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleSeed}
                className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-xs uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isRu ? 'Загрузить SEO-вопросы (4 шт)' : 'Încarcă întrebări SEO (4 buc)'}
              </button>
              <button onClick={addItem} className="inline-flex items-center gap-2 border border-white/20 text-gray-300 hover:text-white px-5 py-2.5 text-xs uppercase tracking-wide transition-colors">
                <Plus className="w-3.5 h-3.5" />
                {isRu ? 'Добавить вручную' : 'Adaugă manual'}
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-4 max-w-sm mx-auto">
              {isRu
                ? 'SEO-вопросы подобраны под поисковые запросы по спортивному оборудованию в Молдове'
                : 'Întrebările SEO sunt selectate pentru căutări de echipamente sportive în Moldova'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, idx) => {
              const isOpen = expanded === item.id;
              const displayQ = isRu ? item.question_ru || item.question_ro : item.question_ro || item.question_ru;
              return (
                <div key={item.id} className={`border transition-colors ${isOpen ? 'border-white/30 bg-white/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 w-4 h-4 cursor-grab flex-shrink-0 text-gray-700" />
                      <span className="w-5 flex-shrink-0 text-[10px] text-gray-600">{(idx + 1).toString().padStart(2, '0')}</span>
                      <button onClick={() => setExpanded(isOpen ? null : item.id)} className="min-w-0 flex-1 text-left">
                        <span className={`block text-sm ${displayQ ? 'text-white' : 'text-gray-600 italic'} break-words sm:truncate`}>
                          {displayQ || (isRu ? '(без текста)' : '(fără text)')}
                        </span>
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-1 border-t border-white/10 pt-2 sm:mt-0 sm:border-t-0 sm:pt-0">
                      <button onClick={() => updateItem(item.id, 'active', !item.active)} className="flex-shrink-0 p-1 text-gray-500 transition-colors hover:text-white" aria-label={item.active ? 'Hide FAQ item' : 'Show FAQ item'}>
                        {item.active ? <Eye className="w-3.5 h-3.5 text-white/60" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => removeItem(item.id)} className="flex-shrink-0 p-1 text-gray-600 transition-colors hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setExpanded(isOpen ? null : item.id)} className="flex-shrink-0 p-1 text-gray-600 transition-colors hover:text-white">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Вопрос RO' : 'Întrebare RO'}</label>
                          <input value={item.question_ro} onChange={e => updateItem(item.id, 'question_ro', e.target.value)}
                            className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white focus:border-white focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Вопрос RU' : 'Întrebare RU'}</label>
                          <input value={item.question_ru} onChange={e => updateItem(item.id, 'question_ru', e.target.value)}
                            className="w-full h-9 bg-black border border-white/20 px-3 text-sm text-white focus:border-white focus:outline-none transition-colors" />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Ответ RO' : 'Răspuns RO'}</label>
                          <textarea value={item.answer_ro} onChange={e => updateItem(item.id, 'answer_ro', e.target.value)} rows={3}
                            className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white focus:border-white focus:outline-none transition-colors resize-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">{isRu ? 'Ответ RU' : 'Răspuns RU'}</label>
                          <textarea value={item.answer_ru} onChange={e => updateItem(item.id, 'answer_ru', e.target.value)} rows={3}
                            className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white focus:border-white focus:outline-none transition-colors resize-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={addItem} className="w-full border border-dashed border-white/15 py-3 text-xs text-gray-600 hover:text-gray-400 hover:border-white/30 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              {isRu ? 'Добавить вопрос' : 'Adaugă întrebare'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
