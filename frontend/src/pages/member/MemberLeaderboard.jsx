import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Trophy, Zap, Calendar, Flame, Dumbbell, Crown, Medal, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Shield, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tab Configuration ───────────────────────────────────────────────────────
const TABS = [
    {
        id: 'overall', label: 'All-Time', icon: Trophy,
        gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
        shadow: 'rgba(245,158,11,0.45)', color: '#f59e0b',
        emptyMsg: 'Check in to the gym to earn XP!'
    },
    {
        id: 'weekly', label: 'Weekly', icon: Zap,
        gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        shadow: 'rgba(124,58,237,0.45)', color: '#7c3aed',
        emptyMsg: 'Be the first to earn XP this week!'
    },
    {
        id: 'monthly', label: 'Monthly', icon: Calendar,
        gradient: 'linear-gradient(135deg, #2563eb, #06b6d4)',
        shadow: 'rgba(37,99,235,0.45)', color: '#2563eb',
        emptyMsg: 'No XP earned this month yet. Get moving!'
    },
    {
        id: 'streak', label: 'Streak', icon: Flame,
        gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
        shadow: 'rgba(239,68,68,0.45)', color: '#ef4444',
        emptyMsg: 'Start checking in to build your streak!'
    },
    {
        id: 'pr', label: 'PR Club', icon: Dumbbell,
        gradient: 'linear-gradient(135deg, #059669, #10b981)',
        shadow: 'rgba(5,150,105,0.45)', color: '#059669',
        emptyMsg: 'Log a Personal Record to enter the PR Club!'
    },
];

// ─── XP Guide Data ───────────────────────────────────────────────────────────
const XP_GUIDE = [
    { icon: '🏋️', label: 'Gym Check-in',       sub: 'Tap Check-in on dashboard',            xp: '+30 XP', color: '#a78bfa' },
    { icon: '💧', label: 'Water Goal',            sub: 'Health Hub → water tracker',           xp: '+10 XP', color: '#67e8f9' },
    { icon: '🧘', label: 'Stretch (5 min)',       sub: 'Health Hub → Timer → 🧘 Stretch',      xp: '+10 XP', color: '#6ee7b7' },
    { icon: '📱', label: 'Daily Login',           sub: 'Open the app each day',                xp: '+5 XP',  color: '#93c5fd' },
    { icon: '🎯', label: 'All 3 Missions Done',   sub: 'Claim reward on this screen',          xp: '+50 XP', color: '#fde68a' },
];

// ─── Rank Visual Config ───────────────────────────────────────────────────────
const RANK_STYLE = {
    1: {
        ring: '0 0 0 4px #facc15, 0 0 22px rgba(250,204,21,0.65)',
        podiumBg: 'linear-gradient(180deg, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0.06) 100%)',
        podiumBorder: 'rgba(245,158,11,0.4)',
        metricColor: '#fde68a',
        height: 144,
    },
    2: {
        ring: '0 0 0 4px #cbd5e1, 0 0 18px rgba(203,213,225,0.5)',
        podiumBg: 'linear-gradient(180deg, rgba(148,163,184,0.22) 0%, rgba(148,163,184,0.04) 100%)',
        podiumBorder: 'rgba(148,163,184,0.35)',
        metricColor: '#e2e8f0',
        height: 100,
    },
    3: {
        ring: '0 0 0 4px #92400e, 0 0 18px rgba(180,83,9,0.5)',
        podiumBg: 'linear-gradient(180deg, rgba(180,83,9,0.25) 0%, rgba(180,83,9,0.05) 100%)',
        podiumBorder: 'rgba(180,83,9,0.4)',
        metricColor: '#fcd34d',
        height: 80,
    },
};

// ─── Component ────────────────────────────────────────────────────────────────
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
        setIsLoading(true);
        setError('');
        try {
            if (activeTab === 'pr') {
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
                const [topRes, surRes] = await Promise.all([
                    api.get(`/api/v1/leaderboard?type=${activeTab}&limit=10`),
                    api.get(`/api/v1/leaderboard/surrounding?type=${activeTab}`)
                ]);
                setTopMembers(topRes.data.leaderboard || []);
                if (surRes.data.success) {
                    setSurrounding(surRes.data.surrounding);
                    setMyRank(surRes.data.myRank);
                    setMyMemberId(surRes.data.surrounding?.me?._id?.toString());
                }
            }
        } catch (err) {
            console.error('Leaderboard error', err);
            setError('Failed to load leaderboard. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLeaderboard(); }, [activeTab]);

    const getMetric = (member) => {
        if (activeTab === 'overall')  return `${member.totalXP  ?? 0} XP`;
        if (activeTab === 'weekly')   return `${member.weeklyXP ?? 0} XP`;
        if (activeTab === 'monthly')  return `${member.monthlyXP ?? 0} XP`;
        if (activeTab === 'streak')   return `${member.streak   ?? 0} days`;
        if (activeTab === 'pr')       return member.bestPR ? `${member.bestPR} kg` : '— kg';
        return '';
    };
    const getSub = (member) => {
        if (activeTab === 'pr' && member?.bestExercise) return member.bestExercise;
        return null;
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown size={22} style={{ color: '#facc15', filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.9))' }} />;
        if (rank === 2) return <Medal size={18} style={{ color: '#cbd5e1' }} />;
        if (rank === 3) return <Medal size={18} style={{ color: '#b45309' }} />;
        return null;
    };

    // Build podium order: 2nd | 1st | 3rd
    const top3 = topMembers.slice(0, 3);
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push({ ...top3[1], rank: 2 });
    if (top3[0]) podiumOrder.push({ ...top3[0], rank: 1 });
    if (top3[2]) podiumOrder.push({ ...top3[2], rank: 3 });

    // Build list (ranks 4–10 + surrounding if not in top 10)
    let listItems = topMembers.slice(3).map((m, i) => ({ ...m, rank: i + 4 }));
    if (myRank > 10 && surrounding) {
        listItems.push({ isDivider: true });
        surrounding.above.forEach((m, i) => listItems.push({ ...m, rank: myRank - surrounding.above.length + i }));
        listItems.push({ ...surrounding.me, rank: myRank, isMe: true });
        surrounding.below.forEach((m, i) => listItems.push({ ...m, rank: myRank + 1 + i }));
    }

    return (
        <div className="pb-32" style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #111119 100%)', minHeight: '100vh' }}>

            {/* ── HEADER ─────────────────────────────────── */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Leaderboard
                    </h1>
                    <p className="text-white/35 text-[10px] mt-0.5">Compete · Climb · Conquer 🏆</p>
                </div>
                <button
                    onClick={() => setShowXPGuide(v => !v)}
                    className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all active:scale-95 flex-shrink-0"
                    style={{
                        background: showXPGuide ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${showXPGuide ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        color: showXPGuide ? '#c084fc' : 'rgba(255,255,255,0.4)',
                    }}
                >
                    <Info size={10} />
                    XP Guide
                    {showXPGuide ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
            </div>

            {/* ── XP GUIDE (collapsible) ──────────────────────── */}
            <AnimatePresence>
                {showXPGuide && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mx-4 mb-3 rounded-2xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(13,13,26,0.95))',
                                border: '1px solid rgba(124,58,237,0.25)'
                            }}>
                            <div className="p-4">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                                    <Star size={10} className="text-yellow-400" fill="#facc15" />
                                    How to Earn XP
                                </p>
                                <div className="space-y-2.5">
                                    {XP_GUIDE.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-[17px] w-7 text-center flex-shrink-0">{item.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-bold text-white/80 leading-tight">{item.label}</p>
                                                <p className="text-[10px] text-white/30 leading-tight mt-0.5">{item.sub}</p>
                                            </div>
                                            <span className="text-[13px] font-black flex-shrink-0" style={{ color: item.color }}>{item.xp}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-white/20 mt-4 text-center">
                                    Each action counts once per day · XP never resets (except Weekly & Monthly tabs)
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TAB BAR — wrapped grid for mobile ──────── */}
            <div className="px-3 mb-5">
                <div className="flex flex-wrap justify-center gap-2">
                    {TABS.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => { if (!isLoading) setActiveTab(t.id); }}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-2xl text-[11px] font-bold transition-all active:scale-95 flex-grow-0"
                                style={isActive ? {
                                    background: t.gradient,
                                    boxShadow: `0 4px 18px ${t.shadow}`,
                                    color: '#ffffff',
                                    border: '1px solid rgba(255,255,255,0.15)'
                                } : {
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.38)',
                                }}
                            >
                                <t.icon size={13} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── CONTENT ─────────────────────────────────────── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: `${tab.color}30`, borderTopColor: tab.color }} />
                    <p className="text-white/25 text-xs font-medium">Loading ranks...</p>
                </div>

            ) : error ? (
                <div className="mx-4 text-center py-14 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <AlertCircle className="mx-auto mb-3" size={36} style={{ color: '#f87171' }} />
                    <p className="text-white/60 font-bold text-sm">{error}</p>
                    <button onClick={fetchLeaderboard}
                        className="mt-4 flex items-center gap-1.5 text-xs font-semibold mx-auto active:scale-95"
                        style={{ color: tab.color }}>
                        <RefreshCw size={13} /> Try Again
                    </button>
                </div>

            ) : topMembers.length === 0 ? (
                <div className="mx-4 text-center py-16 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-5xl mb-4">
                        {activeTab === 'pr' ? '💪' : activeTab === 'streak' ? '🔥' : '🏆'}
                    </div>
                    <p className="text-white/65 font-bold text-sm">No Data Yet</p>
                    <p className="text-white/28 text-xs mt-2 max-w-[220px] mx-auto leading-relaxed">{tab.emptyMsg}</p>
                </div>

            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                        {/* ── PODIUM ─────────────────────────────────── */}
                        {podiumOrder.length > 0 && (
                            <div className="px-4 mb-5">
                                {/* Glowing header line */}
                                <div className="w-full h-px mb-4 rounded-full"
                                    style={{ background: `linear-gradient(90deg, transparent, ${tab.color}55, transparent)` }} />

                                <div className="flex items-end justify-center gap-2.5">
                                    {podiumOrder.map(member => {
                                        const rs = RANK_STYLE[member.rank];
                                        return (
                                            <div key={member._id} className="flex flex-col items-center flex-1">
                                                {/* Rank Icon */}
                                                <div className="mb-1 h-7 flex items-center justify-center">
                                                    {getRankIcon(member.rank)}
                                                </div>
                                                {/* Avatar */}
                                                <div
                                                    className="w-16 h-16 rounded-full overflow-hidden relative mb-2.5 flex-shrink-0"
                                                    style={{ boxShadow: rs.ring, border: '2px solid rgba(0,0,0,0.6)' }}
                                                >
                                                    {member.photoUrl
                                                        ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center text-xl font-black text-white"
                                                            style={{ background: `${tab.color}25` }}>
                                                            {member.name?.charAt(0)}
                                                          </div>
                                                    }
                                                </div>

                                                {/* Podium block */}
                                                <div
                                                    className="rounded-t-2xl flex flex-col items-center justify-end pb-3 pt-6 relative overflow-hidden"
                                                    style={{
                                                        width: '90px', // Fixed uniform width for all 3 podium columns
                                                        height: `${rs.height}px`,
                                                        background: rs.podiumBg,
                                                        border: `1px solid ${rs.podiumBorder}`,
                                                        borderBottom: 'none'
                                                    }}
                                                >
                                                    {/* Shine */}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
                                                    <p className="text-white font-bold text-[10px] w-full text-center px-1 relative z-10 leading-tight line-clamp-2"
                                                        style={{ minHeight: '26px' }}>
                                                        {member.name}
                                                    </p>
                                                    <p className="font-black text-[12px] mt-0.5 relative z-10" style={{ color: rs.metricColor }}>
                                                        {getMetric(member)}
                                                    </p>
                                                    {getSub(member) && (
                                                        <p className="text-[9px] text-white/35 relative z-10 truncate w-full text-center px-1 mt-0.5">
                                                            {getSub(member)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── LIST (Ranks 4–10 + Surrounding) ──────────── */}
                        <div className="px-4 space-y-2">
                            {listItems.map((member, idx) => {
                                if (member.isDivider) {
                                    return (
                                        <div key={`divider-${idx}`} className="flex items-center gap-2 py-1.5">
                                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Your Area</span>
                                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                        </div>
                                    );
                                }

                                const isMe = myMemberId && (member._id?.toString() === myMemberId || member.isMe);

                                return (
                                    <motion.div
                                        key={member._id?.toString() || idx}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.035, duration: 0.2 }}
                                    >
                                        <div
                                            className="flex items-center gap-3 p-3.5 rounded-2xl transition-all"
                                            style={isMe ? {
                                                background: `linear-gradient(135deg, ${tab.color}1a, rgba(255,255,255,0.03))`,
                                                border: `1px solid ${tab.color}44`,
                                                boxShadow: `0 0 20px ${tab.color}18`
                                            } : {
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.07)'
                                            }}
                                        >
                                            {/* Rank badge */}
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black"
                                                style={isMe ? {
                                                    background: `${tab.color}28`,
                                                    border: `1px solid ${tab.color}50`,
                                                    color: '#fff'
                                                } : {
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'rgba(255,255,255,0.3)'
                                                }}
                                            >
                                                #{member.rank}
                                            </div>

                                            {/* Avatar */}
                                            <div
                                                className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
                                                style={{ border: `2px solid ${isMe ? tab.color + '55' : 'rgba(255,255,255,0.08)'}` }}
                                            >
                                                {member.photoUrl
                                                    ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-sm font-black"
                                                        style={{ background: `${tab.color}18`, color: isMe ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                                                        {member.name?.charAt(0)}
                                                      </div>
                                                }
                                            </div>

                                            {/* Name + level */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-[13px] font-bold text-white truncate">{member.name}</p>
                                                    {isMe && (
                                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md text-white flex-shrink-0"
                                                            style={{ background: tab.color }}>
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Shield size={9} style={{ color: tab.color }} />
                                                    <span className="text-[10px] text-white/30">Level {member.currentLevel || 1}</span>
                                                </div>
                                            </div>

                                            {/* Metric */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-[13px] font-black" style={{ color: isMe ? '#fff' : 'rgba(255,255,255,0.75)' }}>
                                                    {getMetric(member)}
                                                </p>
                                                {getSub(member) && (
                                                    <p className="text-[9px] text-white/28 mt-0.5 max-w-[90px] text-right truncate">
                                                        {getSub(member)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Bottom padding */}
                        <div className="h-4" />
                    </motion.div>
                </AnimatePresence>
            )}

            {/* ── STICKY YOUR RANK BAR ────────────────────────── */}
            <AnimatePresence>
                {myRank && myRank > 3 && !isLoading && (
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        className="fixed left-0 right-0 z-40 px-3 pointer-events-none"
                        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}
                    >
                        <div
                            className="max-w-lg mx-auto rounded-2xl p-3 flex items-center justify-between pointer-events-auto backdrop-blur-xl"
                            style={{
                                background: `linear-gradient(135deg, ${tab.color}25, rgba(13,13,26,0.97))`,
                                border: `1px solid ${tab.color}40`,
                                boxShadow: `0 -4px 24px ${tab.shadow}, 0 2px 16px rgba(0,0,0,0.5)`
                            }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                                    style={{ background: `${tab.color}35`, border: `1px solid ${tab.color}55` }}
                                >
                                    #{myRank}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-white">{tab.label} Rank</p>
                                    <p className="text-[9px] text-white/35">Keep grinding! 🔥</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-white">{getMetric(surrounding?.me || {})}</p>
                                {getSub(surrounding?.me || {}) && (
                                    <p className="text-[9px] text-white/30 mt-0.5">{getSub(surrounding?.me || {})}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberLeaderboard;
