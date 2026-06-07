/**
 * Firebase Client SDK Configuration
 * 
 * SETUP: Add these to your frontend .env file:
 * VITE_FIREBASE_API_KEY=your_api_key
 * VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=your_project_id
 * VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * VITE_FIREBASE_APP_ID=your_app_id
 * VITE_FIREBASE_VAPID_KEY=your_vapid_key
 */

import api from '../api/axios';

let messagingInstance = null;
let firebaseInitialized = false;

/**
 * Dynamically import and initialize Firebase (lazy load)
 */
const getFirebaseMessaging = async () => {
    if (messagingInstance) return messagingInstance;

    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey || apiKey === 'your_api_key') {
        console.warn('[FCM] Firebase not configured — push notifications disabled');
        return null;
    }

    try {
        const { initializeApp } = await import('firebase/app');
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

        const firebaseConfig = {
            apiKey,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        const app = initializeApp(firebaseConfig);
        messagingInstance = getMessaging(app);
        firebaseInitialized = true;
        
        // ─── Foreground message handler ───────────────────────────────────────
        // When the app is in the foreground, FCM delivers here (not the SW).
        // We do two things:
        //   1. Fire an in-app toast via CustomEvent (NotificationToast listens)
        //   2. Ask the service worker to showNotification() → triggers OS sound on Android
        onMessage(messagingInstance, (payload) => {
            console.log('[FCM] Foreground message:', payload);

            // 1. In-app toast notification (Teams-style slide-in with sound)
            window.dispatchEvent(
                new CustomEvent('trackon:notification', { detail: payload })
            );

            // 2. OS-level notification via service worker (gives sound on Android
            //    even when the PWA tab is in focus)
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    payload
                });
            }
        });

        return messagingInstance;
    } catch (error) {
        console.error('[FCM] Firebase init failed:', error);
        return null;
    }
};

/**
 * Request notification permission and register FCM token
 * @param {string} endpoint - '/api/member/fcm-token' or '/api/auth/fcm-token'
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async (endpoint = '/api/member/fcm-token') => {
    if (!('Notification' in window)) {
        console.warn('[FCM] Notifications not supported in this browser');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('[FCM] Notification permission denied');
            return false;
        }

        const messaging = await getFirebaseMessaging();
        if (!messaging) return false;

        const { getToken } = await import('firebase/messaging');
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration
        });

        if (token) {
            const oldToken = localStorage.getItem('fcm_token');
            
            // Send token to backend ALWAYS to sync `lastUsed` and recover from DB wipes
            await api.post(endpoint, { token, oldToken, device: 'web' });
            localStorage.setItem('fcm_token', token);
            console.log('[FCM] Token synchronized with backend successfully');
            
            return true;
        }

        return false;
    } catch (error) {
        console.error('[FCM] Permission/token error:', error);
        return false;
    }
};

/**
 * Check if notifications are supported and permitted
 */
export const getNotificationStatus = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', 'default'
};

/**
 * Check if Firebase is configured
 */
export const isFirebaseConfigured = () => {
    const key = import.meta.env.VITE_FIREBASE_API_KEY;
    return key && key !== 'your_api_key' && key !== '';
};

export default getFirebaseMessaging;
