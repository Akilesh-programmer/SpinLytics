import api from './client';

export const packingApi = {
  create: (data) => api.post('/packing', data),
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.source) q.set('source', params.source);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get(`/packing${qs ? `?${qs}` : ''}`);
  },
};
