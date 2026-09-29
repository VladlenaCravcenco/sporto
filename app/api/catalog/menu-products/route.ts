import { NextRequest, NextResponse } from 'next/server';
import { getCatalogMenuProducts } from '../../../_lib/catalog-data';

const safeSlug = /^[a-z0-9][a-z0-9-_]{0,99}$/i;

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category')?.trim() || '';
  const subcategory = request.nextUrl.searchParams.get('subcategory')?.trim() || '';

  if (!safeSlug.test(category) || !safeSlug.test(subcategory)) {
    return NextResponse.json({ products: [] }, { status: 400 });
  }

  const products = await getCatalogMenuProducts(category, subcategory);
  return NextResponse.json(
    { products },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
