/* eslint-disable no-undef */
/**
 * Firebase Messaging Service Worker
 * Handles BOTH background push notifications (FCM) and foreground messages
 * forwarded from the app via postMessage({ type: 'SHOW_NOTIFICATION' }).
 * On mobile: shows native OS notification with sound, badge, vibration.
 * On tap: deep-links into the correct screen based on notification type.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: 'AIzaSyDX4tuazCOZRl87tuDoiondPcMZ4BFGjmQ',
    authDomain: 'gym-saas-notifications.firebaseapp.com',
    projectId: 'gym-saas-notifications',
    storageBucket: 'gym-saas-notifications.firebasestorage.app',
    messagingSenderId: '640270651112',
    appId: '1:640270651112:web:16bc073b3e48552fd0835d'
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ─── Deep-link map by notification type ──────────────────────────────────────
// Backend sends `data.type` and `data.link` in the FCM payload.
// If link is not present, we use the type to pick the best destination.
const getLinkFromType = (type, data) => {
    if (data && data.link) return data.link;
    switch (type) {
        // Owner receives these → tap opens owner dashboard
        case 'new_registration_request': return '/dashboard';
        case 'fresh_start_request':      return '/dashboard';
        case 'member_stopped':           return '/dashboard';
        case 'member_rejoined':          return '/dashboard';
        case 'online_payment_received':  return '/dashboard';

        // Member receives these → tap opens relevant member screen
        case 'registration_approved':    return '/member/dashboard';
        case 'registration_rejected':    return '/member/dashboard';
        case 'fresh_start_approved':     return '/member/dashboard';
        case 'fresh_start_rejected':     return '/member/dashboard';
        case 'renewal_approved':         return '/member/dashboard';
        case 'membership_expired':       return '/member/dashboard';
        case 'renewal_reminder':         return '/member/plans';
        case 'payment_recorded':         return '/member/transactions';

        // Habit Reminders
        case 'water_reminder':           return '/member/fitness/water-tracker';
        case 'measurementReminder':      return '/member/fitness/body-progress';
        case 'weeklyGoalCheckin':        return '/member/fitness/goals';
        case 'gymDayReminder':           return '/member/dashboard';

        default: return '/';
    }
};


// ─── Background message handler ───────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const title = payload.notification?.title || 'माझी जिम';
    const body = payload.notification?.body || '';
    const type = payload.data?.type || '';
    const link = getLinkFromType(type, payload.data);
    const tone = payload.data?.tone || '';
    const notifId = payload.data?.notificationId || '';

    const isHigh = tone === 'urgent';
    const isCritical = tone === 'last_chance' || tone === 'winback' || tone === 'final';

    // Report "delivered" status back to analytics
    if (notifId) {
        fetch(`/api/notifications/public/${notifId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'delivered' })
        }).catch(() => {});
    }

    self.registration.showNotification(title, {
        body,
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        vibrate: isCritical
            ? [500, 150, 500, 150, 500, 150, 500] // Pulsing alarm vibration
            : isHigh
            ? [250, 100, 250, 100, 250] // Warning vibration
            : [200, 100, 200], // Normal short vibe
        tag: type || 'trackon-notification',
        renotify: true,
        requireInteraction: isCritical || isHigh, // Sticky for urgent alerts
        data: {
            link,
            type,
            notificationId: notifId,
            ...payload.data
        },
        actions: (isCritical || isHigh) ? [
            { action: 'open', title: '💳 Renew Now' },
            { action: 'dismiss', title: 'Dismiss' }
        ] : [
            { action: 'open', title: '👁️ View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    });
});

// ─── Notification click handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const notifId = event.notification.data?.notificationId;

    if (event.action === 'dismiss') {
        if (notifId) {
            event.waitUntil(
                fetch(`/api/notifications/public/${notifId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'ignored' })
                }).catch(() => {})
            );
        }
        return;
    }

    // Report "clicked" status
    if (notifId) {
        event.waitUntil(
            fetch(`/api/notifications/public/${notifId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'clicked' })
            }).catch(() => {})
        );
    }

    const link = event.notification.data?.link || '/';
    const fullUrl = self.location.origin + link;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If the app is already open in a tab — focus it and navigate
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.focus();
                    return client.navigate(fullUrl);
                }
            }
            // Otherwise open a new window
            return clients.openWindow(fullUrl);
        })
    );
});

// ─── Foreground notification relay ───────────────────────────────────────────
// When the app is open (foreground), FCM delivers to onMessage() in firebase.js.
// The app postMessages here so we can call showNotification() and trigger
// the OS-level sound + banner on Android — identical to background behavior.
self.addEventListener('message', (event) => {
    if (event.data?.type !== 'SHOW_NOTIFICATION') return;

    const payload = event.data.payload;
    if (!payload) return;

    const title = payload.notification?.title || 'माझी जिम';
    const body = payload.notification?.body || '';
    const type = payload.data?.type || '';
    const link = getLinkFromType(type, payload.data);

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: '/android-chrome-192x192.png',
            badge: '/favicon-32x32.png',
            vibrate: [200, 100, 200, 100, 200],
            tag: type || 'trackon-foreground',
            renotify: true,
            data: { link, type, ...payload.data },
            actions: [
                { action: 'open', title: '\ud83d\udc41\ufe0f View' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        })
    );
});

// ─── Push subscription change ─────────────────────────────────────────────────
// Fires when the browser rotates the push subscription automatically.
// Silently handles it to prevent notification loss.
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[SW] Push subscription changed — re-subscribing...');
    event.waitUntil(
        self.registration.pushManager.subscribe(event.oldSubscription.options)
            .then(subscription => {
                console.log('[SW] Re-subscribed:', subscription.endpoint);
            })
    );
});
