import axiosClient from '../client/axiosClient';

export const marketApi = {
  getActiveAuctions(params = {}) {
    return axiosClient.get('/market/auctions', { params });
  },

  getAuctionHistory(params = {}) {
    return axiosClient.get('/market/auctions/history', { params });
  },

  getAuctionById(id) {
    return axiosClient.get(`/market/auctions/${encodeURIComponent(id)}`);
  },

  getMyTrades(params = {}) {
    return axiosClient.get('/market/trades/me', { params });
  },

  getAllTrades(params = {}) {
    return axiosClient.get('/market/trades', { params });
  },

  getTradeById(id) {
    return axiosClient.get(`/market/trades/${encodeURIComponent(id)}`);
  },

  getLicenses(params = {}) {
    return axiosClient.get('/market/licenses', { params });
  },
};