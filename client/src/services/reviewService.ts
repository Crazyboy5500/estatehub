import api from './api';

export interface ReviewData {
  rating: number;
  comment: string;
}

export const reviewService = {
  getForProperty: (propertyId: string) => api.get(`/reviews/property/${propertyId}`),
  create: (propertyId: string, data: ReviewData) => api.post(`/reviews/property/${propertyId}`, data),
  reply: (id: string, reply: string) => api.put(`/reviews/${id}/reply`, { reply }),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};