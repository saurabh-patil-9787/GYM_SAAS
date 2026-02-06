import axios from 'axios';

// Create a standalone instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // Important for cookies
});

// We need a way to inject the token. 
// Since we can't easily access React Context here, we'll expose a setter or export a variable.
// But better pattern: The Interceptor reads from a variable that the Context updates?
// OR: The Context attaches the interceptor? No, that causes circular deps or complex logic.
// Simplest: Export a function to set the token, or store it in a closure here.

let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
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

        // Prevent infinite loops
        // Prevent infinite loops and don't retry for login endpoints
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/login')) {
            originalRequest._retry = true;

            try {
                // Call refresh endpoint
                // We use a separate instance or the same one?
                // If we use 'api', we risk loop if refresh also 401s.
                // But refresh endpoint relies on Cookie, not Authorization header.
                // So it should be fine as long as we don't attach bad token? 
                // Using axios directly for refresh avoids interceptors running on it
                const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`, {}, {
                    withCredentials: true
                });

                const newAccessToken = res.data.token;
                setAccessToken(newAccessToken);

                // Update header for original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (err) {
                // Refresh failed - logout
                // We could dispatch an event or callback
                // For now, let the caller handle the final error (AuthContext)
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
