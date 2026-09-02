import { useEffect, useMemo, useState } from 'react';
import { fetchAllSupabaseRows, supabase } from '../../lib/supabase';

export type ProductAttributeType = 'number' | 'select' | 'boolean' | 'text';

export interface ProductAttributeDefinition {
  id: string;
  code: string;
  name_ro: string;
  name_ru: string;
  value_type: ProductAttributeType;
  unit: string | null;
  unit_ro: string | null;
  unit_ru: string | null;
  options: string[];
  category_ids: string[];
  filter_enabled: boolean;
  specification_enabled: boolean;
  sort_order: number;
  active: boolean;
}

export interface ProductAttributeValue {
  product_id: string;
  attribute_id: string;
  numeric_value: number | null;
  text_value: string | null;
  text_value_ro: string | null;
  text_value_ru: string | null;
  boolean_value: boolean | null;
}

export interface CatalogAttributeFilter {
  attribute: ProductAttributeDefinition;
  options: string[];
  values: ProductAttributeValue[];
}

export function getAttributeUnit(attribute: ProductAttributeDefinition, language: 'ro' | 'ru'): string {
  return (language === 'ro' ? attribute.unit_ro : attribute.unit_ru) || attribute.unit || '';
}

export function useProductAttributeDefinitions(category?: string, includeInactive = false) {
  const [attributes, setAttributes] = useState<ProductAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      let query = supabase.from('product_attributes').select('*').order('sort_order').order('name_ro');
      if (!includeInactive) query = query.eq('active', true);
      if (category) query = query.contains('category_ids', [category]);
      const { data, error } = await query;
      if (cancelled) return;
      setAttributes(error ? [] : ((data as ProductAttributeDefinition[] | null) ?? []));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [category, includeInactive]);

  return { attributes, loading };
}

export function useProductAttributeValues(productId?: string) {
  const [values, setValues] = useState<ProductAttributeValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setValues([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('product_attribute_values')
      .select('*')
      .eq('product_id', productId)
      .then(({ data, error }) => {
        if (cancelled) return;
        setValues(error ? [] : ((data as ProductAttributeValue[] | null) ?? []));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId]);

  return { values, loading };
}

export function useCatalogAttributeFilters(category?: string) {
  const { attributes, loading: definitionsLoading } = useProductAttributeDefinitions(category);
  const filterDefinitions = useMemo(
    () => attributes.filter((attribute) => attribute.filter_enabled && attribute.value_type !== 'text'),
    [attributes],
  );
  const [filters, setFilters] = useState<CatalogAttributeFilter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category || filterDefinitions.length === 0) {
      setFilters([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rows = await fetchAllSupabaseRows<ProductAttributeValue>((from, to) =>
          supabase
            .from('product_attribute_values')
            .select('product_id,attribute_id,numeric_value,text_value,boolean_value,products!inner(category,active)')
            .in('attribute_id', filterDefinitions.map((attribute) => attribute.id))
            .eq('products.category', category)
            .eq('products.active', true)
            .range(from, to) as unknown as PromiseLike<{ data: ProductAttributeValue[] | null; error: { message: string } | null }>
        );
        if (cancelled) return;
          setFilters(filterDefinitions.map((attribute) => {
            const values = rows.filter((value) => value.attribute_id === attribute.id);
            const options = [...new Set(values.flatMap((value) => {
              if (attribute.value_type === 'number' && value.numeric_value != null) return [`num:${value.numeric_value}`];
              if (attribute.value_type === 'boolean' && value.boolean_value != null) return [String(value.boolean_value)];
              return value.text_value ? [value.text_value] : [];
            }))].sort((a, b) => {
              if (a.startsWith('num:') && b.startsWith('num:')) return Number(a.slice(4)) - Number(b.slice(4));
              return a.localeCompare(b);
            });
            return {
              attribute,
              options,
              values,
            };
          }).filter((filter) => filter.options.length > 0));
      } catch {
        if (!cancelled) setFilters([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [category, filterDefinitions]);

  return { filters, loading: definitionsLoading || loading };
}

export async function resolveProductIdsForAttributeFilters(filters: Record<string, string[]>) {
  const entries = Object.entries(filters).filter(([, values]) => values.length > 0);
  if (entries.length === 0) return null;

  let intersection: Set<string> | null = null;
  for (const [attributeId, values] of entries) {
    let query = supabase
      .from('product_attribute_values')
      .select('product_id')
      .eq('attribute_id', attributeId);

    const numericExact = values.filter((value) => value.startsWith('num:')).map((value) => Number(value.slice(4)));
    const exact = values.filter((value) => !value.startsWith('num:'));
    if (numericExact.length) {
      query = query.in('numeric_value', numericExact);
    } else if (exact.length && exact.every((value) => value === 'true' || value === 'false')) {
      query = query.in('boolean_value', exact.map((value) => value === 'true'));
    } else if (exact.length) {
      query = query.in('text_value', exact);
    }

    const { data, error } = await query;
    if (error) return [];
    const ids = new Set((data ?? []).map((row) => row.product_id as string));
    intersection = intersection == null
      ? ids
      : new Set([...intersection].filter((id) => ids.has(id)));
  }
  return [...(intersection ?? new Set<string>())];
}
