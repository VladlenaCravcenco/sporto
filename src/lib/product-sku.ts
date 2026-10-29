export function normalizeSku(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export interface SkuProduct { id?: string; sku?: string | null }

export function validateProductSkus(existing: SkuProduct[], incoming: SkuProduct[]): void {
  const byId = new Map(existing.map(row => [row.id, normalizeSku(row.sku)]));
  const owners = new Map<string, Set<string | undefined>>();
  for (const row of existing) {
    const sku = normalizeSku(row.sku);
    if (sku) owners.set(sku, new Set([...(owners.get(sku) || []), row.id]));
  }
  const ids = new Set<string>();
  for (const row of incoming) {
    if (row.id && ids.has(row.id)) throw new Error('SPORTO_IMPORT_DUPLICATE_ID');
    if (row.id) ids.add(row.id);
    const sku = normalizeSku(row.sku);
    if (!sku) continue;
    const unchanged = Boolean(row.id && byId.has(row.id) && byId.get(row.id) === sku);
    if (!unchanged && [...(owners.get(sku) || [])].some(id => !row.id || id !== row.id)) {
      throw new Error('SPORTO_DUPLICATE_SKU');
    }
    owners.set(sku, new Set([...(owners.get(sku) || []), row.id]));
  }
}

export async function checkProductSkus(db: any, incoming: SkuProduct[]): Promise<void> {
  const existing: SkuProduct[] = [];
  for (let from = 0; ; from += 1000) {
    // Authenticated admin reads include hidden products: their SKU stays reserved.
    const { data, error } = await db.from('products').select('id,sku').order('id').range(from, from + 999);
    if (error) throw new Error('SPORTO_SKU_CHECK_FAILED');
    existing.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  validateProductSkus(existing, incoming);
}

export function productSkuError(error: unknown, language: 'ro' | 'ru'): string {
  const message = error instanceof Error ? error.message : String((error as any)?.message || '');
  if (message.includes('SPORTO_DUPLICATE_SKU')) return language === 'ro'
    ? 'Acest SKU este deja atribuit altui produs. Introduceți un SKU diferit sau editați produsul existent.'
    : 'Этот артикул уже занят другим товаром. Укажите другой артикул или откройте существующую карточку.';
  if (message.includes('SPORTO_PRODUCT_MERGED')) return language === 'ro' ? 'Acest produs a fost unit cu altă fișă. Editați produsul principal.' : 'Эта карточка объединена с другой. Редактируйте основную карточку.';
  if (message.includes('SPORTO_IMPORT_DUPLICATE_ID')) return language === 'ro'
    ? 'Fișierul conține același ID de produs în mai multe rânduri. Corectați fișierul înainte de import.'
    : 'В файле несколько строк с одним ID товара. Исправьте файл перед импортом.';
  if (message.includes('SPORTO_SKU_CHECK_FAILED')) return language === 'ro'
    ? 'Nu s-a putut verifica SKU. Încercați din nou; produsele nu au fost salvate.'
    : 'Не удалось проверить артикулы. Повторите попытку; товары не сохранены.';
  return message || (language === 'ro' ? 'Nu s-a putut salva produsul.' : 'Не удалось сохранить товар.');
}

export interface SkuMatch { id: string; sku: string | null; name_ro: string; name_ru: string | null; active: boolean }

export async function findProductSkuMatches(db: any, value: string): Promise<SkuMatch[]> {
  const sku = normalizeSku(value);
  if (!sku) return [];
  const pattern = `%${sku.replace(/[\\%_]/g, '\\$&')}%`;
  const matches: SkuMatch[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('products').select('id,sku,name_ro,name_ru,active')
      .ilike('sku', pattern).order('id').range(from, from + 999);
    if (error) throw new Error('SPORTO_SKU_CHECK_FAILED');
    matches.push(...(data || []).filter((row: SkuMatch) => normalizeSku(row.sku) === sku));
    if (!data || data.length < 1000) break;
  }
  if (!matches.length) return matches;
  // Archived merge sources remain for history/rollback, but are not duplicate cards to edit.
  const redirects = await db.from('product_redirects').select('source_id').in('source_id', matches.map(row => row.id));
  if (redirects.error) {
    if (redirects.error.code === '42P01' || redirects.error.code === 'PGRST205') return matches;
    throw new Error('SPORTO_SKU_CHECK_FAILED');
  }
  const archived = new Set((redirects.data || []).map((row: { source_id: string }) => row.source_id));
  return matches.filter(row => !archived.has(row.id));
}
