import api from './api';

export type PaymentType = 'token' | 'full';
export type PaymentStatus = 'created' | 'paid' | 'confirmed' | 'refunded' | 'failed';

export interface PaymentPayload {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  propertyId?: string;
  version?: string;
}

export interface Payment {
  _id: string;
  buyerId: { _id: string; name?: string; email?: string; phone?: string };
  ownerId: { _id: string; name?: string; email?: string; phone?: string };
  propertyId: { _id: string; title?: string; images?: string[]; city?: string; address?: string; price?: number; purpose?: string };
  type: PaymentType;
  amount: number;
  currency: string;
  tokenDeducted: number;
  status: PaymentStatus;
  commissionPercent: number;
  commissionPaise: number;
  ownerAmountPaise: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdAt: string;
  updatedAt: string;
}

export const paymentService = {
  createOrder: (propertyId: string, type: PaymentType = 'token', visitId?: string) =>
    api.post('/payments/create-order', { propertyId, visitId, type }),
  verify: (payload: PaymentPayload) => api.post('/payments/verify', payload),
  confirm: (id: string) => api.post(`/payments/${id}/confirm`),
  refund: (id: string) => api.post(`/payments/${id}/refund`),
  getMy: () => api.get('/payments/my'),
  getOwner: () => api.get('/payments/owner'),
  getAll: () => api.get('/payments/all'),
};
