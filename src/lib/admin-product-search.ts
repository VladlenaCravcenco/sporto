function literalPattern(value: string) {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ё/g, 'е');
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(/[aistе]/g, letter => ({ a: '[aăâ]', i: '[iî]', s: '[sșş]', t: '[tțţ]', е: '[её]' })[letter]!);
}

export function applyAdminProductSearch<T extends { or(filter: string): T }>(query: T, input: string): T {
  const search = input.trim();
  if (!search) return query;
  if (/^\d+$/.test(search)) {
    const prefix = JSON.stringify(`^${search}`);
    return query.or(`sku.imatch.${prefix}`);
  }
  for (const token of search.split(/\s+/)) {
    const pattern = JSON.stringify(literalPattern(token));
    query = query.or(['name_ro', 'name_ru', 'sku', 'brand'].map(field => `${field}.imatch.${pattern}`).join(','));
  }
  return query;
}
