import api from './api';
import type { User } from '../types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
  role?: 'buyer' | 'owner';
  phone?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export const authService = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  google: (credential: string) => api.post('/auth/google', { credential }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  requestOTP: (email: string) => api.post('/auth/request-otp', { email }),
  verifyOTP: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: Partial<User>) => api.put('/auth/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
  toggleFavorite: (propertyId: string) => api.post(`/auth/favorites/${propertyId}`),
};