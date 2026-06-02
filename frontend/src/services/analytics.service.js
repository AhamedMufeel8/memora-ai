import api from './api';

export const analyticsService = {
  startSession: async ({ feature }) => {
    return await api.post('/analytics/session/start', { feature });
  },

  endSession: async ({ sessionId }) => {
    return await api.post('/analytics/session/end', { sessionId });
  },

  getWeeklyStudyTime: async () => {
    return await api.get('/analytics/weekly-study-time');
  },
};

