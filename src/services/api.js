import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './authStorage';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let refreshPromise = null;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;

        if (status !== 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearTokens();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = axios.post('http://localhost:8080/api/v1/auth/refresh', { refreshToken });
            }

            const refreshRes = await refreshPromise;
            setTokens({
                accessToken: refreshRes.data.accessToken,
                refreshToken: refreshRes.data.refreshToken,
            });

            originalRequest.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            clearTokens();
            return Promise.reject(refreshError);
        } finally {
            refreshPromise = null;
        }
    }
);

export const stallService = {
    getAll: (params) => api.get('/api/v1/stalls', { params }),
    getById: (id, params) => api.get(`/api/v1/stalls/${id}`, { params }),
    create: (data) => api.post('/api/v1/stalls', data),
    update: (id, data) => api.put(`/api/v1/stalls/${id}`, data),
    delete: (id) => api.delete(`/api/v1/stalls/${id}`),
    search: (params) => api.get('/api/v1/stalls/search', { params }),
    sync: (params) => api.get('/api/v1/stalls/sync', { params }),
    nearby: (lat, lon) => api.get('/api/v1/stalls/nearby', { params: { lat, lon } }),
    generateAudio: (id, lang) => api.post(`/api/v1/stalls/${id}/audio/generate`, null, { params: { lang } }),
    generateAllAudio: (id) => api.post(`/api/v1/stalls/${id}/audio/generate-all`),
};

export const adminService = {
    // Audio Group
    listAudio: () => api.get('/api/v1/admin/audio'),
    regenerateAudio: (stallId) => api.post(`/api/v1/admin/audio/regenerate/${stallId}`),
    listOrphanedAudio: () => api.get('/api/v1/admin/audio/orphaned'),
    deleteAudio: (fileName) => api.delete(`/api/v1/admin/audio/${fileName}`),

    // System Group
    importJson: (data) => api.post('/api/v1/admin/import-json', data),

    // Account Management
    listOwnerAccounts: () => api.get('/api/v1/admin/accounts/owners'),
    listAvailableStalls: () => api.get('/api/v1/admin/accounts/available-stalls'),
    createOwnerAccount: (data) => api.post('/api/v1/admin/accounts/owners', data),
};

export const analyticsService = {
    getActiveUsers: (minutes = 5) => api.get('/api/v1/analytics/active-users', { params: { minutes } }),
    getPoiRanking: ({ from, to, limit = 10 }) =>
        api.get('/api/v1/analytics/poi-ranking', { params: { from, to, limit } }),
    getHourlyHeatmap: (stallId) =>
        api.get('/api/v1/analytics/hourly-heatmap', {
            params: stallId ? { stallId } : undefined,
        }),
    getAudioEngagement: (stallId) =>
        api.get('/api/v1/analytics/audio-engagement', {
            params: stallId ? { stallId } : undefined,
        }),
    getSessionStats: () => api.get('/api/v1/analytics/session-stats'),
    getDailySummary: ({ from, to }) =>
        api.get('/api/v1/analytics/daily-summary', { params: { from, to } }),
    track: (data) => api.post('/api/v1/analytics/track', data),
    trackBatch: (data) => api.post('/api/v1/analytics/track/batch', data),
};

export const authService = {
    register: (payload) => api.post('/api/v1/auth/register', payload),
    registerOwner: (payload) => api.post('/api/v1/auth/register-owner', payload),
    login: (payload) => api.post('/api/v1/auth/login', payload),
    refresh: (refreshToken) => api.post('/api/v1/auth/refresh', { refreshToken }),
    logout: () => api.post('/api/v1/auth/logout'),
    getGoogleOAuthUrl: () => 'http://localhost:8080/oauth2/authorization/google',
};

export default api;
