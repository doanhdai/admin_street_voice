import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' },
});

export const stallService = {
    getAll: () => api.get('/api/v1/stalls'),
    getById: (id) => api.get(`/api/v1/stalls/${id}`),
    create: (data) => api.post('/api/v1/stalls', data),
    update: (id, data) => api.put(`/api/v1/stalls/${id}`, data),
    delete: (id) => api.delete(`/api/v1/stalls/${id}`),
    sync: (params) => api.get('/api/v1/stalls/sync', { params }),
    nearby: (lat, lon) => api.get('/api/v1/stalls/nearby', { params: { lat, lon } }),
};

export const analyticsService = {
    track: (data) => api.post('/api/v1/analytics/track', data),
};

export default api;
