// API route that returns shopping products for a style query.

import { searchProducts } from '@/lib/serpapi';
import type { Gender } from '@/types';

export async function POST(request: Request) {
  const body = (await request.json()) as { searchQuery?: string; gender?: Gender };
  const searchQuery = body.searchQuery?.trim() || 'editorial wardrobe';
  const gender = body.gender ?? 'women';

  const products = await searchProducts(searchQuery, gender);
  return Response.json(products);
}
