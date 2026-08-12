import api from './api';

export const analyticsService = {
  getStats: () => api.get('/analytics/stats'),
  propertiesByCity: () => api.get('/analytics/properties-by-city'),
  monthlyListings: () => api.get('/analytics/monthly-listings'),
  mostViewed: () => api.get('/analytics/most-viewed'),
  avgPrice: () => api.get('/analytics/avg-price'),
  mostSaved: () => api.get('/analytics/most-saved'),
  visitsBooked: () => api.get('/analytics/visits-booked'),
  recentActivity: () => api.get('/analytics/recent-activity'),
  ownerAnalytics: () => api.get('/analytics/owner'),
};