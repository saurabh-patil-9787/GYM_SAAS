/**
 * Capacitor FCM — Native Android Push Notification Integration
 *
 * Uses @capacitor-firebase/messaging for all native FCM operations.
 * This file MUST NOT import or initialize the Firebase Web SDK.
 * The existing web FCM implementation in utils/firebase.js is unchanged.
 *
 * Functions here are intentionally not called at module import time.
 * They must be called explicitly by authenticated application code.
 */

import api from '../api/axios';
import { isAndroidApp } from './platformUtils';

/** localStorage key for the Android FCM token */
const ANDROID_TOKEN_KEY = 'fcm_token_android';

/**
 * Safely import @capacitor-firebase/messaging.
 * Returns null without throwing if the plugin is unavailable
 * (e.g., running in a browser/PWA build).
 *
 * @returns {Promise<object|null>}
 */
const getCapacitorFirebaseMessaging = async () => {
    try {
        const mod = await import('@capacitor-firebase/messaging');
        return mod.FirebaseMessaging || null;
    } catch (err) {
        console.warn('[CapacitorFCM] @capacitor-firebase/messaging not available:', err.message);
        return null;
    }
};

// ─── Active listener handles (for cleanup if needed) ─────────────────────────
let _tokenChangeListener = null;
let _foregroundMessageListener = null;
let _notificationActionListener = null;

// ─── 1. initializeCapacitorFCM ───────────────────────────────────────────────

/**
 * Initialize native FCM for Android.
 *
 * - Runs only when executing inside a Capacitor Android shell.
 * - Requests notification permission via the Capacitor Firebase Messaging plugin.
 * - Retrieves the native FCM token.
 * - Stores the token in localStorage under `fcm_token_android`.
 *
 * Call this AFTER the user is authenticated.
 *
 * @returns {Promise<string|null>} The FCM token, or null on failure.
 */
export const initializeCapacitorFCM = async () => {
    if (!isAndroidApp()) {
        console.log('[CapacitorFCM] Not running as native Android — skipping initialization.');
        return null;
    }

    const FirebaseMessaging = await getCapacitorFirebaseMessaging();
    if (!FirebaseMessaging) {
        console.warn('[CapacitorFCM] Plugin unavailable — cannot initialize.');
        return null;
    }

    try {
        // Request / check notification permission
        const { receive: permissionStatus } = await FirebaseMessaging.checkPermissions();

        let granted = permissionStatus === 'granted';

        if (!granted) {
            const { receive: requested } = await FirebaseMessaging.requestPermissions();
            granted = requested === 'granted';
        }

        if (!granted) {
            console.warn('[CapacitorFCM] Notification permission not granted.');
            return null;
        }

        try {
            await FirebaseMessaging.createChannel({
                id: 'trackon_default',
                name: 'Majhi Gym Notifications',
                description: 'General gym notifications, updates, and reminders',
                importance: 3,
                vibration: true,
                visibility: 0
            });
            await FirebaseMessaging.createChannel({
                id: 'renewal_critical',
                name: 'Membership Alerts',
                description: 'Urgent membership renewal and payment notifications',
                importance: 4,
                vibration: true,
                visibility: 1
            });
        } catch (channelErr) {
            console.warn('[CapacitorFCM] Failed to create notification channels:', channelErr);
        }

        // Retrieve the native FCM token
        const { token } = await FirebaseMessaging.getToken();

        if (token) {
            localStorage.setItem(ANDROID_TOKEN_KEY, token);
            console.log('[CapacitorFCM] Token stored:', token.substring(0, 20) + '...');
            return token;
        }

        console.warn('[CapacitorFCM] getToken() returned no token.');
        return null;
    } catch (err) {
        console.error('[CapacitorFCM] initializeCapacitorFCM error:', err);
        return null;
    }
};

// ─── 2. getAndroidFCMToken ───────────────────────────────────────────────────

/**
 * Return the stored Android FCM token from localStorage.
 *
 * @returns {string|null}
 */
export const getAndroidFCMToken = () => {
    return localStorage.getItem(ANDROID_TOKEN_KEY) || null;
};

// ─── 3. registerAndroidFCMToken ──────────────────────────────────────────────

/**
 * Retrieve the native FCM token, persist it locally, and POST it to the backend.
 *
 * The caller is responsible for specifying the user role so this function
 * never guesses the authenticated user type.
 *
 * @param {'owner'|'member'} userRole - 'owner' posts to /api/auth/fcm-token;
 *                                       'member' posts to /api/member/fcm-token.
 * @returns {Promise<boolean>} true on success, false on any failure.
 */
export const registerAndroidFCMToken = async (userRole) => {
    if (!isAndroidApp()) {
        console.log('[CapacitorFCM] Not native Android — skipping token registration.');
        return false;
    }

    if (!userRole || !['owner', 'member'].includes(userRole)) {
        console.error('[CapacitorFCM] registerAndroidFCMToken: userRole must be "owner" or "member".');
        return false;
    }

    const FirebaseMessaging = await getCapacitorFirebaseMessaging();
    if (!FirebaseMessaging) {
        console.warn('[CapacitorFCM] Plugin unavailable — cannot register token.');
        return false;
    }

    try {
        const { token } = await FirebaseMessaging.getToken();

        if (!token) {
            console.warn('[CapacitorFCM] No token returned from getToken().');
            return false;
        }

        const oldToken = localStorage.getItem(ANDROID_TOKEN_KEY);

        // Persist the latest token locally
        localStorage.setItem(ANDROID_TOKEN_KEY, token);

        // Select the correct backend endpoint based on user role
        const endpoint = userRole === 'owner'
            ? '/api/auth/fcm-token'
            : '/api/member/fcm-token';

        // POST using the existing Axios instance (includes auth interceptors)
        await api.post(endpoint, {
            token,
            oldToken,
            device: 'android',
        });

        console.log(`[CapacitorFCM] Token registered to ${endpoint}`);
        return true;
    } catch (err) {
        console.error('[CapacitorFCM] registerAndroidFCMToken error:', err);
        return false;
    }
};

// ─── 4. setupCapacitorFCMListeners ──────────────────────────────────────────

/**
 * Attach native FCM event listeners using @capacitor-firebase/messaging.
 *
 * Dispatches browser CustomEvents that future UI code can consume:
 *   - `trackon:notification`        — foreground message received
 *   - `trackon:notification-action` — user tapped a notification
 *
 * Token-change events refresh the stored token in localStorage and
 * log the new value; backend re-registration is intentionally left
 * to the caller (do it by calling registerAndroidFCMToken again).
 *
 * Safe to call in a browser build — exits early if not native Android.
 *
 * @returns {Promise<void>}
 */
export const setupCapacitorFCMListeners = async () => {
    if (!isAndroidApp()) {
        console.log('[CapacitorFCM] Not native Android — skipping FCM listeners.');
        return;
    }

    const FirebaseMessaging = await getCapacitorFirebaseMessaging();
    if (!FirebaseMessaging) {
        console.warn('[CapacitorFCM] Plugin unavailable — cannot attach listeners.');
        return;
    }

    // Remove any previously attached listeners to avoid duplicates
    try {
        if (_tokenChangeListener)         { await _tokenChangeListener.remove();         _tokenChangeListener = null; }
        if (_foregroundMessageListener)   { await _foregroundMessageListener.remove();   _foregroundMessageListener = null; }
        if (_notificationActionListener)  { await _notificationActionListener.remove();  _notificationActionListener = null; }
    } catch (cleanupErr) {
        console.warn('[CapacitorFCM] Listener cleanup warning:', cleanupErr.message);
    }

    try {
        // ── Token refresh ──────────────────────────────────────────────────────
        _tokenChangeListener = await FirebaseMessaging.addListener(
            'tokenReceived',
            ({ token }) => {
                if (!token) return;
                console.log('[CapacitorFCM] Token refreshed:', token.substring(0, 20) + '...');
                localStorage.setItem(ANDROID_TOKEN_KEY, token);
                // Dispatch for any listener that wants to re-register the new token
                window.dispatchEvent(
                    new CustomEvent('trackon:fcm-token-refresh', { detail: { token } })
                );
            }
        );

        // ── Foreground messages ────────────────────────────────────────────────
        // Fires when a data/notification message arrives while the app is open.
        //
        // The Capacitor Firebase Messaging plugin delivers a flat object:
        //   { id, title, body, data: { ...customFields } }
        //
        // NotificationToast.jsx (and the web FCM path in firebase.js) expect
        // the Firebase Web SDK MessagePayload shape:
        //   { notification: { title, body }, data: { ...customFields } }
        //
        // We normalize here so the existing toast UI works identically on
        // Android without any changes to NotificationToast.jsx.
        // All custom FCM data fields (type, tone, notificationId, link, etc.)
        // are preserved verbatim inside the `data` key.
        _foregroundMessageListener = await FirebaseMessaging.addListener(
            'notificationReceived',
            (notification) => {
                console.log('[CapacitorFCM] Foreground notification (raw):', notification);

                const inner = notification.notification || notification;

                // Normalize flat Capacitor payload → Web FCM MessagePayload shape
                const normalized = {
                    notification: {
                        title: inner.title || '',
                        body:  inner.body  || '',
                    },
                    data: inner.data || {},
                };

                console.log('[CapacitorFCM] Foreground notification (normalized):', normalized);
                window.dispatchEvent(
                    new CustomEvent('trackon:notification', { detail: normalized })
                );
            }
        );

        // ── Notification tap / action ──────────────────────────────────────────
        // Fires when the user taps on a notification in the system tray
        _notificationActionListener = await FirebaseMessaging.addListener(
            'notificationActionPerformed',
            (action) => {
                console.log('[CapacitorFCM] Notification action:', action);
                window.dispatchEvent(
                    new CustomEvent('trackon:notification-action', { detail: action })
                );
            }
        );

        console.log('[CapacitorFCM] Native FCM listeners registered.');
    } catch (err) {
        console.error('[CapacitorFCM] setupCapacitorFCMListeners error:', err);
    }
};
