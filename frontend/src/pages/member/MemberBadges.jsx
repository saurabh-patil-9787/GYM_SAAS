import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Award, Crown, ShieldCheck, ShieldAlert, Trophy, Activity, 
    Target, BarChart2, UserCheck, Droplets, Flame, Zap, 
    Calendar, CheckCircle2, Star, ChevronRight, Clock,
    TrendingUp, MapPin, Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const MemberBadges = () => {
    const [loading, setLoading] = useState(true);
    const [badgesData, setBadgesData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [activeSection, setActiveSection] = useState('badges');

    const fetchBadges = async () => {
        try {
            const [badgeRes, profileRes] = await Promise.all([
                api.get('/api/member/badges'),
                api.get('/api/member/profile')
            ]);
            setBadgesData(badgeRes.data);
            setProfile(profileRes.data);

            const newlyUnlockedBadges = (badgeRes.data.badges || []).filter(b => {
                if (!b.unlocked || !b.unlockedAt) return false;
                return (new Date() - new Date(b.unlockedAt)) < 24 * 60 * 60 * 1000;
            });

            newlyUnlockedBadges.forEach(badge => {
                const sessionKey = `toasted_badge_${badge.id}`;
                if (!sessionStorage.getItem(sessionKey)) {
                    sessionStorage.setItem(sessionKey, 'true');
                    const event = new CustomEvent('trackon:notification', {
                        detail: {
                            notification: { title: 'Badge Unlocked! 🎉', body: `Congratulations! You unlocked the "${badge.name}" badge!` },
                            data: { type: 'badge_unlocked', link: '/member/badges' }
                        }
                    });
                    window.dispatchEvent(event);
                }
            });
        } catch (e) {
            console.error('Failed to load badges wall details', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBadges(); }, []);

    if (loading || !badgesData || !profile) {
        return <BicepCurlLoader text="Opening Achievement Wall..." fullScreen={false} />;
    }

    const { badges, healthScore, consistencyCount, daysJoined } = badgesData;

    const getBadgeIcon = (iconName, unlocked, size = 24) => {
        const color = unlocked ? '#f59e0b' : '#555568';
        const props = { size, color };
        switch (iconName) {
            case 'Flame': return <Flame {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'Award': return <Award {...props} />;
            case 'Crown': return <Crown {...props} />;
            case 'ShieldAlert': return <ShieldAlert {...props} />;
            case 'ShieldCheck': return <ShieldCheck {...props} />;
            case 'Trophy': return <Trophy {...props} />;
            case 'Activity': return <Activity {...props} />;
            case 'Target': return <Target {...props} />;
            case 'BarChart2': return <BarChart2 {...props} />;
            case 'UserCheck': return <UserCheck {...props} />;
            case 'Droplets': return <Droplets {...props} />;
            default: return <Award {...props} />;
        }
    };

    const totalInvestment = (profile.paymentHistory || []).reduce((acc, pay) => acc + (pay.amount || 0), 0);
    const joinDate = new Date(profile.joiningDate || profile.createdAt);
    const now = new Date();
    const daysSinceJoining = Math.max(1, Math.round((now - joinDate) / (1000 * 60 * 60 * 24)));

    const milestones = [
        { days: 30, label: '1-Month Pioneer', icon: '🌱', accentColor: '#00c97a', softBg: 'rgba(0,201,122,0.12)', border: 'rgba(0,201,122,0.25)' },
        { days: 90, label: '3-Month Club', icon: '🔥', accentColor: '#f59e0b', softBg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
        { days: 180, label: '6-Month Club', icon: '⚡', accentColor: '#6c5ce7', softBg: 'rgba(108,92,231,0.12)', border: 'rgba(108,92,231,0.25)' },
        { days: 365, label: 'Annual Champion', icon: '👑', accentColor: '#f59e0b', softBg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.30)' },
    ];

    const nextMilestone = milestones.find(m => daysSinceJoining < m.days);
    const lastMilestone = [...milestones].reverse().find(m => daysSinceJoining >= m.days);

    // Health Score breakdown
    const hasHeightWeight = !!(profile.height && profile.weight);
    let bmiPts = 0;
    if (hasHeightWeight) {
        const h = profile.height / 100;
        const bmiVal = profile.weight / (h * h);
        if (bmiVal >= 18.5 && bmiVal < 25) bmiPts = 25;
        else if ((bmiVal >= 17 && bmiVal < 18.5) || (bmiVal >= 25 && bmiVal < 27)) bmiPts = 20;
        else if (bmiVal >= 27) bmiPts = 12;
        else bmiPts = 8;
    }

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
    const last30CheckIns = (profile.checkIns || []).filter(c => new Date(c.date) >= thirtyDaysAgo).length;
    const consistencyPts = Math.min(25, Math.round((last30CheckIns / 12) * 25));

    let goalPts = 0;
    if (profile.goalWeight && profile.fitnessGoal) {
        goalPts += 10;
        if ((profile.progressLogs || []).length >= 2) goalPts += 15;
        else if ((profile.progressLogs || []).length === 1) goalPts += 5;
    }

    let profilePts = 0;
    if (profile.gender) profilePts += 5;
    if (profile.activityLevel) profilePts += 5;
    if (profile.dob) profilePts += 5;
    if (profile.city) profilePts += 5;
    if (profile.preferredWorkoutTime) profilePts += 5;

    const scoreBreakdown = [
        { label: 'BMI Status', pts: bmiPts, max: 25, color: '#6c5ce7', tip: 'Update weight in profile to improve', icon: <TrendingUp size={12} /> },
        { label: 'Gym Consistency', pts: consistencyPts, max: 25, color: '#f59e0b', tip: 'Check in more days this month', icon: <Flame size={12} /> },
        { label: 'Goal Progress', pts: goalPts, max: 25, color: '#00c97a', tip: 'Set a goal and log weight entries', icon: <Target size={12} /> },
        { label: 'Profile Complete', pts: profilePts, max: 25, color: '#f43f5e', tip: 'Add gender, city, DOB in profile', icon: <UserCheck size={12} /> },
    ];
    const lowestComponent = [...scoreBreakdown].sort((a, b) => (a.pts / a.max) - (b.pts / b.max))[0];

    const scoreLabel = healthScore >= 80 ? 'Excellent 🌟' : healthScore >= 60 ? 'Good 👍' : healthScore >= 40 ? 'Fair 💪' : 'Getting Started 🏃';
    const scoreAccent = healthScore >= 80 ? '#00c97a' : healthScore >= 60 ? '#6c5ce7' : healthScore >= 40 ? '#f59e0b' : '#f43f5e';

    const getBadgeProgress = (badge) => {
        if (badge.unlocked) return null;
        const checkInCount = (profile.checkIns || []).length;
        const currentStreak = badgesData.currentStreak || 0;
        const progressLogsCount = (profile.progressLogs || []).length;
        switch (badge.id) {
            case 'first_step': return { current: checkInCount, target: 1, label: 'check-ins' };
            case 'streak_7': return { current: Math.min(7, currentStreak), target: 7, label: 'day streak' };
            case 'streak_30': return { current: Math.min(30, currentStreak), target: 30, label: 'day streak' };
            case 'centurion': return { current: Math.min(100, checkInCount), target: 100, label: 'check-ins' };
            case 'club_3m': return { current: Math.min(90, daysSinceJoining), target: 90, label: 'days' };
            case 'club_6m': return { current: Math.min(180, daysSinceJoining), target: 180, label: 'days' };
            case 'annual_champion': return { current: Math.min(365, daysSinceJoining), target: 365, label: 'days' };
            case 'data_nerd': return { current: Math.min(10, progressLogsCount), target: 10, label: 'logs' };
            default: return null;
        }
    };

    // Calendar
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const checkInDates = new Set((profile.checkIns || []).map(c => c.date));

    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(currentYear, currentMonth, d).getDay() !== 0) workingDays++;
    }
    const checkedThisMonth = Array.from(checkInDates).filter(dateStr => {
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const calendarCells = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const month = String(currentMonth + 1).padStart(2, '0');
        const day = String(d).padStart(2, '0');
        const dateStr = `${currentYear}-${month}-${day}`;
        calendarCells.push({ day: d, checked: checkInDates.has(dateStr), isToday: d === now.getDate() });
    }

    // Timeline
    const timelineNodes = [];
    timelineNodes.push({ type: 'join', date: joinDate, label: 'Joined the Gym! 🏁', sub: `Welcome to ${profile.gym?.gymName || 'the gym'}`, icon: '🏁', color: '#6c5ce7' });

    milestones.forEach(m => {
        if (daysSinceJoining >= m.days) {
            const milestoneDate = new Date(joinDate);
            milestoneDate.setDate(milestoneDate.getDate() + m.days);
            timelineNodes.push({ type: 'milestone', date: milestoneDate, label: `${m.icon} ${m.label} Unlocked!`, sub: `${m.days} days of dedication`, icon: m.icon, color: '#f59e0b' });
        }
    });

    (profile.paymentHistory || []).forEach((pay) => {
        timelineNodes.push({
            type: 'payment', date: new Date(pay.date),
            label: `₹${pay.amount} — ${pay.transactionType === 'registration' ? 'Joined' : 'Renewed'} ${profile.planName || ''}`,
            sub: `${pay.type} • ${pay.transactionType}`, icon: '💰', color: '#00c97a'
        });
    });
    timelineNodes.sort((a, b) => a.date - b.date);

    const newlyUnlocked = (badge) => {
        if (!badge.unlocked || !badge.unlockedAt) return false;
        return (now - new Date(badge.unlockedAt)) < 24 * 60 * 60 * 1000;
    };

    const SECTION_TABS = [
        { id: 'badges', label: '🏆 Badges' },
        { id: 'checkins', label: '📅 Calendar' },
        { id: 'timeline', label: '🛤 Journey' },
    ];

    return (
        <div className="pb-24 max-w-lg mx-auto">
            {/* ── Hero Header */}
            <div className="bg-gradient-to-br from-[#0a0a0f] to-[#111118] border-b border-member-border px-5 pt-5 pb-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-member-amber/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-member-amber-soft border border-member-amber/20 flex items-center justify-center">
                        <Award className="text-member-amber" size={18} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-member-primary tracking-tight">Trophies & Journey</h1>
                        <p className="text-[10px] text-member-secondary font-medium">Badges · Milestones · Gym Consistency</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-4">
                {/* ── Section Tab Bar */}
                <div className="member-tab-container mb-5">
                    {SECTION_TABS.map(t => {
                        const isSel = activeSection === t.id;
                        return (
                            <button key={t.id} onClick={() => setActiveSection(t.id)}
                                className={`member-tab-item ${isSel ? 'member-tab-item-active' : ''}`}>
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">

                    {/* ─── BADGES TAB ───────────────────────────────────────────── */}
                    {activeSection === 'badges' && (
                        <motion.div key="badges" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">

                            {/* Health Score Card */}
                            <div className="member-card relative overflow-hidden">
                                <div className="ambient-glow ambient-glow-tr" style={{ backgroundColor: scoreAccent }} />
                                <div className="flex items-center gap-1.5 mb-4 relative z-10">
                                    <Star size={13} className="text-member-accent" />
                                    <p className="member-micro-text">Dynamic Health Score</p>
                                </div>

                                <div className="flex items-center gap-5 mb-5 relative z-10">
                                    {/* SVG Ring */}
                                    <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                                            <circle cx="40" cy="40" r="33" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="transparent" />
                                            <motion.circle
                                                cx="40" cy="40" r="33"
                                                stroke="url(#hg_dark)"
                                                strokeWidth="7" fill="transparent"
                                                strokeDasharray={2 * Math.PI * 33}
                                                initial={{ strokeDashoffset: 2 * Math.PI * 33 }}
                                                animate={{ strokeDashoffset: 2 * Math.PI * 33 * (1 - healthScore / 100) }}
                                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient id="hg_dark" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#6c5ce7" />
                                                    <stop offset="100%" stopColor="#38bdf8" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-xl font-black text-member-primary leading-none">{healthScore}</span>
                                            <span className="text-[8px] text-member-muted font-bold uppercase">/ 100</span>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-sm font-black" style={{ color: scoreAccent }}>{scoreLabel}</p>
                                        <p className="text-[10px] text-member-secondary mt-0.5 leading-snug">
                                            Combines BMI, consistency, goal progress & profile data
                                        </p>
                                        <div className="mt-2 bg-member-accent-soft border border-member-accent/20 rounded-lg px-2.5 py-1.5 text-[10px] text-member-accent font-semibold flex items-start gap-1.5">
                                            <Sparkles size={11} className="flex-shrink-0 mt-0.5" />
                                            {lowestComponent.tip}
                                        </div>
                                    </div>
                                </div>

                                {/* Score Breakdown Bars */}
                                <div className="space-y-2.5 relative z-10">
                                    {scoreBreakdown.map((comp, i) => (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-member-secondary flex items-center gap-1" style={{ color: comp.color }}>
                                                    {comp.icon} {comp.label}
                                                </span>
                                                <span className="text-[10px] font-black text-member-primary">{comp.pts} / {comp.max}</span>
                                            </div>
                                            <div className="w-full h-2 bg-member-surface rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(comp.pts / comp.max) * 100}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: comp.color }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Badge Wall */}
                            <div className="member-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Crown size={13} className="text-member-amber" />
                                        <p className="member-micro-text">My Trophy Room</p>
                                    </div>
                                    <span className="text-[10px] font-black text-member-accent bg-member-accent-soft border border-member-accent/20 px-2 py-0.5 rounded-full">
                                        {badges.filter(b => b.unlocked).length} / {badges.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    {badges.map(b => {
                                        const isNew = newlyUnlocked(b);
                                        const progress = getBadgeProgress(b);
                                        const progressPct = progress ? Math.round((progress.current / progress.target) * 100) : 0;

                                        return (
                                            <motion.div
                                                key={b.id}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className={`rounded-2xl p-3 border text-center relative flex flex-col items-center gap-1.5 transition-all ${
                                                    b.unlocked
                                                        ? 'bg-member-amber-soft border-member-amber/20 shadow-sm'
                                                        : 'bg-member-surface border-member-border opacity-70'
                                                }`}
                                            >
                                                {isNew && (
                                                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-member-emerald text-[#111118] text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-wider">
                                                        NEW!
                                                    </span>
                                                )}
                                                {b.unlocked && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-member-emerald border-2 border-member-card flex items-center justify-center text-[7px] text-[#111118] font-extrabold">
                                                        ✓
                                                    </span>
                                                )}

                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${b.unlocked ? 'bg-member-amber/15' : 'bg-member-elevated'}`}>
                                                    {getBadgeIcon(b.icon, b.unlocked, 22)}
                                                </div>

                                                <div>
                                                    <p className={`text-[9px] font-black leading-tight ${b.unlocked ? 'text-member-primary' : 'text-member-muted'}`}>
                                                        {b.name}
                                                    </p>
                                                    {b.unlocked && b.unlockedAt && (
                                                        <p className="text-[7px] text-member-amber font-semibold mt-0.5">
                                                            {new Date(b.unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>

                                                {!b.unlocked && progress && (
                                                    <div className="w-full">
                                                        <div className="w-full h-1 bg-member-elevated rounded-full overflow-hidden">
                                                            <div className="h-full bg-member-accent rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                                                        </div>
                                                        <p className="text-[7px] text-member-muted font-semibold mt-0.5">
                                                            {progress.current}/{progress.target} {progress.label}
                                                        </p>
                                                    </div>
                                                )}
                                                {!b.unlocked && !progress && (
                                                    <p className="text-[7px] text-member-muted font-medium leading-snug line-clamp-2">
                                                        {b.description}
                                                    </p>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── CHECK-IN CALENDAR TAB ──────────────────────────────── */}
                    {activeSection === 'checkins' && (
                        <motion.div key="checkins" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { label: 'Total Sessions', value: consistencyCount, accent: '#6c5ce7', soft: 'rgba(108,92,231,0.12)', border: 'rgba(108,92,231,0.2)' },
                                    { label: 'This Month', value: `${checkedThisMonth}/${workingDays}`, accent: '#00c97a', soft: 'rgba(0,201,122,0.12)', border: 'rgba(0,201,122,0.2)' },
                                    { label: 'Days Active', value: daysSinceJoining, accent: '#f59e0b', soft: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
                                ].map((stat, i) => (
                                    <motion.div key={i} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                                        className="rounded-2xl p-3.5 text-center border"
                                        style={{ backgroundColor: stat.soft, borderColor: stat.border }}>
                                        <p className="text-xl font-black leading-none" style={{ color: stat.accent }}>{stat.value}</p>
                                        <p className="text-[9px] text-member-muted font-semibold uppercase tracking-wider mt-1">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Consistency meter */}
                            <div className="member-card">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Flame size={13} className="text-member-amber" />
                                        <p className="member-micro-text">{monthName} Consistency</p>
                                    </div>
                                    <span className={`text-xs font-black ${checkedThisMonth / workingDays >= 0.7 ? 'text-member-emerald' : 'text-member-amber'}`}>
                                        {Math.round((checkedThisMonth / Math.max(1, workingDays)) * 100)}%
                                    </span>
                                </div>
                                <div className="member-progress-track mb-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, Math.round((checkedThisMonth / Math.max(1, workingDays)) * 100))}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className="member-progress-fill bg-gradient-to-r from-member-amber to-orange-500"
                                    />
                                </div>
                                <p className="text-[10px] text-member-muted">
                                    {checkedThisMonth} check-ins out of {workingDays} working days this month
                                </p>
                            </div>

                            {/* Heatmap Calendar */}
                            <div className="member-card">
                                <div className="flex items-center gap-1.5 mb-4">
                                    <Calendar size={13} className="text-member-accent" />
                                    <p className="member-micro-text">Check-in Heatmap — {now.toLocaleDateString('en-IN', { month: 'long' })}</p>
                                </div>

                                {/* Day Labels */}
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {dayLabels.map((d, i) => (
                                        <div key={i} className="text-center text-[9px] font-bold text-member-muted uppercase">{d}</div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarCells.map((cell, i) => {
                                        if (!cell) return <div key={`empty-${i}`} className="aspect-square" />;
                                        return (
                                            <motion.div
                                                key={cell.day}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: i * 0.008 }}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${
                                                    cell.checked
                                                        ? 'bg-gradient-to-br from-member-amber to-orange-500 text-[#111118] border-transparent shadow-sm'
                                                        : cell.isToday
                                                        ? 'bg-member-accent-soft border-member-accent text-member-accent'
                                                        : 'bg-member-surface border-member-border text-member-muted'
                                                }`}
                                            >
                                                {cell.checked ? '🔥' : cell.day}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-member-border">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded bg-gradient-to-br from-member-amber to-orange-500" />
                                        <span className="text-[9px] text-member-muted font-semibold">Checked In</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded bg-member-accent-soft border border-member-accent" />
                                        <span className="text-[9px] text-member-muted font-semibold">Today</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded bg-member-surface border border-member-border" />
                                        <span className="text-[9px] text-member-muted font-semibold">Missed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Next Milestone */}
                            {nextMilestone && (
                                <div className="member-card border" style={{ backgroundColor: nextMilestone.softBg, borderColor: nextMilestone.border }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-[9px] text-member-muted font-bold uppercase tracking-wider">Next Milestone</p>
                                            <p className="text-sm font-black mt-0.5" style={{ color: nextMilestone.accentColor }}>{nextMilestone.icon} {nextMilestone.label}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-member-primary">{nextMilestone.days - daysSinceJoining}</p>
                                            <p className="text-[9px] text-member-muted font-semibold">days to go</p>
                                        </div>
                                    </div>
                                    <div className="member-progress-track">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((daysSinceJoining / nextMilestone.days) * 100)}%` }}
                                            transition={{ duration: 0.8 }}
                                            className="member-progress-fill"
                                            style={{ backgroundColor: nextMilestone.accentColor }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-member-muted mt-1.5">{daysSinceJoining} / {nextMilestone.days} days</p>
                                </div>
                            )}
                            {lastMilestone && !nextMilestone && (
                                <div className="member-card text-center bg-member-amber-soft border-member-amber/20">
                                    <p className="text-2xl mb-1">👑</p>
                                    <p className="text-sm font-black text-member-amber">Annual Champion Achieved!</p>
                                    <p className="text-[10px] text-member-secondary mt-0.5">You've been active for {daysSinceJoining} days. Incredible!</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── JOURNEY TIMELINE TAB ───────────────────────────────── */}
                    {activeSection === 'timeline' && (
                        <motion.div key="timeline" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {/* Summary Card */}
                            <div className="member-card-hero relative overflow-hidden">
                                <div className="ambient-glow ambient-glow-tr bg-member-accent" />
                                <div className="grid grid-cols-3 gap-3 text-center relative z-10">
                                    <div>
                                        <p className="text-2xl font-black text-member-primary">{daysSinceJoining}</p>
                                        <p className="text-[9px] text-member-muted font-semibold uppercase tracking-wider mt-0.5">Days Active</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-member-amber">₹{totalInvestment.toLocaleString('en-IN')}</p>
                                        <p className="text-[9px] text-member-muted font-semibold uppercase tracking-wider mt-0.5">Invested in Health</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-member-emerald">{consistencyCount}</p>
                                        <p className="text-[9px] text-member-muted font-semibold uppercase tracking-wider mt-0.5">Gym Sessions</p>
                                    </div>
                                </div>
                                {lastMilestone && (
                                    <div className="mt-4 pt-3 border-t border-member-border text-center relative z-10">
                                        <p className="text-xs text-member-secondary font-semibold">Latest Milestone</p>
                                        <p className="text-sm font-black text-member-primary mt-0.5">{lastMilestone.icon} {lastMilestone.label}</p>
                                    </div>
                                )}
                            </div>

                            {/* Timeline */}
                            <div className="member-card">
                                <div className="flex items-center gap-1.5 mb-5">
                                    <MapPin size={13} className="text-member-accent" />
                                    <p className="member-micro-text">Your Gym Journey</p>
                                </div>

                                <div className="relative">
                                    {/* Vertical line */}
                                    <div className="absolute left-3.5 top-2 bottom-2 w-px bg-member-border" />

                                    <div className="space-y-5">
                                        {timelineNodes.map((node, i) => (
                                            <motion.div key={i} initial={{ x: -15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}
                                                className="flex items-start gap-4 relative">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 relative z-10 border-2 border-member-card shadow-sm"
                                                    style={{ backgroundColor: node.color }}>
                                                    {node.icon}
                                                </div>
                                                <div className="flex-1 pb-1">
                                                    <p className="text-xs font-extrabold text-member-primary leading-snug">{node.label}</p>
                                                    <p className="text-[10px] text-member-secondary mt-0.5">{node.sub}</p>
                                                    <p className="text-[9px] text-member-muted mt-0.5 font-semibold">
                                                        {node.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {nextMilestone && (
                                        <div className="mt-5 pt-4 border-t border-member-border">
                                            <div className="flex items-center gap-3 opacity-40">
                                                <div className="w-7 h-7 rounded-full bg-member-elevated border-2 border-dashed border-member-border flex items-center justify-center text-[11px] flex-shrink-0">
                                                    {nextMilestone.icon}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-extrabold text-member-muted">
                                                        {nextMilestone.label} <span className="text-[9px] font-normal">— in {nextMilestone.days - daysSinceJoining} days</span>
                                                    </p>
                                                    <p className="text-[9px] text-member-muted mt-0.5">Keep showing up! You're almost there 💪</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MemberBadges;
