import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastSessionId');
      // Only reload if we're not on login page
      if (window.location.pathname !== '/') {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post('/api/auth/register', { username, email, password }),
  
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
};

export const chatAPI = {
  createSession: () => api.post('/api/chat/sessions'),
  
  getSessions: () => api.get('/api/chat/sessions'),
  
  getMessages: (sessionId: string) =>
    api.get(`/api/chat/sessions/${sessionId}/messages`),
  
  deleteSession: (sessionId: string) =>
    api.delete(`/api/chat/sessions/${sessionId}`),
};

export const fileAPI = {
  uploadFile: (sessionId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/files/upload/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getFiles: (sessionId: string) =>
    api.get(`/api/files/${sessionId}`),
};

export default api;