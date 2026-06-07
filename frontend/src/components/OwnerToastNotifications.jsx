import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, UserPlus, RefreshCw, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ─── Icon map by notification type ───────────────────────────────────────────
const getNotifIcon = (type) => {
    switch (type) {
        case 'new_registration_request':
            return { Icon: UserPlus, bg: 'bg-indigo-100', color: 'text-indigo-600', accent: 'border-l-indigo-500' };
        case 'fresh_start_request':
            return { Icon: RefreshCw, bg: 'bg-amber-100', color: 'text-amber-600', accent: 'border-l-amber-500' };
        case 'renewal_request':
            return { Icon: RefreshCw, bg: 'bg-amber-100', color: 'text-amber-600', accent: 'border-l-amber-500' };
        case 'member_stopped':
            return { Icon: AlertCircle, bg: 'bg-rose-100', color: 'text-rose-500', accent: 'border-l-rose-500' };
        case 'fresh_start_approved':
        case 'registration_approved':
            return { Icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600', accent: 'border-l-emerald-500' };
        default:
            return { Icon: Bell, bg: 'bg-slate-100', color: 'text-slate-600', accent: 'border-l-indigo-400' };
    }
};

const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Single Toast Card ────────────────────────────────────────────────────────
const ToastCard = ({ notif, onDismiss, onView }) => {
    const [progress, setProgress] = useState(100);
    const { Icon, bg, color, accent } = getNotifIcon(notif.type);
    const AUTO_DISMISS_MS = 7000;

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
            setProgress(remaining);
            if (remaining === 0) {
                clearInterval(interval);
                onDismiss(notif._id);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [notif._id, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ x: 380, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 380, opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`relative w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 border-l-4 ${accent} overflow-hidden`}
        >
            {/* Progress bar */}
            <div
                className="absolute bottom-0 left-0 h-0.5 bg-indigo-400 transition-none"
                style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
            />

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon size={18} className={color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                            <button
                                onClick={() => onDismiss(notif._id)}
                                className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2.5 gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">{formatTimeAgo(notif.createdAt)}</span>
                            <button
                                onClick={() => onView(notif)}
                                className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                            >
                                <ExternalLink size={10} /> View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Provider (mount inside DashboardLayout) ─────────────────────────────
const OwnerToastNotifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [toasts, setToasts] = useState([]);
    const seenIdsRef = useRef(new Set());
    const isFirstPollRef = useRef(true);
    const POLL_INTERVAL_MS = 20000; // 20 seconds

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t._id !== id));
        // Mark as read silently
        api.put(`/api/notifications/${id}/read`).catch(() => {});
    }, []);

    const handleView = useCallback((notif) => {
        dismiss(notif._id);
        navigate('/dashboard/notifications');
    }, [dismiss, navigate]);

    const poll = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/api/notifications/latest-unread');
            const incoming = res.data || [];

            if (isFirstPollRef.current) {
                // On first load: seed seen IDs so we don't toast old notifications
                incoming.forEach(n => seenIdsRef.current.add(n._id));
                isFirstPollRef.current = false;
                return;
            }

            // Find genuinely new ones not seen before
            const newOnes = incoming.filter(n => !seenIdsRef.current.has(n._id));
            if (newOnes.length > 0) {
                newOnes.forEach(n => seenIdsRef.current.add(n._id));
                setToasts(prev => {
                    // Keep max 4 toasts, newest on top
                    const combined = [...newOnes, ...prev].slice(0, 4);
                    return combined;
                });

                // Play a subtle notification sound
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.4);
                } catch (_) {
                    // Audio not supported — silent
                }
            }
        } catch (_) {
            // Silently fail — don't break the UI
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        poll(); // immediate first check
        const timer = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [user, poll]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map(notif => (
                    <div key={notif._id} className="pointer-events-auto">
                        <ToastCard
                            notif={notif}
                            onDismiss={dismiss}
                            onView={handleView}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default OwnerToastNotifications;
