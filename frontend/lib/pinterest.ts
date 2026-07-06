// Pinterest RSS fetcher and parser for board analysis.

import { XMLParser } from 'fast-xml-parser';

export interface PinterestPin {
  imageUrl: string;
  description: string;
}

function upgradePinterestImageUrl(url: string): string {
  return url
    .replace(/\/236x\//i, '/736x/')
    .replace(/236x\//i, '736x/')
    .replace(/\/236x/i, '/736x')
    .replace(/236x/i, '736x');
}

function extractText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.value === 'string') {
      return record.value;
    }

    if (typeof record['#text'] === 'string') {
      return record['#text'];
    }
  }

  return '';
}

function extractImageUrl(item: Record<string, unknown>): string | null {
  const candidates = [
    item['media:content'],
    item['media:thumbnail'],
    item.enclosure,
    item.image,
    item.description,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (typeof candidate === 'string') {
      const match = candidate.match(/https?:\/\/[^\s"']+/i);
      if (match) {
        return match[0];
      }
      continue;
    }

    if (typeof candidate === 'object') {
      const record = candidate as Record<string, unknown>;
      const directUrl = record.url;
      if (typeof directUrl === 'string' && directUrl.startsWith('http')) {
        return directUrl;
      }

      const attrUrl = record['@_url'];
      if (typeof attrUrl === 'string' && attrUrl.startsWith('http')) {
        return attrUrl;
      }

      const textValue = extractText(candidate);
      const match = textValue.match(/https?:\/\/[^\s"']+/i);
      if (match) {
        return match[0];
      }
    }
  }

  return null;
}

export async function fetchPinterestPins(pinterestUrl: string): Promise<PinterestPin[]> {
  const rssUrl = pinterestUrl.replace(/\/?$/, '.rss');
  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Pinterest RSS fetch failed with status ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(xmlText) as Record<string, unknown>;
  const channel = (parsed?.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
  const rawItems = channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return (items as Array<Record<string, unknown>>)
    .map((item) => {
      const description = extractText(item.description ?? '');
      const imageUrl = extractImageUrl(item);
      return imageUrl ? { imageUrl: upgradePinterestImageUrl(imageUrl), description } : null;
    })
    .filter((entry): entry is PinterestPin => Boolean(entry))
    .slice(0, 20);
}
