import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, getAccessToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            // This will trigger the refresh flow if access token is missing/expired
            // The interceptor handles the 401 -> refresh -> retry logic
            const res = await api.get('/auth/me');
            setUser(res.data);
            setToken(getAccessToken());
            // We don't get the token here, it's expected to be set by the interceptor or login
            // But wait, /me relies on the token being there. 
            // If the page just loaded, token is null.
            // The request will fail (401) OR request with no token?
            // If no token, the interceptor won't attach header.
            // The backend /me expects token.
            // So it returns 401.
            // Interceptor catches 401. 
            // Interceptor calls /refresh.
            // If success, sets token, retires /me. 
            // /me succeeds -> setUser.
        } catch (error) {
            console.error("Failed to load user", error);
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = async (mobile, password) => {
        const res = await api.post('/auth/login', { mobile, password });
        // Response contains token and user
        const { token: newToken, ...userData } = res.data;

        setAccessToken(newToken);
        setToken(newToken);
        setUser(userData);

        return userData;
    };

    const register = async (userData) => {
        const res = await api.post('/auth/register', userData);
        const { token: newToken, ...newUserData } = res.data;

        setAccessToken(newToken);
        setToken(newToken);
        setUser(newUserData);
    };

    const adminLogin = async (username, password) => {
        const res = await api.post('/auth/admin/login', { username, password });
        const { token: newToken, ...userData } = res.data;

        setAccessToken(newToken);
        setToken(newToken);
        setUser(userData);

        return userData;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error(err);
        }
        setAccessToken(null);
        setToken(null);
        setUser(null);
        // Clear local storage if any legacy data exists
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, adminLogin, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
