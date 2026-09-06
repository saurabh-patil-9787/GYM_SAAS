/**
 * RealtimeContext.jsx
 *
 * Global real-time event bus for the member portal.
 * Wraps the MemberLayout with a single SSE connection and broadcasts
 * events to any component that calls useRealtimeEvent().
 *
 * Member pages subscribe to specific events and refetch their own data.
 *
 * Architecture:
 *   MemberLayout
 *     └─ RealtimeProvider (one SSE connection)
 *         ├─ MemberDashboard  → listens: renewal_approved, notification
 *         ├─ MemberNotifications → listens: notification
 *         ├─ MemberInvoices   → listens: invoice_created
 *         └─ MemberPlans      → listens: renewal_approved, renewal_rejected
 */

import React, { createContext, useContext, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useServerEvents } from '../hooks/useServerEvents';

const RealtimeContext = createContext(null);

/**
 * Register a callback for a specific SSE event name.
 * Returns an unsubscribe function.
 *
 * @param {string}   eventName  - e.g. 'renewal_approved'
 * @param {Function} callback   - (data) => void
 */
export function useRealtimeEvent(eventName, callback) {
    const ctx = useContext(RealtimeContext);
    const cbRef = useRef(callback);
    cbRef.current = callback;

    React.useEffect(() => {
        if (!ctx) return;
        return ctx.subscribe(eventName, (data) => cbRef.current(data));
    }, [eventName]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Wraps member pages. Maintains a single SSE connection for the
 * logged-in member and distributes events to subscribed components.
 */
export function RealtimeProvider({ children, role = 'member' }) {
    const { user } = useAuth();
    const listenersRef = useRef({}); // eventName → Set<callback>

    // Subscribe a listener. Returns an unsubscribe fn.
    const subscribe = useCallback((eventName, cb) => {
        if (!listenersRef.current[eventName]) {
            listenersRef.current[eventName] = new Set();
        }
        listenersRef.current[eventName].add(cb);
        return () => {
            listenersRef.current[eventName]?.delete(cb);
        };
    }, []);

    // SSE event handler — dispatch to all subscribers
    const handleEvent = useCallback((eventName, data) => {
        const listeners = listenersRef.current[eventName];
        if (!listeners) return;
        for (const cb of listeners) {
            try { cb(data); } catch { /* subscriber threw */ }
        }
    }, []);

    // Only open SSE connection when member is logged in
    const isLoggedIn = !!user && user.role === role;
    useServerEvents(handleEvent, role, isLoggedIn);

    return (
        <RealtimeContext.Provider value={{ subscribe }}>
            {children}
        </RealtimeContext.Provider>
    );
}

/**
 * Owner-side realtime provider (same mechanism, different role).
 */
export function OwnerRealtimeProvider({ children }) {
    const { user } = useAuth();
    const listenersRef = useRef({});

    const subscribe = useCallback((eventName, cb) => {
        if (!listenersRef.current[eventName]) {
            listenersRef.current[eventName] = new Set();
        }
        listenersRef.current[eventName].add(cb);
        return () => {
            listenersRef.current[eventName]?.delete(cb);
        };
    }, []);

    const handleEvent = useCallback((eventName, data) => {
        const listeners = listenersRef.current[eventName];
        if (!listeners) return;
        for (const cb of listeners) {
            try { cb(data); } catch { /* */ }
        }
    }, []);

    const isOwner = !!user && user.role === 'owner';
    useServerEvents(handleEvent, 'owner', isOwner);

    return (
        <RealtimeContext.Provider value={{ subscribe }}>
            {children}
        </RealtimeContext.Provider>
    );
}
