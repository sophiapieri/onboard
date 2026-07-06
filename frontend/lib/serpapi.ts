// SerpAPI shopping helper that turns style queries into product cards.

import type { ClothingCategory, Gender, Product, StoreOffer } from '@/types';

function inferCategory(query: string): ClothingCategory {
  const normalized = query.toLowerCase();
  if (normalized.includes('dress')) return 'dresses';
  if (normalized.includes('coat') || normalized.includes('jacket') || normalized.includes('outer')) return 'outerwear';
  if (normalized.includes('shoe') || normalized.includes('boot') || normalized.includes('sandal')) return 'shoes';
  if (normalized.includes('bag') || normalized.includes('accessory') || normalized.includes('jewelry')) return 'accessories';
  if (normalized.includes('pant') || normalized.includes('skirt') || normalized.includes('jean')) return 'bottoms';
  return 'tops';
}

function parsePrice(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return Number.parseFloat(cleaned) || 0;
  }

  return 0;
}

export async function searchProducts(searchQuery: string, gender: Gender = 'women'): Promise<Product[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error('Missing SERPAPI_KEY');
  }

  const genderSuffix = gender === 'men' ? "men's clothing" : gender === 'unisex' ? 'unisex clothing' : "women's clothing";
  const enrichedQuery = `${searchQuery} ${genderSuffix}`.trim();

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_shopping');
  url.searchParams.set('q', enrichedQuery);
  url.searchParams.set('api_key', apiKey);

  console.log('SerpAPI request:', { query: enrichedQuery, url: url.toString() });
  const response = await fetch(url.toString());
  const payload = (await response.json()) as Record<string, unknown>;
  console.log('SerpAPI raw response:', payload);

  const shoppingResults = Array.isArray(payload.shopping_results) ? payload.shopping_results : [];
  if (!shoppingResults.length) {
    console.warn('SerpAPI returned no shopping_results for query:', enrichedQuery, payload);
    return [];
  }

  const blockedTerms = ['moisturizer', 'lotion', 'cream', 'furniture', 'costume', 'cosplay', 'decor', 'supplement', 'vitamin', 'rug', 'pillow', 'candle'];

  return (shoppingResults as Array<Record<string, unknown>>)
    .filter((result) => {
      const title = typeof result.title === 'string' ? result.title.toLowerCase() : '';
      return !blockedTerms.some((term) => title.includes(term));
    })
    .slice(0, 6)
    .map((result, index) => {
      const price = parsePrice(result.price);
      const storeName = typeof result.source === 'string' ? result.source : 'Unknown store';
      const storeOffer: StoreOffer = {
        storeName,
        price,
        url: typeof result.link === 'string' ? result.link : '#',
        sizes: ['XS', 'S', 'M'],
        freeShipping: false,
      };

      return {
        id: `${enrichedQuery}-${index}`,
        title: typeof result.title === 'string' ? result.title : enrichedQuery,
        image: typeof result.thumbnail === 'string' ? result.thumbnail : 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
        price,
        rating: typeof result.rating === 'number' ? result.rating : 4.2,
        category: inferCategory(enrichedQuery),
        gender,
        stores: [storeOffer],
        isSaved: false,
      } satisfies Product;
    });
}
