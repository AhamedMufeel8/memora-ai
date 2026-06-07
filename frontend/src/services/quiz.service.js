import api from './apiClient';

export const quizService = {
  generateQuiz: async (formData, onUploadProgress) => {
    return await api.post('/quiz/generate', formData, { onUploadProgress });
  },

  getQuizzes: async (search = '') => {
    const params = search ? { search } : {};
    return await api.get('/quiz', { params });
  },

  getQuiz: async (id) => {
    return await api.get(`/quiz/${id}`);
  },

  submitAttempt: async (quizId, answers) => {
    return await api.post(`/quiz/${quizId}/submit`, { answers });
  },

  getAttempts: async () => {
    return await api.get('/quiz/attempts');
  },

  getAnalytics: async () => {
    return await api.get('/quiz/analytics');
  },

  deleteQuiz: async (id) => {
    return await api.delete(`/quiz/${id}`);
  },
};
