import axiosClient from '../axiosClient';

export const operatorApi = {
  // Tổng quan kinh tế & hệ thống
  getOverview: () => axiosClient.get('/operator/overview'),

  // Danh sách & tra cứu tổng hợp
  getPlayers: (params) => axiosClient.get('/operator/players', { params }),
  getGuilds: (params) => axiosClient.get('/operator/guilds', { params }),
  getAuctions: (params) => axiosClient.get('/operator/auctions', { params }),
  getTrades: (params) => axiosClient.get('/operator/trades', { params }),
  getWaystones: (params) => axiosClient.get('/operator/waystones', { params }),
  getMounts: (params) => axiosClient.get('/operator/mounts', { params }),
  getCrops: (params) => axiosClient.get('/operator/crops', { params }),
  getJobs: (params) => axiosClient.get('/operator/jobs', { params }),
  getLicenses: (params) => axiosClient.get('/operator/licenses', { params }),
  getLicenseBets: (params) => axiosClient.get('/operator/licenses/bets', { params }),

  // Soát xét giao dịch & Quét vật phẩm / Logs
  auditTransactions: (params) =>
    axiosClient.get('/operator/audit/transactions', { params }),
  scanItems: (params) => axiosClient.get('/operator/items/scan', { params }),
  getLogs: (params) => axiosClient.get('/operator/logs', { params }),

  // Inspect 360° người chơi
  inspectPlayer: (username, params) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/inspect`, { params }),
  inspectPlayerInventory: (username, params) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/inventory`, { params }),
  searchPlayerInventory: (username, params) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/inventory/search`, {
      params,
    }),
  inspectPlayerJobs: (username) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/jobs`),
  inspectPlayerMounts: (username) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/mounts`),
  inspectPlayerWaystones: (username) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/waystones`),
  inspectPlayerAuctions: (username, params) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/auctions`, { params }),
  inspectPlayerTrades: (username, params) =>
    axiosClient.get(`/operator/players/${encodeURIComponent(username)}/trades`, { params }),

  // Hàng đợi lệnh tác động trực tiếp vào server game
  dispatchPlayerAction: (username, payload) =>
    axiosClient.post(`/operator/players/${encodeURIComponent(username)}/actions`, payload),

  // Phân quyền & Policy (ADMIN ONLY)
  getStaffList: () => axiosClient.get('/operator/staff'),
  updatePlayerRole: (username, payload) =>
    axiosClient.patch(`/operator/players/${encodeURIComponent(username)}/role`, payload),
  getModeratorPolicy: () => axiosClient.get('/operator/policy/moderator'),
  updateModeratorPolicy: (payload) => axiosClient.put('/operator/policy/moderator', payload),
};