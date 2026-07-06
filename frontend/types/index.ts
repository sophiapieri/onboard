// Shared TypeScript interfaces and unions for the OnBoard app.

export type Gender = 'women' | 'men' | 'unisex';
export type PreferredGender = 'women' | 'men';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  isGuest: boolean;
}

export interface GuestSession {
  boards: BoardPage[];
  savedItems: string[];
}

export interface BoardPage {
  id: string;
  name: string;
  pinterestUrl: string;
  aestheticLabels: string[];
  preferredGender?: PreferredGender;
  createdAt: Date;
  products: Product[];
}

export interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  rating: number;
  category: ClothingCategory;
  gender: Gender;
  stores: StoreOffer[];
  isSaved: boolean;
}

export interface StoreOffer {
  storeName: string;
  price: number;
  url: string;
  sizes: string[];
  freeShipping: boolean;
  freeShippingThreshold?: number;
}

export type ClothingCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories';

export type FilterOption =
  | { type: 'price'; max: number }
  | { type: 'category'; value: ClothingCategory }
  | { type: 'gender'; value: Gender }
  | { type: 'freeShipping' }
  | { type: 'rating'; min: number };
