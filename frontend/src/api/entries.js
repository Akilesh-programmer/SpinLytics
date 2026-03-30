import api from './client';

export const packingApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.source) query.set('source', params.source);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get(`/packing${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/packing/${id}`),
};

export const dispatchApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.materialType) query.set('materialType', params.materialType);
    if (params.partyName) query.set('partyName', params.partyName);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get(`/dispatch${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/dispatch/${id}`),
};

export const ebApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.year) query.set('year', String(params.year));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get(`/eb${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/eb/${id}`),
};

export default { packingApi, dispatchApi, ebApi };
