import axios from 'axios';

// Use the Vite proxy - in development the Vite dev server proxies /api to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          localStorage.setItem('adminToken', accessToken);
          localStorage.setItem('adminRefreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Profile
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data: any) => api.put('/admin/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/admin/change-password', data),

  // Users
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  suspendUser: (id: string) => api.put(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => api.put(`/admin/users/${id}/activate`),
  resetUserPassword: (id: string, newPassword: string) =>
    api.put(`/admin/users/${id}/reset-password`, { newPassword }),

  // Materials
  getMaterials: (params?: any) => api.get('/admin/materials', { params }),
  createMaterial: (data: any) => api.post('/admin/materials', data),
  updateMaterial: (id: string, data: any) =>
    api.put(`/admin/materials/${id}`, data),
  deleteMaterial: (id: string) => api.delete(`/admin/materials/${id}`),

  // IS Codes
  getISCodes: (params?: any) => api.get('/admin/iscodes', { params }),
  createISCode: (data: any) => api.post('/admin/iscodes', data),
  updateISCode: (id: string, data: any) =>
    api.put(`/admin/iscodes/${id}`, data),
  deleteISCode: (id: string) => api.delete(`/admin/iscodes/${id}`),

  // Learning Center
  getArticles: (params?: any) => api.get('/admin/learning/articles', { params }),
  createArticle: (data: any) => api.post('/admin/learning/articles', data),
  updateArticle: (id: string, data: any) =>
    api.put(`/admin/learning/articles/${id}`, data),
  deleteArticle: (id: string) => api.delete(`/admin/learning/articles/${id}`),

  getTutorials: (params?: any) => api.get('/admin/learning/tutorials', { params }),
  createTutorial: (data: any) => api.post('/admin/learning/tutorials', data),
  updateTutorial: (id: string, data: any) =>
    api.put(`/admin/learning/tutorials/${id}`, data),
  deleteTutorial: (id: string) => api.delete(`/admin/learning/tutorials/${id}`),

  // Categories
  getMaterialCategories: () => api.get('/admin/categories/materials'),
  getISCodeCategories: () => api.get('/admin/categories/iscodes'),
  getLearningCategories: () => api.get('/admin/categories/learning'),

  // Notifications
  getNotifications: (params?: any) =>
    api.get('/admin/notifications', { params }),
  createNotification: (data: any) => api.post('/admin/notifications', data),
  deleteNotification: (id: string) =>
    api.delete(`/admin/notifications/${id}`),

  // Analytics
  getAnalytics: (params?: any) => api.get('/admin/analytics', { params }),

  // Reports
  getUserReport: (params?: any) => api.get('/admin/reports/users', { params }),
  getDownloadReport: (params?: any) =>
    api.get('/admin/reports/downloads', { params }),
  getActivityReport: (params?: any) =>
    api.get('/admin/reports/activity', { params }),
  getMaterialReport: () => api.get('/admin/reports/materials'),
  getLearningReport: () => api.get('/admin/reports/learning'),

  // Activity Logs
  getActivityLogs: (params?: any) =>
    api.get('/admin/activity-logs', { params }),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.put('/admin/settings', data),

  // Upload
  uploadFile: (data: {
    fileUrl: string;
    publicId: string;
    originalName: string;
    size: string;
    format: string;
    folder?: string;
  }) => api.post('/admin/upload', data),
};

export default api;