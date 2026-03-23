import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' },
});

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
};

export const analyticsService = {
    track: (data) => api.post('/api/v1/analytics/track', data),
};

export default api;
