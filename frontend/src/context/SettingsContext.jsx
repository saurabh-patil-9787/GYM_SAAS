import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        isOnlinePaymentEnabled: true,
        subscriptionMessage: "Online payment is currently stopped. Please connect with admin for plan renewal."
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/api/settings');
            if (res.data.success && res.data.settings) {
                setSettings(res.data.settings);
            }
        } catch (error) {
            console.error("Failed to fetch settings from backend", error);
        } finally {
            setLoading(false);
        }
    };

    const updateSettingsState = (newSettings) => {
        setSettings({ ...settings, ...newSettings });
    };

    useEffect(() => {
        fetchSettings();

        // 30s polling interval to keep UI in sync without manual refresh
        const interval = setInterval(fetchSettings, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettingsState, refreshSettings: fetchSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
