import axiosClient from '../client/axiosClient';

export const guildApi = {
  getGuilds(params = {}) {
    return axiosClient.get('/guilds', { params });
  },

  getMyGuild() {
    return axiosClient.get('/guilds/me');
  },

  getGuildById(id) {
    return axiosClient.get(`/guilds/${encodeURIComponent(id)}`);
  },

  getMyGuildVault(params = {}) {
    return axiosClient.get('/guilds/me/vault', { params });
  },

  getGuildVault(id, params = {}) {
    return axiosClient.get(`/guilds/${encodeURIComponent(id)}/vault`, { params });
  },
};