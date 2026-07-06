// Gemini-based analysis helper for Pinterest board images.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Gender } from '@/types';

export interface GeminiInlineImage {
  base64: string;
  mimeType: string;
}

export interface GeminiAnalysis {
  aestheticLabels: string[];
  dominantColors: string[];
  clothingTypes: string[];
  searchQueries: string[];
}

function sanitizeGeminiJson(rawText: string): string {
  return rawText
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

export async function analyzeImages(images: GeminiInlineImage[], descriptions: string[] = [], gender: Gender = 'women'): Promise<GeminiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = 'You are a fashion stylist AI analyzing Pinterest board images. Look at these images and identify ONLY clothing and accessory items that real people are wearing. Ignore any text, backgrounds, or non-fashion objects. Return ONLY a valid JSON object with no markdown, no explanation, no code fences. The object must have: A. aestheticLabels: string array of 3-5 style descriptors (e.g. "european winter", "quiet luxury", "minimal chic") B. searchQueries: string array of 8-12 very specific shoppable clothing search strings. Each query must: - describe exactly one wearable item (e.g. "camel wool belted overcoat women", "black straight leg trousers high waist", "chunky white knit turtleneck sweater") - include the material or fabric when visible (wool, linen, leather, denim) - include the color - include the garment type - end with "women" or "men" based on what is shown - NEVER include brand names, skincare, furniture, costumes, or non-clothing items';

  const imageBatch = images.slice(0, 3);
  const parts = [
    { text: prompt },
    ...(descriptions.length ? [{ text: `Pin descriptions: ${descriptions.slice(0, 6).join(' | ')}` }] : []),
    ...imageBatch.map((image) => ({ inlineData: { mimeType: image.mimeType, data: image.base64 } })),
  ];

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
  });
  const rawText = result.response.text();
  console.log('Gemini raw response:', rawText);

  const cleanedText = sanitizeGeminiJson(rawText);

  try {
    const parsed = JSON.parse(cleanedText) as Partial<GeminiAnalysis>;
    return {
      aestheticLabels: Array.isArray(parsed.aestheticLabels) ? parsed.aestheticLabels : [],
      dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : [],
      clothingTypes: Array.isArray(parsed.clothingTypes) ? parsed.clothingTypes : [],
      searchQueries: Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [],
    };
  } catch (error) {
    console.error('Gemini parsing failed. Raw text:', rawText);
    throw error;
  }
}
