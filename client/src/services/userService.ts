import api from './api';

export interface ReportData {
  targetType: 'property' | 'user';
  targetId: string;
  reason: string;
}

export const userService = {
  getUsers: (params: Record<string, string> = {}) => api.get('/users', { params }),
  toggleBlock: (id: string) => api.put(`/users/${id}/block`),
  remove: (id: string) => api.delete(`/users/${id}`),
  createReport: (data: ReportData) => api.post('/users/reports', data),
  getReports: () => api.get('/users/reports'),
  resolveReport: (id: string, status: string) => api.put(`/users/reports/${id}`, { status }),
};