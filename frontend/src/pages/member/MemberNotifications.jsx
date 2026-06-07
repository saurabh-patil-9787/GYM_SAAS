import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const notificationIcons = {
    registration_approved: '🎉',
    registration_rejected: '❌',
    payment_recorded: '💰',
    renewal_approved: '✅',
    renewal_rejected: '❌',
    fresh_start_approved: '🚀',
    fresh_start_rejected: '⛔',
    renewal_reminder: '⏰',
    gym_announcement: '📢',
    member_stopped: '⏸️',
    member_rejoined: '🎊'
};

const MemberNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/member/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            setError('Failed to load notifications');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/api/member/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(prev - 1, 0));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/api/member/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return <BicepCurlLoader text="Loading Notifications..." fullScreen={false} />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">{error}</p>
                    <button
                        onClick={() => { setLoading(true); setError(''); fetchNotifications(); }}
                        className="mt-4 text-indigo-600 font-semibold text-sm hover:text-indigo-700 flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw size={14} /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">Notifications</h1>
                    <p className="text-xs text-slate-400">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                        <CheckCheck size={14} />
                        Read All
                    </button>
                )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="text-center py-16">
                    <Bell size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No notifications yet</p>
                    <p className="text-slate-400 text-xs mt-1">You'll see updates about your membership here</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={notif._id}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                                className={`rounded-xl p-4 border transition-all cursor-pointer ${
                                    notif.isRead
                                        ? 'bg-white border-slate-100'
                                        : 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-lg flex-shrink-0 mt-0.5">
                                        {notificationIcons[notif.type] || '🔔'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={`text-sm font-semibold truncate ${notif.isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                                                {notif.title}
                                            </h3>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className={`text-xs mt-0.5 ${notif.isRead ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                            <Clock size={10} />
                                            {getTimeAgo(notif.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default MemberNotifications;
