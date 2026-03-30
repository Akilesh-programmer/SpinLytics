import api from './client';

export const productionApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.frameNumber) query.set('frameNumber', params.frameNumber);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get(`/production${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/production/${id}`),
  getDailyProduction: (date) => api.get(`/production/daily/${date}`),
  create: (data) => api.post('/production', data),
  update: (id, data) => api.put(`/production/${id}`, data),
  delete: (id) => api.delete(`/production/${id}`),
};

export default productionApi;
