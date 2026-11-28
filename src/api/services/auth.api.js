import axiosClient from '../client/axiosClient';

export const authApi = {
  login(credentials) {
    return axiosClient.post('/auth/login', credentials);
  },

  getMe() {
    return axiosClient.get('/auth/me');
  },
};