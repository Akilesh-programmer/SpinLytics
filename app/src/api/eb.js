import api from './client';

export const ebApi = {
  create: (data) => api.post('/eb', data),
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.year) q.set('year', String(params.year));
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get(`/eb${qs ? `?${qs}` : ''}`);
  },
  getByMonthYear: (year, month) => api.get(`/eb/month/${year}/${month}`),
  getPreviousClosing: (year, month) => api.get(`/eb/previous-closing/${year}/${month}`),
};
