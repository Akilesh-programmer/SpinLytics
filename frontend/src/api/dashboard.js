import api from './client';

export const dashboardApi = {
  getDailySummary: (date) => api.get(`/dashboard/daily/${date}`),
  getMonthlySummary: (year, month) => api.get(`/dashboard/monthly/${year}/${month}`),
  getYearlySummary: (year) => api.get(`/dashboard/yearly/${year}`),
  getStockDashboard: () => api.get('/dashboard/stock'),
};

export default dashboardApi;
