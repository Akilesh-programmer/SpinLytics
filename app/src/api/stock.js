import api from './client';

export const stockApi = {
  create: (data) => api.post('/stock/transactions', data),
  getCurrentStock: () => api.get('/stock/current'),
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.materialType) q.set('materialType', params.materialType);
    if (params.transactionType) q.set('transactionType', params.transactionType);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get(`/stock/transactions${qs ? `?${qs}` : ''}`);
  },
};
