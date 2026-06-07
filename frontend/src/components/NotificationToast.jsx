import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Dumbbell } from 'lucide-react';
import api from '../api/axios';

/**
 * NotificationToast — Teams-style in-app notification overlay
 *
 * Listens for CustomEvent('trackon:notification') dispatched by firebase.js.
 * Shows a sliding banner with sound, auto-dismisses after 5 seconds,
 * and navigates to the deep link on click.
 *
 * Mount once at app root: <NotificationToast />
 */

// ─── Web Audio: play a gentle attention-grabbing chime ───────────────────────
const playNotificationSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const playTone = (freq, startTime, duration, gain = 0.25) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
        };

        const now = ctx.currentTime;
        // Two-note chime: high then slightly lower — similar to Teams ping
        playTone(880, now, 0.18, 0.3);
        playTone(660, now + 0.18, 0.22, 0.2);

        // Close AudioContext after sound finishes
        setTimeout(() => ctx.close(), 600);
    } catch {
        // Silently fail — sound is a nice-to-have
    }
};

// ─── Type → icon color mapping ────────────────────────────────────────────────
const typeColor = (type) => {
    if (!type) return 'from-indigo-500 to-purple-600';
    if (type.includes('payment')) return 'from-emerald-500 to-teal-600';
    if (type.includes('expiry') || type.includes('reminder')) return 'from-amber-500 to-orange-600';
    if (type.includes('rejected') || type.includes('stopped')) return 'from-rose-500 to-red-600';
    if (type.includes('approved') || type.includes('registration')) return 'from-indigo-500 to-purple-600';
    return 'from-indigo-500 to-purple-600';
};

// ─── Single Toast Card ────────────────────────────────────────────────────────
const ToastCard = ({ toast, onDismiss }) => {
    const navigate = useNavigate();
    const [exiting, setExiting] = useState(false);

    const DURATION = 5000; // 5 seconds

    // Auto-dismiss via a single setTimeout — no JS polling needed
    useEffect(() => {
        const timer = setTimeout(() => handleDismiss(), DURATION);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 350);
    }, [toast.id, onDismiss]);

    const handleClick = () => {
        handleDismiss();
        const isMongoId = typeof toast.id === 'string' && /^[0-9a-fA-F]{24}$/.test(toast.id);
        if (isMongoId) {
            api.put(`/api/notifications/public/${toast.id}/status`, { status: 'clicked' }).catch(() => {});
        }
        if (toast.link) {
            navigate(toast.link);
        }
    };

    const gradientClass = typeColor(toast.type);

    return (
        <div
            className={`notification-toast-card ${exiting ? 'toast-exit' : 'toast-enter'}`}
            role="alert"
            aria-live="assertive"
        >
            {/* Left accent bar */}
            <div className={`toast-accent bg-gradient-to-b ${gradientClass}`} />

            {/* Icon */}
            <div className={`toast-icon bg-gradient-to-br ${gradientClass}`}>
                <Bell size={15} className="text-white" />
            </div>

            {/* Content */}
            <div className="toast-content" onClick={handleClick}>
                <div className="toast-app-label">
                    <Dumbbell size={10} className="text-indigo-400" />
                    <span className="font-marathi">माझी जिम</span>
                </div>
                <p className="toast-title">{toast.title}</p>
                {toast.body && <p className="toast-body">{toast.body}</p>}
                {toast.link && (
                    <span className="toast-action">Tap to view →</span>
                )}
            </div>

            {/* Dismiss button */}
            <button
                onClick={(e) => { 
                    e.stopPropagation(); 
                    handleDismiss(); 
                    const isMongoId = typeof toast.id === 'string' && /^[0-9a-fA-F]{24}$/.test(toast.id);
                    if (isMongoId) {
                        api.put(`/api/notifications/public/${toast.id}/status`, { status: 'ignored' }).catch(() => {});
                    }
                }}
                className="toast-close"
                aria-label="Dismiss notification"
            >
                <X size={13} />
            </button>

            {/* Progress bar — pure CSS animation, zero JS re-renders */}
            <div className="toast-progress-track">
                <div
                    className={`toast-progress-bar toast-progress-anim bg-gradient-to-r ${gradientClass}`}
                />
            </div>
        </div>
    );
};

// ─── Web Audio: play a repeating siren sound for urgent/critical alerts ──────
const playAlarmSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        const playTone = (freq, startTime, duration) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
        };

        const now = ctx.currentTime;
        // High-pitch alternating two-tone siren
        playTone(987.77, now, 0.15); // B5 note
        playTone(987.77, now + 0.22, 0.15);
        playTone(880.00, now + 0.44, 0.3); // A5 note

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 300]);
        }

        setTimeout(() => ctx.close(), 1000);
    } catch {
        // AudioContext blocked/unsupported
    }
};

// ─── Toast Container (global) ─────────────────────────────────────────────────
const NotificationToast = () => {
    const navigate = useNavigate();
    const [toasts, setToasts] = useState([]);
    const [urgentAlert, setUrgentAlert] = useState(null);

    const alarmChannel = useRef(null);
    const isSecondTab = useRef(false);

    // BroadcastChannel: Multi-Tab Protection
    useEffect(() => {
        if ('BroadcastChannel' in window) {
            alarmChannel.current = new BroadcastChannel('trackon_alarm_channel');
            alarmChannel.current.onmessage = (event) => {
                if (event.data?.type === 'ALARM_PLAYING') {
                    isSecondTab.current = true;
                    setTimeout(() => { isSecondTab.current = false; }, 2500);
                }
            };
        }
        return () => {
            if (alarmChannel.current) alarmChannel.current.close();
        };
    }, []);

    // Loop alarm sound while urgent overlay is visible (up to 15 seconds max)
    useEffect(() => {
        if (urgentAlert) {
            const playLoop = () => {
                if (!isSecondTab.current) {
                    if (alarmChannel.current) {
                        alarmChannel.current.postMessage({ type: 'ALARM_PLAYING' });
                    }
                    playAlarmSound();
                }
            };

            playLoop();
            const intervalId = setInterval(playLoop, 2500);

            const timeoutId = setTimeout(() => {
                clearInterval(intervalId);
            }, 15000);

            return () => {
                clearInterval(intervalId);
                clearTimeout(timeoutId);
            };
        }
    }, [urgentAlert]);

    const addToast = useCallback((payload) => {
        const title = payload.notification?.title || payload.data?.title || 'माझी जिम';
        const body = payload.notification?.body || payload.data?.body || '';
        const type = payload.data?.type || '';
        const tone = payload.data?.tone || '';
        const notifId = payload.data?.notificationId || '';
        const link = payload.data?.link || null;

        const isCritical = tone === 'last_chance' || tone === 'winback' || tone === 'final' || type === 'membership_expired';
        const isHigh = tone === 'urgent' || type === 'renewal_reminder';

        // Offline / duplicate protection
        if (notifId) {
            const processedKey = `trackon_processed_${notifId}`;
            if (localStorage.getItem(processedKey)) {
                console.log('[FCM] Duplicate notification ignored:', notifId);
                return;
            }
            localStorage.setItem(processedKey, 'true');
        }

        // Report foreground delivered status
        if (notifId) {
            api.put(`/api/notifications/public/${notifId}/status`, { status: 'delivered' }).catch(() => {});
        }

        if (isCritical || isHigh) {
            const now = Date.now();

            // 15-min Cooldown check
            const lastAlertStr = localStorage.getItem('trackon_last_alert_at');
            if (lastAlertStr) {
                const lastAlertAt = parseInt(lastAlertStr, 10);
                if (now - lastAlertAt < 15 * 60 * 1000) {
                    console.log('[FCM] Cooldown active. Downgrading alert to toast');
                    showNormalToast({ id: notifId || Date.now(), title, body, type, link });
                    return;
                }
            }

            // Dismiss Forever Today check
            const todayStr = new Date().toDateString();
            const dismissedTodayStr = localStorage.getItem('trackon_alert_dismissed_today');
            if (dismissedTodayStr === todayStr) {
                console.log('[FCM] Alert dismissed today. Downgrading alert to toast');
                showNormalToast({ id: notifId || Date.now(), title, body, type, link });
                return;
            }

            // Save alert timestamp
            localStorage.setItem('trackon_last_alert_at', now.toString());

            // Open overlay modal
            setUrgentAlert({
                id: notifId,
                title,
                body,
                type,
                link
            });
        } else {
            showNormalToast({ id: notifId || Date.now() + Math.random(), title, body, type, link });
        }
    }, []);

    const showNormalToast = ({ id, title, body, type, link }) => {
        const newToast = { id, title, body, type, link };
        setToasts(prev => [...prev, newToast].slice(-3));
        playNotificationSound();
    };

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const handler = (event) => addToast(event.detail);
        window.addEventListener('trackon:notification', handler);
        return () => window.removeEventListener('trackon:notification', handler);
    }, [addToast]);

    if (toasts.length === 0 && !urgentAlert) return null;

    return (
        <>
            <style>{`
                .notification-toast-container {
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 380px;
                    width: calc(100vw - 32px);
                    pointer-events: none;
                }
                .notification-toast-card {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.97);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 14px;
                    padding: 13px 36px 13px 14px;
                    box-shadow:
                        0 4px 6px -1px rgba(0,0,0,0.07),
                        0 10px 25px -3px rgba(0,0,0,0.12),
                        0 0 0 1px rgba(99, 102, 241, 0.08);
                    overflow: hidden;
                    cursor: pointer;
                    pointer-events: all;
                    padding-left: 18px;
                }
                .notification-toast-card:hover {
                    box-shadow:
                        0 4px 6px -1px rgba(0,0,0,0.1),
                        0 20px 40px -5px rgba(0,0,0,0.18),
                        0 0 0 1px rgba(99, 102, 241, 0.15);
                    transform: translateY(-1px);
                    transition: all 0.15s ease;
                }
                .toast-enter {
                    animation: toastSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .toast-exit {
                    animation: toastSlideOut 0.3s ease-in forwards;
                }
                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(110%) scale(0.92);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                        max-height: 120px;
                        margin-bottom: 0;
                    }
                    to {
                        opacity: 0;
                        transform: translateX(110%) scale(0.9);
                        max-height: 0;
                        margin-bottom: -10px;
                    }
                }
                .toast-accent {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    border-radius: 14px 0 0 14px;
                }
                .toast-icon {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
                }
                .toast-content {
                    flex: 1;
                    min-width: 0;
                }
                .toast-app-label {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-bottom: 3px;
                }
                .toast-app-label span {
                    font-size: 10px;
                    font-weight: 700;
                    color: #818cf8;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .toast-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #1e293b;
                    line-height: 1.35;
                    margin: 0 0 3px 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .toast-body {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.45;
                    margin: 0 0 5px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .toast-action {
                    font-size: 11px;
                    font-weight: 600;
                    color: #6366f1;
                }
                .toast-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    transition: all 0.15s;
                    pointer-events: all;
                }
                .toast-close:hover {
                    background: #e2e8f0;
                    color: #475569;
                }
                .toast-progress-track {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2.5px;
                    background: #f1f5f9;
                }
                .toast-progress-bar {
                    height: 100%;
                    border-radius: 0 0 14px 14px;
                }
                /* CSS animation replaces JS setInterval — zero re-renders */
                .toast-progress-anim {
                    animation: toastProgressCountdown 5s linear forwards;
                }
                @keyframes toastProgressCountdown {
                    from { width: 100%; }
                    to   { width: 0%; }
                }

                /* Mobile: full-width drop from top */
                @media (max-width: 480px) {
                    .notification-toast-container {
                        top: 8px;
                        right: 8px;
                        left: 8px;
                        width: auto;
                        max-width: none;
                    }
                    @keyframes toastSlideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-110%) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    @keyframes toastSlideOut {
                        from { opacity: 1; transform: translateY(0); max-height: 120px; }
                        to { opacity: 0; transform: translateY(-30px); max-height: 0; }
                    }
                }
            `}</style>

            <div className="notification-toast-container" aria-label="Notifications">
                {toasts.map(toast => (
                    <ToastCard
                        key={toast.id}
                        toast={toast}
                        onDismiss={removeToast}
                    />
                ))}
            </div>

            {/* Foreground Full-Screen Urgent Alert Modal */}
            {urgentAlert && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-amber-500/30 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Flashing warning accent lighting */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />

                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 animate-bounce">
                            <span className="text-3xl">⚠️</span>
                        </div>

                        <h2 className="text-xl font-extrabold text-white tracking-tight uppercase mb-2">
                            {urgentAlert.title}
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed mb-6">
                            {urgentAlert.body}
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    const link = urgentAlert.link || '/member/plans';
                                    setUrgentAlert(null);
                                    if (urgentAlert.id) {
                                        api.put(`/api/notifications/public/${urgentAlert.id}/status`, { status: 'clicked' }).catch(() => {});
                                    }
                                    navigate(link);
                                }}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] transition-all"
                            >
                                💳 Renew Membership Now
                            </button>
                            <button
                                onClick={() => {
                                    setUrgentAlert(null);
                                    localStorage.setItem('trackon_alert_dismissed_today', new Date().toDateString());
                                    if (urgentAlert.id) {
                                        api.put(`/api/notifications/public/${urgentAlert.id}/status`, { status: 'ignored' }).catch(() => {});
                                    }
                                }}
                                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition-colors"
                            >
                                Dismiss Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationToast;
