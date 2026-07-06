// API route that turns a Pinterest board URL into a board analysis and product results.

import { fetchPinterestPins } from '@/lib/pinterest';
import { analyzeImages, type GeminiAnalysis, type GeminiInlineImage } from '@/lib/gemini';
import { searchProducts } from '@/lib/serpapi';
import type { BoardPage, Product, Gender } from '@/types';

function deduplicateProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.title)) {
      return false;
    }
    seen.add(product.title);
    return true;
  });
}

function getFallbackSearchQueries(gender: Gender): string[] {
  if (gender === 'men') {
    return ['navy wool overcoat men', 'charcoal tailored trousers men', 'cream knit polo men'];
  }

  if (gender === 'unisex') {
    return ['cream knit sweater unisex', 'black tailored trousers unisex', 'camel wool coat unisex'];
  }

  return ['cream knit sweater women', 'black tailored trousers women', 'camel wool coat women'];
}

async function fetchImageForGemini(imageUrl: string): Promise<GeminiInlineImage | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.pinterest.com/',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Image fetch failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';

    return {
      base64: Buffer.from(arrayBuffer).toString('base64'),
      mimeType,
    };
  } catch (error) {
    console.warn('Failed to fetch Pinterest image for Gemini:', imageUrl, error);
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { pinterestUrl?: string; pageName?: string; userId?: string; gender?: Gender };
  const pinterestUrl = body.pinterestUrl?.trim() || 'https://www.pinterest.com';
  const pageName = body.pageName?.trim() || 'New Board';
  const gender = body.gender ?? 'women';

  console.log('Analyzing board', { pinterestUrl, pageName, userId: body.userId ?? null, gender });
  console.log('SERPAPI_KEY present:', Boolean(process.env.SERPAPI_KEY));
  if (!process.env.SERPAPI_KEY) {
    console.warn('SERPAPI_KEY is undefined at runtime');
  }

  try {
    let pins: Array<{ imageUrl: string; description: string }> = [];
    let imageUrls: string[] = [];

    try {
      pins = await fetchPinterestPins(pinterestUrl);
      imageUrls = pins.slice(0, 8).map((pin) => pin.imageUrl);
      console.log('Pinterest raw image URLs:', imageUrls);
    } catch (error) {
      console.warn('Pinterest RSS fetch failed, continuing with fallback queries:', error);
    }

    let analysis: GeminiAnalysis = {
      aestheticLabels: [pageName, 'editorial', 'refined'],
      dominantColors: [],
      clothingTypes: ['tops', 'bottoms'],
      searchQueries: getFallbackSearchQueries(gender),
    };

    if (imageUrls.length > 0) {
      try {
        const imageFetchResults = await Promise.allSettled(imageUrls.slice(0, 6).map((imageUrl) => fetchImageForGemini(imageUrl)));
        const inlineImages = imageFetchResults.flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []));
        const successCount = inlineImages.length;
        const failedCount = imageFetchResults.length - successCount;
        console.log('Pinterest image fetch results:', { requested: imageFetchResults.length, success: successCount, failed: failedCount });

        if (inlineImages.length > 0) {
          const imageBatches = [inlineImages.slice(0, 3), inlineImages.slice(0, 2), inlineImages.slice(0, 1)];

          for (const batch of imageBatches) {
            if (!batch.length) {
              continue;
            }

            try {
              analysis = await analyzeImages(batch, pins.map((pin) => pin.description), gender);
              console.log('Gemini JSON response:', analysis);
              break;
            } catch (error) {
              console.warn('Gemini analysis failed for image batch:', batch.length, error);
              analysis = {
                ...analysis,
                searchQueries: getFallbackSearchQueries(gender),
              };
            }
          }
        } else {
          console.warn('No Pinterest images could be fetched for Gemini analysis.');
        }
      } catch (error) {
        console.warn('Gemini analysis failed:', error);
      }
    } else {
      console.warn('No Pinterest images were available for Gemini analysis.');
    }

    const searchQueries = Array.isArray(analysis.searchQueries) && analysis.searchQueries.length > 0
      ? analysis.searchQueries
      : getFallbackSearchQueries(gender);

    const scopedQueries = searchQueries.slice(0, 10);
    scopedQueries.forEach((query) => console.log('Gemini search query:', query));

    const searchResults = await Promise.all(scopedQueries.map((query) => searchProducts(query, gender)));
    const products = deduplicateProducts(searchResults.flat()).slice(0, 20);

    console.log('Final Product[] before return:', products);

    const board: BoardPage = {
      id: `board-${Date.now()}`,
      name: pageName,
      pinterestUrl,
      aestheticLabels: analysis.aestheticLabels?.length ? analysis.aestheticLabels : [pageName, 'editorial', 'refined'],
      preferredGender: gender === 'men' ? 'men' : 'women',
      createdAt: new Date(),
      products,
    };

    return Response.json(board);
  } catch (error) {
    console.error('Board analysis failed:', error);
    return Response.json({
      id: `board-${Date.now()}`,
      name: pageName,
      pinterestUrl,
      aestheticLabels: [pageName, 'editorial', 'refined'],
      createdAt: new Date(),
      products: [],
      error: 'BOARD_ANALYSIS_FAILED',
    });
  }
}
