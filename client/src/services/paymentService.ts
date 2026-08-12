import api from './api';

export interface PaymentPayload {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  propertyId?: string;
  version?: string;
}

export const paymentService = {
  createOrder: (propertyId: string, visitId?: string) => api.post('/payments/create-order', { propertyId, visitId }),
  verify: (payload: PaymentPayload) => api.post('/payments/verify', payload),
};