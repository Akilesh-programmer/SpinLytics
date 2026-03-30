import api from './client';

export const dashboardApi = {
  getDaily: (date) => api.get(`/dashboard/daily/${date}`),
  getMonthly: (year, month) => api.get(`/dashboard/monthly/${year}/${month}`),
  getYearly: (year) => api.get(`/dashboard/yearly/${year}`),
  getStock: () => api.get('/dashboard/stock'),
};
