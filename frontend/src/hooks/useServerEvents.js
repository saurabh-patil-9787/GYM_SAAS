/**
 * useServerEvents.js
 *
 * Connects to the backend SSE stream (/api/stream) and fires a callback
 * whenever the server sends a named event.
 *
 * Usage:
 *   useServerEvents((eventName, data) => {
 *       if (eventName === 'renewal_approved') refetchProfile();
 *   });
 *
 * Features:
 * - Auto-reconnects with exponential backoff (1s → 2s → 4s → max 30s)
 * - Stops reconnecting when component unmounts
 * - Heartbeat (:ping) comments are silently ignored
 * - Works inside Capacitor WebView
 */

import { useEffect, useRef } from 'react';
import { getAccessToken } from '../api/axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * @param {function(eventName: string, data: object): void} onEvent
 * @param {'member'|'owner'} role
 * @param {boolean} enabled - Set to false to prevent connection (e.g. logged out)
 */
export function useServerEvents(onEvent, role = 'member', enabled = true) {
    const esRef      = useRef(null);
    const retryDelay = useRef(1000);
    const unmounted  = useRef(false);
    const onEventRef = useRef(onEvent);

    // Keep callback ref fresh without restarting the connection
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (!enabled) return;

        unmounted.current = false;

        function connect() {
            if (unmounted.current) return;

            const token = getAccessToken();
            if (!token) {
                // Retry after a short delay — token may not be ready yet
                setTimeout(connect, 2000);
                return;
            }

            const url = `${BASE_URL}/api/stream?role=${role}&token=${encodeURIComponent(token)}`;
            const es  = new EventSource(url);
            esRef.current = es;

            // ── Handle named events sent by the server ───────────────────────
            const EVENTS = [
                'connected',
                'notification',
                'renewal_approved',
                'renewal_rejected',
                'renewal_request',
                'registration_approved',
                'registration_rejected',
                'invoice_created',
                'member_added',
                'member_updated',
                'payment_recorded',
                'store_updated',
                'xp_awarded',
            ];

            EVENTS.forEach(eventName => {
                es.addEventListener(eventName, (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        onEventRef.current(eventName, data);
                    } catch {
                        onEventRef.current(eventName, {});
                    }
                });
            });

            es.onopen = () => {
                retryDelay.current = 1000; // Reset backoff on successful connection
            };

            es.onerror = () => {
                es.close();
                esRef.current = null;
                if (!unmounted.current) {
                    // Exponential backoff: 1s → 2s → 4s → ... → max 30s
                    const delay = retryDelay.current;
                    retryDelay.current = Math.min(delay * 2, 30000);
                    setTimeout(connect, delay);
                }
            };
        }

        connect();

        return () => {
            unmounted.current = true;
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };
    }, [role, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
