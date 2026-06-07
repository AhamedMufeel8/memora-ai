import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const consumeStreamLines = (incoming, pendingBuffer, onStage) => {
  const combined = `${pendingBuffer}${incoming}`;
  const lines = combined.split('\n');
  const remainder = lines.pop() || '';

  let result = null;
  let error = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const event = JSON.parse(line);
    if (event.type === 'progress' && onStage) {
      onStage(event.stage, event);
    }
    if (event.type === 'result') {
      result = event.data;
    }
    if (event.type === 'error') {
      error = { message: event.message || 'Failed to generate summary.' };
    }
  }

  return { remainder, result, error };
};

export const aiService = {
  summarizeNotes: async (formData, { onUploadProgress, onStage } = {}) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/ai/summarize`);
      xhr.withCredentials = true;
      xhr.setRequestHeader('X-Progress-Stream', 'true');

      const token = Cookies.get('token') || localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      let receivedLength = 0;
      let pendingBuffer = '';
      let settled = false;

      const settle = (handler, value) => {
        if (settled) return;
        settled = true;
        handler(value);
      };

      const processIncoming = (incoming) => {
        try {
          const { remainder, result, error } = consumeStreamLines(incoming, pendingBuffer, onStage);
          pendingBuffer = remainder;

          if (error) {
            settle(reject, error);
          }
          if (result) {
            settle(resolve, result);
          }
        } catch (parseError) {
          settle(reject, { message: 'Failed to read summarizer progress stream.' });
        }
      };

      xhr.upload.onprogress = (event) => {
        if (onUploadProgress) onUploadProgress(event);
      };

      xhr.onprogress = () => {
        const incoming = xhr.responseText.slice(receivedLength);
        receivedLength = xhr.responseText.length;
        processIncoming(incoming);
      };

      xhr.onload = () => {
        const incoming = xhr.responseText.slice(receivedLength);
        receivedLength = xhr.responseText.length;
        processIncoming(incoming);

        if (settled) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          settle(reject, { message: 'Summarizer finished without a result.' });
          return;
        }

        try {
          const payload = JSON.parse(xhr.responseText);
          settle(reject, { message: payload?.message || 'Failed to generate summary.' });
        } catch (error) {
          settle(reject, { message: xhr.statusText || 'Failed to generate summary.' });
        }
      };

      xhr.onerror = () => {
        settle(reject, { message: 'Network error while uploading PDF.' });
      };

      xhr.send(formData);
    });
  },
};
