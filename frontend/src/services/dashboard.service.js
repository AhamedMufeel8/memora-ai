import api from './apiClient';

export const dashboardService = {
  getDashboard: async () => {
    return await api.get('/users/dashboard');
  },
};
