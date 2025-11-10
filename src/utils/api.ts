import apiEndpoints from '@/config/api-endpoints';
import { useAdminStore } from '@/store/admin.store';
import { useAuthStore } from '@/store/auth.store';
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const adminEndpoints = Object.values(apiEndpoints.admin);
    const isAdminCall = adminEndpoints.some((endpoint) => config.url?.includes(endpoint));

    if (isAdminCall) {
        const { token } = useAdminStore.getState();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } else {
        const { token } = useAuthStore.getState();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const { logout } = useAuthStore.getState();
            logout();
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;
