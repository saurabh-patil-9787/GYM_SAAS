import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, Clock, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const notificationIcons = {
    'new_registration_request': <Bell size={18} className="text-amber-500" />,
    'fresh_start_request': <Bell size={18} className="text-indigo-500" />,
    'payment_received': <Check size={18} className="text-emerald-500" />,
    'member_rejoined': <Check size={18} className="text-teal-500" />,
    'member_stopped': <AlertCircle size={18} className="text-rose-500" />
};

const OwnerNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [markingAll, setMarkingAll] = useState(false);
    
    // Broadcast Announcement State
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState('');
    const [broadcastError, setBroadcastError] = useState('');

    // Click Analytics State
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchNotifications();
        fetchAnalytics();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data.notifications || []);
        } catch (err) {
            setError('Failed to load notifications');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/api/notifications/analytics');
            setAnalytics(res.data);
        } catch (err) {
            console.error('Failed to load analytics', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        try {
            await api.put('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all read', err);
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault();
        if (!broadcastTitle || !broadcastMessage) {
            setBroadcastError('Title and message are required.');
            return;
        }

        setBroadcasting(true);
        setBroadcastError('');
        setBroadcastSuccess('');

        try {
            await api.post('/api/notifications/broadcast', {
                title: broadcastTitle.trim(),
                message: broadcastMessage.trim()
            });
            setBroadcastSuccess('Announcement broadcasted successfully to all members!');
            setBroadcastTitle('');
            setBroadcastMessage('');
            setTimeout(() => {
                setShowBroadcastModal(false);
                setBroadcastSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Broadcast failed', err);
            setBroadcastError(err.response?.data?.message || 'Failed to send announcement');
        } finally {
            setBroadcasting(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-indigo-500" /></div>;
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
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
                    <p className="text-sm text-slate-500 mt-1">Stay updated with your gym's activity</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowBroadcastModal(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-sm"
                    >
                        📢 Broadcast Announcement
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            disabled={markingAll}
                            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {markingAll ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Click Analytics Section */}
            {analytics && Object.keys(analytics).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {['renewal_reminder', 'gym_announcement'].map(type => {
                        const stats = analytics[type] || { sent: 0, delivered: 0, clicked: 0, ignored: 0, total: 0 };
                        const totalSent = stats.total || 0;
                        const ctr = totalSent > 0 ? ((stats.clicked / totalSent) * 100).toFixed(1) : '0.0';
                        
                        const label = type === 'renewal_reminder' ? '📅 Renewal Reminders' : '📢 Announcements';
                        const themeColor = type === 'renewal_reminder' ? 'indigo' : 'amber';
                        const themeClass = type === 'renewal_reminder' 
                            ? 'border-indigo-100 bg-indigo-50/20' 
                            : 'border-amber-100 bg-amber-50/20';

                        return (
                            <div key={type} className={`p-5 rounded-2xl border ${themeClass} shadow-sm`}>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">{label}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-${themeColor}-100 text-${themeColor}-700 border border-${themeColor}-200`}>
                                        CTR: {ctr}%
                                    </span>
                                </h3>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Sent</p>
                                        <p className="text-base font-bold text-slate-700 mt-0.5">{totalSent}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Deliv.</p>
                                        <p className="text-base font-bold text-slate-700 mt-0.5">{stats.delivered || 0}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Clicked</p>
                                        <p className="text-base font-bold text-indigo-600 mt-0.5">{stats.clicked || 0}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Ignored</p>
                                        <p className="text-base font-bold text-slate-400 mt-0.5">{stats.ignored || 0}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <Bell size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No notifications yet</p>
                    <p className="text-slate-400 text-sm mt-1">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={notif._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                    notif.isRead 
                                    ? 'bg-white border-slate-200 opacity-70' 
                                    : 'bg-indigo-50/50 border-indigo-100 cursor-pointer hover:bg-indigo-50'
                                }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        notif.isRead ? 'bg-slate-100' : 'bg-white shadow-sm'
                                    }`}>
                                        {notificationIcons[notif.type] || <Bell size={18} className={notif.isRead ? 'text-slate-400' : 'text-indigo-500'} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`text-sm font-bold truncate ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                                {notif.title}
                                            </h3>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className={`text-sm ${notif.isRead ? 'text-slate-500' : 'text-slate-700'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <Clock size={12} className="text-slate-400" />
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Broadcast Modal */}
            <AnimatePresence>
                {showBroadcastModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => !broadcasting && setShowBroadcastModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    📢 Broadcast Announcement
                                </h3>
                                <button 
                                    onClick={() => setShowBroadcastModal(false)} 
                                    disabled={broadcasting}
                                    className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            {broadcastSuccess && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm font-semibold flex items-center gap-2">
                                    <Check size={16} className="text-emerald-500" /> {broadcastSuccess}
                                </div>
                            )}

                            {broadcastError && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-4 text-sm font-semibold flex items-center gap-2">
                                    <AlertCircle size={16} className="text-rose-500" /> {broadcastError}
                                </div>
                            )}

                            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    This message will be sent in-app to all approved members. Members who have push notifications enabled will also receive an instant push notification on their devices.
                                </p>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Announcement Title *</label>
                                    <input
                                        type="text"
                                        value={broadcastTitle}
                                        onChange={(e) => setBroadcastTitle(e.target.value)}
                                        placeholder="e.g. Gym Holiday Announcement, Maintenance Update..."
                                        maxLength={150}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Message Content *</label>
                                    <textarea
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        placeholder="Type your announcement details here..."
                                        maxLength={450}
                                        rows={4}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    />
                                    <div className="text-right text-[10px] text-slate-400 mt-1">
                                        {broadcastMessage.length}/450 characters
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={broadcasting}
                                        onClick={() => setShowBroadcastModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={broadcasting}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {broadcasting ? <><RefreshCw size={14} className="animate-spin" /> Broadcasting...</> : 'Send Announcement'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OwnerNotifications;
