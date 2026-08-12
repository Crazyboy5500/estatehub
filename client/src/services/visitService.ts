import api from './api';
import type { VisitStatus } from '../types';

export interface VisitData {
  date?: string;
  time?: string;
  message?: string;
  note?: string;
  rescheduleNote?: string;
}

export const visitService = {
  book: (propertyId: string, data: VisitData) => api.post(`/visits/property/${propertyId}`, data),
  getMy: () => api.get('/visits/my'),
  getOwner: () => api.get('/visits/owner'),
  respond: (id: string, data: Partial<Record<'status', VisitStatus>> & VisitData) =>
    api.put(`/visits/${id}`, data),
};