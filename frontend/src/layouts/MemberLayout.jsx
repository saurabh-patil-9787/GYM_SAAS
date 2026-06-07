import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Bell, User, Dumbbell, LogOut, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MemberLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);

    // Deep link telemetry tracker: processes notifId and action (e.g. action=clicked)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const notifId = params.get('notifId');
        const action = params.get('action');

        const isMongoId = typeof notifId === 'string' && /^[0-9a-fA-F]{24}$/.test(notifId);
        if (isMongoId && action) {
            api.put(`/api/notifications/public/${notifId}/status`, { status: action })
                .then(() => {
                    // Clean up URL query parameters
                    navigate(location.pathname, { replace: true });
                })
                .catch(() => {});
        }
    }, [location.search, location.pathname, navigate]);

    const tabs = [
        { key: 'home', path: '/member/dashboard', icon: Home, label: 'Home' },
        { key: 'health', path: '/member/health', icon: Dumbbell, label: 'Health' },
        { key: 'progress', path: '/member/progress', icon: TrendingUp, label: 'Progress' },
        { key: 'badges', path: '/member/badges', icon: Award, label: 'Badges' },
        { key: 'profile', path: '/member/profile', icon: User, label: 'Profile' },
    ];

    const activeTab = tabs.find(t => location.pathname.startsWith(t.path))?.key || 'home';

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await api.get('/api/member/notifications/unread-count');
                setUnreadCount(res.data.count || 0);
            } catch (err) {
                // Silent fail
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    const gymName = user?.role === 'member' ? user.gym?.gymName : user?.gymName;
    const gymLogoUrl = user?.role === 'member' ? user.gym?.logoUrl : user?.gymLogoUrl;

    return (
        <div className="member-portal-scope min-h-screen bg-member-bg text-member-primary">
            {/* Top Header */}
            <div className="bg-member-bg/90 backdrop-blur-md border-b border-member-border px-4 py-3 sticky top-0 z-20">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div 
                            onClick={() => gymLogoUrl && setPreviewImage({ url: gymLogoUrl, title: gymName })}
                            className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm ${gymLogoUrl ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                        >
                            {gymLogoUrl ? (
                                <img src={gymLogoUrl} alt={gymName} className="w-full h-full object-cover" />
                            ) : (
                                <Dumbbell className="text-white" size={18} />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-member-primary leading-tight font-syne">{gymName || 'My Gym'}</p>
                            <p className="text-[10px] text-member-muted uppercase tracking-wider font-semibold font-syne">Member Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                        {/* Glowing Bell Icon */}
                        <button
                            onClick={() => navigate('/member/notifications')}
                            className="relative w-8 h-8 flex items-center justify-center text-member-secondary hover:text-member-accent transition-all rounded-full hover:bg-member-surface active:scale-95"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] flex items-center justify-center text-[8px] font-bold text-white bg-member-rose rounded-full px-0.5 animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-member-secondary hover:text-member-rose transition-colors text-xs font-semibold bg-member-surface border border-member-border px-2.5 py-1.5 rounded-lg active:scale-95 font-syne"
                        >
                            <LogOut size={12} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="max-w-lg mx-auto member-scroll-container">
                <Outlet />
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#111118] border-t border-member-border z-30 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                <div className="max-w-lg mx-auto flex items-center justify-around py-1.5">
                    {tabs.map(tab => {
                         const isActive = activeTab === tab.key;
                         const Icon = tab.icon;
                         return (
                             <button
                                 key={tab.key}
                                 onClick={() => navigate(tab.path)}
                                 className="flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-200"
                             >
                                 <div className={`p-1.5 rounded-[10px] transition-all duration-300 ${isActive ? 'bg-member-accent text-white shadow-[0_0_12px_rgba(108,92,231,0.5)] scale-110' : 'text-member-secondary bg-transparent'}`}>
                                     <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                 </div>
                                 <span className={`font-syne text-[9px] font-bold tracking-wide transition-colors duration-300 ${isActive ? 'text-member-primary' : 'text-member-muted'}`}>
                                     {tab.label}
                                 </span>
                             </button>
                         );
                    })}
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div 
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
                >
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 text-white/85 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-lg font-bold"
                    >
                        ✕
                    </button>
                    <img 
                        src={previewImage.url} 
                        alt={previewImage.title} 
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
                    />
                    {previewImage.title && (
                        <p className="text-white font-semibold mt-4 text-sm tracking-wide uppercase bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
                            {previewImage.title}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemberLayout;
