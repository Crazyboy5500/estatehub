import type { RecentSearch } from '../types';

const KEY = 'estatehub_recent_searches';
const MAX = 8;

export const getRecentSearches = (): RecentSearch[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export interface RecentSearchInput {
  keyword?: string;
  type?: string;
  purpose?: string;
  bedrooms?: string;
}

export const saveRecentSearch = ({ keyword, type, purpose, bedrooms }: RecentSearchInput): void => {
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (type) params.set('type', type);
  if (purpose) params.set('purpose', purpose);
  if (bedrooms) params.set('bedrooms', bedrooms);
  if (!params.toString()) return;

  const parts: string[] = [];
  if (keyword) parts.push(keyword);
  if (bedrooms) parts.push(`${bedrooms} BHK`);
  if (type) parts.push(type);
  parts.push(purpose === 'rent' ? 'Rent' : 'Buy');
  const label = parts.join(' · ');

  const list = getRecentSearches().filter((s) => s.label !== label);
  list.unshift({ label, params: params.toString() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
};

export const removeRecentSearch = (label: string): void => {
  localStorage.setItem(KEY, JSON.stringify(getRecentSearches().filter((s) => s.label !== label)));
};

export const clearRecentSearches = (): void => localStorage.removeItem(KEY);