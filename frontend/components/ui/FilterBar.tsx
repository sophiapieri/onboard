'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ClothingCategory, FilterOption, Gender, Product } from '@/types';

interface FilterBarProps {
  products: Product[];
  onFilteredProductsChange: (products: Product[]) => void;
}

const priceOptions = [
  { label: 'Under $25', max: 25 },
  { label: '$25–$75', max: 75 },
  { label: '$75–$150', max: 150 },
  { label: '$150+', max: Number.POSITIVE_INFINITY },
] as const;

const categoryOptions: ClothingCategory[] = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];
const genderOptions: Gender[] = ['women', 'men', 'unisex'];
const categoryLabels: Record<ClothingCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessories',
};

export default function FilterBar({ products, onFilteredProductsChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      return filters.every((filter) => {
        switch (filter.type) {
          case 'price':
            return product.price <= filter.max;
          case 'category':
            return product.category === filter.value;
          case 'gender':
            return !product.gender || product.gender === filter.value;
          case 'freeShipping':
            return product.stores.some((store) => store.freeShipping);
          case 'rating':
            return product.rating >= filter.min;
          default:
            return true;
        }
      });
    });
  }, [filters, products]);

  useEffect(() => {
    onFilteredProductsChange(filteredProducts);
  }, [filteredProducts, onFilteredProductsChange]);

  const toggleFilter = (filter: FilterOption) => {
    setFilters((current) => {
      const exists = current.some((item) => {
        if (filter.type === 'category') {
          return item.type === 'category' && item.value === filter.value;
        }

        if (filter.type === 'gender') {
          return item.type === 'gender' && item.value === filter.value;
        }

        return item.type === filter.type;
      });

      if (exists) {
        return current.filter((item) => {
          if (filter.type === 'category') {
            return !(item.type === 'category' && item.value === filter.value);
          }

          if (filter.type === 'gender') {
            return !(item.type === 'gender' && item.value === filter.value);
          }

          return item.type !== filter.type;
        });
      }

      return [...current, filter];
    });
  };

  const clearFilters = () => setFilters([]);

  return (
    <div className={`rounded-full border border-sky/60 bg-white px-3 py-3 shadow-sm ${isSticky ? 'shadow-[0_12px_28px_-20px_rgba(0,28,87,0.35)]' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {priceOptions.map((option) => {
            const isActive = filters.some((filter) => filter.type === 'price' && filter.max === option.max);
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => toggleFilter({ type: 'price', max: option.max })}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  isActive ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((option) => {
            const isActive = filters.some((filter) => filter.type === 'category' && filter.value === option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleFilter({ type: 'category', value: option })}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  isActive ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'
                }`}
              >
                {categoryLabels[option]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {genderOptions.map((option) => {
            const isActive = filters.some((filter) => filter.type === 'gender' && filter.value === option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleFilter({ type: 'gender', value: option })}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  isActive ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'
                }`}
              >
                {option === 'women' ? 'Women' : option === 'men' ? 'Men' : 'Unisex'}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => toggleFilter({ type: 'freeShipping' })}
          className={`rounded-full px-3 py-2 text-sm transition ${
            filters.some((filter) => filter.type === 'freeShipping') ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'
          }`}
        >
          Free Shipping Only
        </button>

        <button
          type="button"
          onClick={() => toggleFilter({ type: 'rating', min: 4 })}
          className={`rounded-full px-3 py-2 text-sm transition ${
            filters.some((filter) => filter.type === 'rating' && filter.min === 4) ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'
          }`}
        >
          Rating 4+ Stars
        </button>

        {filters.length > 0 ? (
          <button type="button" onClick={clearFilters} className="ml-auto text-sm font-medium text-muted">
            ✕ Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
