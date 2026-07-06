'use client';

import { useEffect, type MouseEvent } from 'react';
import HeartButton from '@/components/ui/HeartButton';
import type { Product, StoreOffer } from '@/types';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onToggleSaved?: () => void;
  boardId: string;
}

function normalizeStoreUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '#') {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`;
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return '';
  }

  return `https://${trimmed}`;
}

function handleShopNowClick(event: MouseEvent<HTMLAnchorElement>, rawUrl: string) {
  const normalizedUrl = normalizeStoreUrl(rawUrl);
  event.preventDefault();
  event.stopPropagation();

  if (!normalizedUrl) {
    return;
  }

  window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
}

export default function ProductModal({ product, onClose, onToggleSaved, boardId }: ProductModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const averagePrice = product.stores.length
    ? product.stores.reduce((sum, store) => sum + store.price, 0) / product.stores.length
    : product.price;

  const sortedStores = [...product.stores].sort((left, right) => left.price - right.price);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-6" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:flex-row" onClick={(event) => event.stopPropagation()}>
        <div className="w-full bg-sand p-5 sm:w-1/2">
          {product.image ? (
            <img src={product.image} alt={product.title} className="h-full max-h-[480px] w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl bg-navy">
              <svg viewBox="0 0 24 24" className="h-14 w-14 text-white" fill="none">
                <path d="M4 7.5h16" stroke="currentColor" strokeWidth="1.8" />
                <path d="M6 4h12v16H6z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8.5 11.5 11 14l3-3 3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col p-6 sm:w-1/2">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-navy">{product.title}</h2>
              <p className="mt-2 text-sm text-muted">Average price: ${averagePrice.toFixed(2)}</p>
            </div>
            <button type="button" onClick={onClose} className="text-2xl text-muted" aria-label="Close product modal">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-muted">Available at these stores:</p>
              <div className="space-y-3">
                {sortedStores.map((store) => (
                  <div key={store.storeName} className="rounded-2xl border border-sky/50 bg-sand/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-navy">{store.storeName}</p>
                      <p className="text-sm font-semibold text-navy">${store.price.toFixed(2)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {store.sizes.map((size) => (
                        <span key={size} className="rounded-full border border-navy/30 bg-white px-2.5 py-1 text-xs text-navy">
                          {size}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {store.freeShipping ? (
                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Free Shipping</span>
                      ) : null}
                      {store.freeShippingThreshold ? (
                        <span className="rounded-full bg-sky/80 px-3 py-1 text-xs font-semibold text-navy">Free over ${store.freeShippingThreshold}</span>
                      ) : null}
                    </div>
                    <a
                      href={normalizeStoreUrl(store.url) || '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => handleShopNowClick(event, store.url)}
                      className="mt-4 inline-flex items-center text-sm font-semibold text-navy"
                    >
                      Shop Now →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-sky/50 pt-4">
            <HeartButton productId={product.id} boardId={boardId} isSaved={product.isSaved} onToggle={onToggleSaved} className="w-full justify-center rounded-2xl border border-navy px-4 py-3" />
            <p className="mt-2 text-center text-sm text-muted">Save this item</p>
          </div>
        </div>
      </div>
    </div>
  );
}
