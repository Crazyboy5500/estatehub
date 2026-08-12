import api from './api';

export const messageService = {
  getOrCreateConversation: (userId: string, propertyId?: string) =>
    api.post('/messages/conversations', { userId, propertyId }),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string) => api.get(`/messages/conversations/${conversationId}`),
  send: (conversationId: string, text: string, propertyId?: string) =>
    api.post(`/messages/conversations/${conversationId}/messages`, { text, propertyId }),
};