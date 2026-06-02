import api from './api';

export const tutorService = {
  /**
   * Fetches summaries of all chat sessions for the authenticated user
   */
  getSessions: async () => {
    return await api.get('/tutor');
  },

  /**
   * Fetches full history of a single chat session
   */
  getSession: async (id) => {
    return await api.get(`/tutor/${id}`);
  },

  /**
   * Creates a new chat session
   */
  createSession: async (data = {}) => {
    return await api.post('/tutor', data);
  },

  /**
   * Sends a user query to the AI Tutor for a specific session
   */
  sendMessage: async (id, messageData) => {
    // messageData: { message: string, studentLevel?: string, contextDocs?: string }
    return await api.post(`/tutor/${id}/chat`, messageData);
  },

  /**
   * Renames a chat session manually
   */
  renameSession: async (id, title) => {
    return await api.put(`/tutor/${id}`, { title });
  },

  /**
   * Deletes a chat session completely
   */
  deleteSession: async (id) => {
    return await api.delete(`/tutor/${id}`);
  }
};
