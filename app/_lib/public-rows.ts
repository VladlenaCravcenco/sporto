/** Supabase's default row cap must not silently truncate public navigation or sitemap. */
export async function readPublicRows<T>(query: { range(from: number, to: number): PromiseLike<{ data: T[] | null; error: unknown }> }): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query.range(from, from + 999);
    if (error) throw new Error('Public rows unavailable');
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}
