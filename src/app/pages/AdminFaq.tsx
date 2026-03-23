import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, ChevronDown, Eye, EyeOff, Sparkles, Loader2, GripVertical, Check } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface FaqItem {
  id: string;
  question_ro: string;
  question_ru: string;
  answer_ro: string;
  answer_ru: string;
  sort_order: number;
  active: boolean;
  isNew?: boolean;
}

function newItem(order: number): FaqItem {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question_ro: '',
    question_ru: '',
    answer_ro: '',
    answer_ru: '',
    sort_order: order,
    active: true,
    isNew: true,
  };
}

async function loadFaq(): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data as FaqItem[];
}

async function saveFaq(items: FaqItem[]): Promise<void> {
  const normalized = items.map((i, idx) => ({
    id: i.isNew ? undefined : i.id,
    question_ro: i.question_ro,
    question_ru: i.question_ru,
    answer_ro: i.answer_ro,
    answer_ru: i.answer_ru,
    sort_order: idx,
    active: i.active,
  }));

  const existing = normalized.filter(i => i.id);
  const fresh = normalized.filter(i => !i.id);

  if (existing.length > 0) {
    const { error } = await supabase
      .from('faq_items')
      .upsert(existing, { onConflict: 'id' });

    if (error) throw error;
  }

  if (fresh.length > 0) {
    const { error } = await supabase
      .from('faq_items')
      .insert(fresh);

    if (error) throw error;
  }
}

async function deleteFromDb(id: string): Promise<void> {
  if (id.startsWith('new-')) return;

  const { error } = await supabase
    .from('faq_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function generateFaqItems(existing: FaqItem[], count = 4) {
  const existingQ = existing.map(i => i.question_ro).filter(Boolean).join('\n');

  const prompt = `Сгенерируй ${count} FAQ (RO + RU) JSON массив`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '[]';
  const clean = text.replace(/```json|```/g, '').trim();

  return JSON.parse(clean);
}

export function AdminFaq() {
  const { lang } = useAdminLang();
  const isRu = lang === 'ru';

  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  useEffect(() => {
    loadFaq().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const update = (id: string, key: keyof FaqItem, value: any) => {
    setItems(p => p.map(i => i.id === id ? { ...i, [key]: value } : i));
    setDirty(true);
  };

  const addItem = () => {
    const it = newItem(items.length);
    setItems(p => [...p, it]);
    setExpanded(it.id);
    setDirty(true);
  };

  const removeItem = async (id: string) => {
    if (!window.confirm(isRu ? 'Удалить?' : 'Ștergi?')) return;

    try {
      await deleteFromDb(id);
      setItems(p => p.filter(i => i.id !== id));
      toast('✓');
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await saveFaq(items);
      const fresh = await loadFaq();
      setItems(fresh);
      setDirty(false);
      toast('✓ saved');
    } catch (e: any) {
      toast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const generated = await generateFaqItems(items);

      const newItems: FaqItem[] = generated.map((g: any, i: number) => ({
        ...g,
        id: `new-${Date.now()}-${i}`,
        sort_order: items.length + i,
        active: true,
        isNew: true,
      }));

      setItems(p => [...p, ...newItems]);
      setDirty(true);
    } catch (e) {
      toast('AI error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDragStart = (i: number) => { dragItem.current = i; };
  const handleDragEnter = (i: number) => { dragOver.current = i; };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;

    const arr = [...items];
    const [moved] = arr.splice(dragItem.current, 1);
    arr.splice(dragOver.current, 0, moved);

    setItems(arr.map((it, idx) => ({ ...it, sort_order: idx })));

    dragItem.current = null;
    dragOver.current = null;
    setDirty(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={addItem}>+</button>
      <button onClick={handleSave} disabled={!dirty || saving}>save</button>

      {items.map((item, idx) => (
        <div key={item.id} draggable
          onDragStart={() => handleDragStart(idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragEnd={handleDragEnd}
        >
          <input
            value={item.question_ro}
            onChange={e => update(item.id, 'question_ro', e.target.value)}
          />
          <button onClick={() => removeItem(item.id)}>x</button>
        </div>
      ))}
    </div>
  );
}