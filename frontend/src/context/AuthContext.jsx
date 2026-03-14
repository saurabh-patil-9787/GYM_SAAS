import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            // Explicit Token Restoration on Application Startup
            const resRefresh = await api.post('/api/auth/refresh');
            const newAccessToken = resRefresh.data.token;
            
            // Sync to axios memory
            setAccessToken(newAccessToken);
            setToken(newAccessToken);

            // Safely fetch user details using the restored session
            const res = await api.get('/api/auth/me');
            setUser(res.data);
        } catch (error) {
            console.log("No active session found during startup.");
            setAccessToken(null);
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = async (mobile, password) => {
        const res = await api.post('/api/auth/login', { mobile, password });
        // Response contains token and user
        const { token: newToken, ...userData } = res.data;

        setAccessToken(newToken);
        setToken(newToken);
        setUser(userData);

        return userData;
    };

    const register = async (userData) => {
        const res = await api.post('/api/auth/register', userData);
        const { token: newToken, ...newUserData } = res.data;

        setAccessToken(newToken);
        setToken(newToken);
        setUser(newUserData);
    };

    const adminLogin = async (username, password) => {
        const res = await api.post('/api/auth/admin/login', { username, password });
        const { token: newToken, ...userData } = res.data;

        setAccessToken(newToken);
        setToken(newToken);
        setUser(userData);

        return userData;
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (err) {
            console.error(err);
        }
        setAccessToken(null);
        setToken(null);
        setUser(null);
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
