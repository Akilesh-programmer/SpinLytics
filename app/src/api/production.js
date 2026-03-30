import api from './client';

export const productionApi = {
  create: (data) => api.post('/production', data),
  getByDate: (date) => api.get(`/production/date/${date}`),
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.frameNumber) q.set('frameNumber', params.frameNumber);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get(`/production${qs ? `?${qs}` : ''}`);
  },
};
