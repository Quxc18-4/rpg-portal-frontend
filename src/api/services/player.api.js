import axiosClient from '../client/axiosClient';

export const playerApi = {
  getLeaderboard(params = {}) {
    return axiosClient.get('/players/leaderboard', { params });
  },

  getMyProfile(params = {}) {
    return axiosClient.get('/players/me', { params });
  },

  getPublicProfile(username, params = {}) {
    return axiosClient.get(`/players/${encodeURIComponent(username)}`, { params });
  },

  getMyInventory(params = {}) {
    return axiosClient.get('/players/me/inventory', { params });
  },

  searchMyInventory(params = {}) {
    return axiosClient.get('/players/me/inventory/search', { params });
  },

  getMyJobs(params = {}) {
    return axiosClient.get('/players/me/jobs', { params });
  },

  getMyMounts(params = {}) {
    return axiosClient.get('/players/me/mounts', { params });
  },

  getMyCrops(params = {}) {
    return axiosClient.get('/players/me/crops', { params });
  },

  getMyWaystones(params = {}) {
    return axiosClient.get('/players/me/waystones', { params });
  },

  getMyRewards(params = {}) {
    return axiosClient.get('/players/me/rewards', { params });
  },

  getMyLicenseBets(params = {}) {
    return axiosClient.get('/players/me/licenses/bets', { params });
  },

  getMyQuests(params = {}) {
    return axiosClient.get('/players/me/quests', { params });
  },

  getMyFriends(params = {}) {
    return axiosClient.get('/players/me/friends', { params });
  },
};