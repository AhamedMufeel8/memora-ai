import api from './apiClient';

export const flashcardService = {
  generateDeck: async (formData, onUploadProgress) => {
    return await api.post('/flashcards/generate', formData, { onUploadProgress });
  },

  getDecks: async (search = '') => {
    const params = search ? { search } : {};
    return await api.get('/flashcards', { params });
  },

  getDeck: async (id) => {
    return await api.get(`/flashcards/${id}`);
  },

  renameDeck: async (id, title) => {
    return await api.put(`/flashcards/${id}`, { title });
  },

  deleteDeck: async (id) => {
    return await api.delete(`/flashcards/${id}`);
  },

  recordStudy: async (id, payload) => {
    return await api.post(`/flashcards/${id}/study`, payload);
  },

  getProgress: async () => {
    return await api.get('/flashcards/progress');
  },
};
