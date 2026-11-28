import axiosClient from '../client/axiosClient';

export const playerApi = {
  getMyProfile(params = {}) {
    return axiosClient.get('/players/me/profile', { params });
  },

  getPublicProfile(username, params = {}) {
    return axiosClient.get(`/players/${encodeURIComponent(username)}/profile`, { params });
  },

  searchPlayers(params = {}) {
    return axiosClient.get('/players', { params });
  },

  getMyInventory(params = {}) {
    return axiosClient.get('/players/me/inventory', { params });
  },

  getMyMounts(params = {}) {
    return axiosClient.get('/players/me/mounts', { params });
  },

  getMyQuests(params = {}) {
    return axiosClient.get('/players/me/quests', { params });
  },

  getMyWaystones(params = {}) {
    return axiosClient.get('/players/me/waystones', { params });
  },

  getMyFriends(params = {}) {
    return axiosClient.get('/players/me/friends', { params });
  },
};