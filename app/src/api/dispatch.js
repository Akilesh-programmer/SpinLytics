import api from './client';

export const dispatchApi = {
  create: (data) => api.post('/dispatch', data),
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.materialType) q.set('materialType', params.materialType);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get(`/dispatch${qs ? `?${qs}` : ''}`);
  },
};
