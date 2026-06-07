import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            // Restore session from httpOnly refresh token cookie (valid 7 days)
            const resRefresh = await api.post('/api/auth/refresh');
            const newAccessToken = resRefresh.data.token;

            setAccessToken(newAccessToken);
            setToken(newAccessToken);

            const userData = resRefresh.data.user;
            if (userData && userData.role === 'member') {
                // Member: fetch full profile so pages have all data (expiry, gym, plan etc.)
                try {
                    const profileRes = await api.get('/api/member/profile');
                    setUser({ ...profileRes.data, role: 'member' });
                } catch {
                    // Fallback to minimal data if profile fetch fails
                    setUser(userData);
                }
            } else {
                // Owner/Admin: fetch full user details
                const res = await api.get('/api/auth/me');
                setUser(res.data);
            }
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

    // Member login — scoped to a gym
    const memberLogin = async (mobile, password, gymId) => {
        const res = await api.post('/api/member/auth/login', { mobile, password, gymId });
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
            const fcmToken = localStorage.getItem('fcm_token');
            await api.post('/api/auth/logout', { fcmToken });
            localStorage.removeItem('fcm_token');
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
        <AuthContext.Provider value={{ user, token, loading, login, memberLogin, register, adminLogin, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
