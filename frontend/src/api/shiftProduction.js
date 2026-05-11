import api from './client';

export const shiftProductionApi = {
  // Create single entry (auto-save individual row)
  createSingle: (data) => api.post('/shift-production', data),

  // Create batch (Save All)
  createBatch: (data) => api.post('/shift-production/batch', data),

  // List with filters
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.rfNo) query.set('rfNo', params.rfNo);
    if (params.count) query.set('count', params.count);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get(`/shift-production${qs ? `?${qs}` : ''}`);
  },

  // Get all entries for a date (daily dashboard)
  getByDate: (date) => api.get(`/shift-production/daily/${date}`),

  // Single entry
  getById: (id) => api.get(`/shift-production/${id}`),

  // Update
  update: (id, data) => api.put(`/shift-production/${id}`, data),

  // Delete
  remove: (id) => api.delete(`/shift-production/${id}`),
};

export default shiftProductionApi;
