import api from './client';

export const stockApi = {
  getTransactions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.materialType) query.set('materialType', params.materialType);
    if (params.transactionType) query.set('transactionType', params.transactionType);
    if (params.lotNo) query.set('lotNo', params.lotNo);
    if (params.partyName) query.set('partyName', params.partyName);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get(`/stock/transactions${qs ? `?${qs}` : ''}`);
  },
  getCurrentStock: () => api.get('/stock/current'),
  getCurrentStockByMaterial: (material) => api.get(`/stock/current/${material}`),
  getLotWise: () => api.get('/stock/lot-wise'),
  getPartyWise: () => api.get('/stock/party-wise'),
  getOpeningStock: (date) => api.get(`/stock/opening/${date}`),
  getClosingStock: (date) => api.get(`/stock/closing/${date}`),
};

export default stockApi;
