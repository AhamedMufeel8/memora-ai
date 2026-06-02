import api from './api';

export const aiService = {
  summarizeNotes: async (formData, onUploadProgress) => {
    const config = {
      onUploadProgress,
    };

    return await api.post('/ai/summarize', formData, config);
  },
};
