import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Trophy, Zap, Calendar, Flame, Dumbbell, Crown, Medal, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Shield, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tab Configuration ──────────────────────────────────────────────────────
const TABS = [
    { id: 'overall', label: 'All-Time', icon: Trophy,   color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#ea580c)', shadow: 'rgba(245,158,11,0.4)',  emptyMsg: 'Check in to the gym to earn XP!' },
    { id: 'weekly',  label: 'Weekly',   icon: Zap,      color: '#a78bfa', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', shadow: 'rgba(124,58,237,0.4)',  emptyMsg: 'Be the first to earn XP this week!' },
    { id: 'monthly', label: 'Monthly',  icon: Calendar, color: '#60a5fa', gradient: 'linear-gradient(135deg,#2563eb,#06b6d4)', shadow: 'rgba(37,99,235,0.4)',   emptyMsg: 'No XP earned this month yet. Get moving!' },
    { id: 'streak',  label: 'Streak',   icon: Flame,    color: '#fb923c', gradient: 'linear-gradient(135deg,#ef4444,#f97316)', shadow: 'rgba(239,68,68,0.4)',   emptyMsg: 'Start checking in to build your streak!' },
    { id: 'pr',      label: 'PR Club',  icon: Dumbbell, color: '#34d399', gradient: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(5,150,105,0.4)',   emptyMsg: 'Log a Personal Record to enter the PR Club!' },
];

const XP_GUIDE = [
    { icon: '🏋️', label: 'Gym Check-in',     sub: 'Tap Check-in on dashboard',        xp: '+30 XP', color: '#a78bfa' },
    { icon: '💧', label: 'Water Goal',          sub: 'Health Hub → water tracker',       xp: '+10 XP', color: '#67e8f9' },
    { icon: '🧘', label: 'Stretch (5 min)',     sub: 'Health Hub → Timer → 🧘 Stretch',  xp: '+10 XP', color: '#6ee7b7' },
    { icon: '📱', label: 'Daily Login',         sub: 'Open the app each day',            xp: '+5 XP',  color: '#93c5fd' },
    { icon: '🎯', label: 'All 3 Missions Done', sub: 'Claim reward on this screen',      xp: '+50 XP', color: '#fde68a' },
];

const PODIUM_META = {
    1: { label: '1st', crownColor: '#facc15', ringColor: '#facc15', ringGlow: 'rgba(250,204,21,0.55)', metricColor: '#fde68a', height: 128, avatarSize: 'w-[70px] h-[70px]', avatarText: 'text-2xl', order: 1 },
    2: { label: '2nd', crownColor: '#cbd5e1', ringColor: '#94a3b8', ringGlow: 'rgba(148,163,184,0.45)', metricColor: '#e2e8f0', height: 94,  avatarSize: 'w-[60px] h-[60px]', avatarText: 'text-xl',  order: 0 },
    3: { label: '3rd', crownColor: '#d97706', ringColor: '#92400e', ringGlow: 'rgba(180,83,9,0.45)',  metricColor: '#fcd34d', height: 76,  avatarSize: 'w-[54px] h-[54px]', avatarText: 'text-lg',  order: 2 },
};

// ─── Component ─────────────────────────────────────────────────────────────
const MemberLeaderboard = () => {
    const [activeTab, setActiveTab] = useState('overall');
    const [topMembers, setTopMembers] = useState([]);
    const [surrounding, setSurrounding] = useState(null);
    const [myRank, setMyRank] = useState(null);
    const [myMemberId, setMyMemberId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showXPGuide, setShowXPGuide] = useState(false);

    const tab = TABS.find(t => t.id === activeTab);

    const fetchLeaderboard = async () => {
        setIsLoading(true); setError('');
        try {
            if (activeTab === 'pr') {
                // PR has its own dedicated endpoints
                const [topRes, myRes] = await Promise.all([
                    api.get('/api/v1/leaderboard/pr'),
                    api.get('/api/v1/leaderboard/pr/me')
                ]);
                setTopMembers(topRes.data.leaderboard || []);
                if (myRes.data.success) {
                    setSurrounding(myRes.data.surrounding);
                    setMyRank(myRes.data.myRank);
                    setMyMemberId(myRes.data.surrounding?.me?._id?.toString());
                }
            } else {
                // overall / weekly / monthly / streak all use ?type= query param
                const [topRes, myRes] = await Promise.all([
                    api.get(`/api/v1/leaderboard?type=${activeTab}`),
                    api.get(`/api/v1/leaderboard/surrounding?type=${activeTab}`)
                ]);
                setTopMembers(topRes.data.leaderboard || []);
                if (myRes.data.success) {
                    setSurrounding(myRes.data.surrounding);
                    setMyRank(myRes.data.myRank);
                    setMyMemberId(myRes.data.surrounding?.me?._id?.toString());
                }
            }
        } catch (err) {
            console.error('Leaderboard fetch error:', err?.response?.status, err?.response?.data || err.message);
            setError('Failed to load leaderboard.');
        }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchLeaderboard(); }, [activeTab]);

    const getMetric = (member) => {
        if (!member) return '';
        if (activeTab === 'overall')  return member.totalXP  != null ? `${member.totalXP?.toLocaleString()} XP`  : '';
        if (activeTab === 'weekly')   return member.weeklyXP  != null ? `${member.weeklyXP?.toLocaleString()} XP`  : '';
        if (activeTab === 'monthly')  return member.monthlyXP != null ? `${member.monthlyXP?.toLocaleString()} XP` : '';
        if (activeTab === 'streak')   return member.streak    != null ? `${member.streak}d`                        : '';
        if (activeTab === 'pr')       return member.totalWeight != null ? `${member.totalWeight?.toLocaleString()} kg` : '';
        return '';
    };
    const getSub = (member) => activeTab === 'pr' && member?.bestExercise ? member.bestExercise : null;

    // Podium order: 2nd | 1st | 3rd
    const top3 = topMembers.slice(0, 3);
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push({ ...top3[1], rank: 2 });
    if (top3[0]) podiumOrder.push({ ...top3[0], rank: 1 });
    if (top3[2]) podiumOrder.push({ ...top3[2], rank: 3 });

    let listItems = topMembers.slice(3).map((m, i) => ({ ...m, rank: i + 4 }));
    if (myRank > 10 && surrounding) {
        listItems.push({ isDivider: true });
        surrounding.above.forEach((m, i) => listItems.push({ ...m, rank: myRank - surrounding.above.length + i }));
        listItems.push({ ...surrounding.me, rank: myRank, isMe: true });
        surrounding.below.forEach((m, i) => listItems.push({ ...m, rank: myRank + 1 + i }));
    }

    return (
        <div className="pb-32 min-h-screen" style={{ background: 'linear-gradient(180deg,#09090f 0%,#0d0d17 100%)' }}>

            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="px-4 pt-5 pb-3 flex items-center justify-between">
                <div>
                    <h1 className="font-syne text-[22px] font-black text-white tracking-tight">Leaderboard</h1>
                    <p className="font-syne text-[10px] text-white/30 mt-0.5 tracking-wide uppercase">Compete · Climb · Conquer 🏆</p>
                </div>
                <button
                    onClick={() => setShowXPGuide(v => !v)}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
                    style={{
                        background: showXPGuide ? `${tab.color}18` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${showXPGuide ? tab.color + '40' : 'rgba(255,255,255,0.1)'}`,
                        color: showXPGuide ? tab.color : 'rgba(255,255,255,0.38)',
                    }}
                >
                    <Info size={11} />
                    XP Guide
                    {showXPGuide ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
            </div>

            {/* ── XP GUIDE (collapsible) ─────────────────────────── */}
            <AnimatePresence>
                {showXPGuide && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mx-4 mb-4 rounded-2xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="p-4">
                                <p className="font-syne text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                    <Star size={10} className="text-yellow-400" fill="#facc15" /> How to Earn XP
                                </p>
                                <div className="space-y-3">
                                    {XP_GUIDE.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-[18px] w-8 text-center flex-shrink-0">{item.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-syne text-[12px] font-bold text-white/80 leading-tight">{item.label}</p>
                                                <p className="font-dmsans text-[10px] text-white/30 leading-tight mt-0.5">{item.sub}</p>
                                            </div>
                                            <span className="font-syne text-[12px] font-black flex-shrink-0" style={{ color: item.color }}>{item.xp}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="font-dmsans text-[9px] text-white/20 mt-4 text-center">Each action counts once per day · XP never resets (except Weekly & Monthly)</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TAB PILLS (horizontally scrollable) ───────────── */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {TABS.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button key={t.id} onClick={() => { if (!isLoading) setActiveTab(t.id); }}
                                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
                                style={isActive ? {
                                    background: t.gradient, boxShadow: `0 4px 18px ${t.shadow}`,
                                    color: '#fff', border: '1px solid rgba(255,255,255,0.18)'
                                } : {
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.38)',
                                }}>
                                <t.icon size={12} />{t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── CONTENT ────────────────────────────────────────── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: `${tab.color}25`, borderTopColor: tab.color }} />
                    <p className="font-syne text-white/25 text-[11px] font-semibold uppercase tracking-widest">Loading...</p>
                </div>
            ) : error ? (
                <div className="mx-4 text-center py-16 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <AlertCircle className="mx-auto mb-3 opacity-60" size={36} style={{ color: '#f87171' }} />
                    <p className="font-syne text-white/60 font-bold text-sm">{error}</p>
                    <button onClick={fetchLeaderboard}
                        className="mt-4 flex items-center gap-1.5 text-xs font-semibold mx-auto active:scale-95"
                        style={{ color: tab.color }}>
                        <RefreshCw size={13} /> Try Again
                    </button>
                </div>
            ) : topMembers.length === 0 ? (
                <div className="mx-4 text-center py-20 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-5xl mb-4">{activeTab === 'pr' ? '💪' : activeTab === 'streak' ? '🔥' : '🏆'}</div>
                    <p className="font-syne text-white/65 font-bold text-sm">No Data Yet</p>
                    <p className="font-dmsans text-white/28 text-xs mt-2 max-w-[220px] mx-auto leading-relaxed">{tab.emptyMsg}</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: 'easeOut' }}>

                        {/* ── PODIUM ─────────────────────────────── */}
                        {podiumOrder.length > 0 && (
                            <div className="mx-4 mb-6 rounded-3xl overflow-hidden relative"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {/* Ambient glow */}
                                <div className="absolute inset-0 pointer-events-none"
                                    style={{ background: `radial-gradient(ellipse 80% 60% at 50% 20%,${tab.color}12,transparent 70%)` }} />
                                {/* Section label */}
                                <div className="pt-5 pb-2 text-center relative z-10">
                                    <span className="font-syne text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Top Champions</span>
                                </div>
                                {/* 3 podium columns */}
                                <div className="flex items-end justify-center gap-2 px-4 relative z-10">
                                    {podiumOrder.map(member => {
                                        const pm = PODIUM_META[member.rank];
                                        return (
                                            <motion.div key={member._id}
                                                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: pm.order * 0.08, duration: 0.3 }}
                                                className="flex flex-col items-center flex-1"
                                                style={{ maxWidth: member.rank === 1 ? '120px' : '96px' }}>
                                                {/* Crown/Medal */}
                                                <div className="mb-2 h-8 flex items-end justify-center">
                                                    {member.rank === 1 && <Crown size={24} style={{ color: pm.crownColor, filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.8))' }} />}
                                                    {member.rank === 2 && <Medal size={20} style={{ color: pm.crownColor }} />}
                                                    {member.rank === 3 && <Medal size={18} style={{ color: pm.crownColor }} />}
                                                </div>
                                                {/* Avatar */}
                                                <div className={`${pm.avatarSize} rounded-full overflow-hidden mb-3 flex-shrink-0`}
                                                    style={{ boxShadow: `0 0 0 3px ${pm.ringColor}, 0 0 18px ${pm.ringGlow}` }}>
                                                    {member.photoUrl
                                                        ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                                        : <div className={`w-full h-full flex items-center justify-center font-black text-white ${pm.avatarText}`}
                                                            style={{ background: `${tab.color}22` }}>
                                                            {member.name?.charAt(0)}
                                                          </div>
                                                    }
                                                </div>
                                                {/* Name */}
                                                <p className="font-syne font-bold text-[11px] text-white text-center leading-tight truncate w-full mb-1 px-1">{member.name}</p>
                                                {/* Podium block */}
                                                <div className="w-full rounded-t-2xl flex flex-col items-center justify-center pt-4 pb-4 relative overflow-hidden"
                                                    style={{
                                                        height: `${pm.height}px`,
                                                        background: `linear-gradient(180deg,${tab.color}18 0%,${tab.color}06 100%)`,
                                                        border: `1px solid ${tab.color}22`, borderBottom: 'none'
                                                    }}>
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
                                                    <span className="font-syne text-[20px] font-black relative z-10 leading-none" style={{ color: pm.ringColor }}>{pm.label}</span>
                                                    <span className="font-syne text-[11px] font-black mt-1 relative z-10" style={{ color: pm.metricColor }}>{getMetric(member)}</span>
                                                    {getSub(member) && <p className="font-dmsans text-[8px] text-white/30 relative z-10 truncate w-full text-center px-2 mt-0.5">{getSub(member)}</p>}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── LIST (Ranks 4+) ─────────────────────── */}
                        {listItems.length > 0 && (
                            <div className="px-4 space-y-2">
                                <p className="font-syne text-[9px] font-black uppercase tracking-[0.25em] text-white/25 pb-1">Rankings</p>
                                {listItems.map((member, idx) => {
                                    if (member.isDivider) return (
                                        <div key={`div-${idx}`} className="flex items-center gap-2.5 py-2">
                                            <div className="flex-1 h-px bg-white/[0.06]" />
                                            <span className="font-syne text-[9px] font-black uppercase tracking-widest text-white/20">Your Area</span>
                                            <div className="flex-1 h-px bg-white/[0.06]" />
                                        </div>
                                    );
                                    const isMe = myMemberId && (member._id?.toString() === myMemberId || member.isMe);
                                    return (
                                        <motion.div key={member._id?.toString() || idx}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03, duration: 0.2 }}>
                                            <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl"
                                                style={isMe ? {
                                                    background: `linear-gradient(135deg,${tab.color}18,rgba(255,255,255,0.03))`,
                                                    border: `1px solid ${tab.color}38`,
                                                    boxShadow: `0 0 22px ${tab.color}14`,
                                                } : {
                                                    background: 'rgba(255,255,255,0.025)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                }}>
                                                {/* Rank badge */}
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-syne text-[11px] font-black"
                                                    style={isMe
                                                        ? { background: `${tab.color}28`, border: `1px solid ${tab.color}50`, color: tab.color }
                                                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.28)' }}>
                                                    #{member.rank}
                                                </div>
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                                                    style={{ border: `2px solid ${isMe ? tab.color + '55' : 'rgba(255,255,255,0.07)'}` }}>
                                                    {member.photoUrl
                                                        ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center text-sm font-black"
                                                            style={{ background: `${tab.color}15`, color: isMe ? tab.color : 'rgba(255,255,255,0.38)' }}>
                                                            {member.name?.charAt(0)}
                                                          </div>
                                                    }
                                                </div>
                                                {/* Name + Level */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-syne text-[13px] font-bold text-white truncate leading-tight">{member.name}</p>
                                                        {isMe && (
                                                            <span className="font-syne text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md text-white flex-shrink-0"
                                                                style={{ background: tab.color }}>You</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Shield size={8} style={{ color: tab.color, opacity: 0.7 }} />
                                                        <span className="font-dmsans text-[10px] text-white/28">Level {member.currentLevel || 1}</span>
                                                    </div>
                                                </div>
                                                {/* Metric */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-syne text-[13px] font-black"
                                                        style={{ color: isMe ? tab.color : 'rgba(255,255,255,0.7)' }}>
                                                        {getMetric(member)}
                                                    </p>
                                                    {getSub(member) && (
                                                        <p className="font-dmsans text-[9px] text-white/28 mt-0.5 max-w-[88px] text-right truncate">{getSub(member)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div className="h-2" />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* ── STICKY YOUR RANK BAR ───────────────────────────── */}
            <AnimatePresence>
                {myRank && myRank > 3 && !isLoading && (
                    <motion.div
                        initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 70, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed left-0 right-0 z-40 px-3 pointer-events-none"
                        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}
                    >
                        <div
                            className="max-w-lg mx-auto rounded-2xl px-4 py-3 flex items-center justify-between pointer-events-auto backdrop-blur-2xl"
                            style={{
                                background: `linear-gradient(135deg,${tab.color}20,rgba(10,10,18,0.97))`,
                                border: `1px solid ${tab.color}35`,
                                boxShadow: `0 -2px 24px ${tab.shadow}, 0 4px 20px rgba(0,0,0,0.7)`,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-syne font-black text-[13px] flex-shrink-0"
                                    style={{ background: `${tab.color}25`, border: `1px solid ${tab.color}45`, color: tab.color }}>
                                    #{myRank}
                                </div>
                                <div>
                                    <p className="font-syne text-[12px] font-black text-white leading-tight">{tab.label} Rank</p>
                                    <p className="font-dmsans text-[10px] text-white/35 mt-0.5">Keep grinding! 🔥</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-syne text-[14px] font-black" style={{ color: tab.color }}>{getMetric(surrounding?.me || {})}</p>
                                {getSub(surrounding?.me || {}) && <p className="font-dmsans text-[9px] text-white/30 mt-0.5">{getSub(surrounding?.me || {})}</p>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberLeaderboard;
