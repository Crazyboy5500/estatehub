import api from './api';
import type { Property } from '../types';

export interface PropertyFilters {
  keyword?: string;
  city?: string;
  locality?: string;
  type?: string;
  purpose?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  minArea?: number | string;
  maxArea?: number | string;
  featured?: boolean;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

type FilterValue = string | number | boolean | undefined;

const buildQuery = (filters: Record<string, FilterValue> = {}): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.set(key, String(value));
    }
  });
  return params.toString();
};

export const propertyService = {
  getProperties: (filters: PropertyFilters = {}) => api.get(`/properties?${buildQuery(filters as Record<string, FilterValue>)}`),
  getFeatured: () => api.get('/properties/featured'),
  getLatest: () => api.get('/properties/latest'),
  getCities: () => api.get('/properties/cities'),
  getTrending: () => api.get('/properties/trending'),
  getProperty: (id: string) => api.get(`/properties/${id}`),
  getSimilar: (id: string) => api.get(`/properties/${id}/similar`),
  getMy: () => api.get('/properties/my'),
  create: (data: FormData) => api.post('/properties', data),
  update: (id: string, data: FormData) => api.put(`/properties/${id}`, data),
  remove: (id: string) => api.delete(`/properties/${id}`),
  updateStatus: (id: string, status: NonNullable<Property['status']>) =>
    api.put(`/properties/${id}/status`, { status }),
};