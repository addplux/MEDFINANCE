/**
 * MEDFINANCE360 API Client
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Axios instance with:
 *  - Auth token injection
 *  - 401 redirect
 *  - Offline queue: failed mutations (POST/PUT/DELETE/PATCH) are stored
 *    in IndexedDB and replayed when connectivity is restored.
 */

import axios from 'axios';
import { enqueue } from './offlineQueue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;

        // 401 Unauthorized — clear session and redirect to login
        if (response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Network error (no response) on mutating requests — queue for offline sync
        const isMutation = config &&
            ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase());

        if (!response && isMutation) {
            try {
                // Strip the baseURL prefix to store just the path
                const url = config.url?.startsWith('http')
                    ? config.url
                    : config.url; // already relative like /patients

                await enqueue({
                    method: config.method.toUpperCase(),
                    url: url,
                    data: (typeof config.data === 'string' && config.data !== 'undefined') ? JSON.parse(config.data) : config.data,
                    headers: {
                        ...(config.headers?.Authorization
                            ? { Authorization: config.headers.Authorization }
                            : {}),
                    },
                });

                // Notify the OfflineContext to refresh the pending count
                window.dispatchEvent(new CustomEvent('medfinance-queue-changed'));

                // Return a synthetic "queued offline" response so the UI
                // can show a success-like message instead of an error.
                return Promise.resolve({
                    data: {
                        offline: true,
                        queued: true,
                        message: 'Saved offline — will sync when connected',
                    },
                    status: 202,
                    statusText: 'Accepted (Offline)',
                    headers: {},
                    config,
                });
            } catch (queueError) {
                console.error('[apiClient] Failed to queue offline request:', queueError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
