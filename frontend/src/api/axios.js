import axios from 'axios';

// Fail fast if env var is missing
if (!import.meta.env.VITE_API_URL) {
    throw new Error('VITE_API_URL is not defined');
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // Important for cookies (refresh token)
});

// Headers configuration removed to prevent overriding FormData defaults
// Axios natively sends application/json when passing JS objects.

let inMemoryToken = null;
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const setAccessToken = (token) => {
    inMemoryToken = token;
};

export const getAccessToken = () => {
    return inMemoryToken;
};

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops:
        // 1. Check if it's 401
        // 2. Check if we already retried
        // 3. Check if the failed request was NOT a login or refresh attempt itself
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/login') &&
            !originalRequest.url.includes('/refresh')
        ) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Use the same api instance for consistency
                // The URL must be explicit as per new requirements
                const res = await api.post('/api/auth/refresh');

                const newAccessToken = res.data.token;
                setAccessToken(newAccessToken);

                processQueue(null, newAccessToken);

                // Update header for original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry original request
                return api(originalRequest);
            } catch (err) {
                // Refresh failed - clean up
                processQueue(err, null);
                setAccessToken(null);
                // The AuthContext will handle the redirect/logout via its own error boundaries or state checks
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
