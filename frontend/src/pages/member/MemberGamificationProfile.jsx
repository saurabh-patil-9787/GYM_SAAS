import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Shield, Zap, Target, Flame, TrendingUp, CheckCircle, Gift, Award, Lock, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TASK_LABELS = {
    workout:   { label: 'Complete your Workout',         hint: 'Auto-completes when you Check-in to the gym',   xp: 30 },
    water:     { label: 'Hit your Daily Water Goal',     hint: 'Auto-completes when you log your water goal',    xp: 10 },
    stretch:   { label: 'Complete 5 mins of Stretching', hint: 'Go to Health Hub → Timer → 🧘 Stretch',                           xp: 10 },
    attendance:{ label: 'Check-in to the Gym',           hint: 'Auto-completes when you Check-in to the gym',   xp: 20 },
};

const MemberGamificationProfile = () => {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [claimingReward, setClaimingReward] = useState(false);
    const [completingTask, setCompletingTask] = useState(null); // taskType string while loading
    const navigate = useNavigate();

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get('/api/v1/leaderboard/me');
            if (res.data.success) {
                setProfileData(res.data);
            }
        } catch (error) {
            console.error('Error fetching gamification profile', error);
            toast.error('Failed to load your progress. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleClaimReward = async () => {
        setClaimingReward(true);
        try {
            const res = await api.post('/api/v1/leaderboard/missions/claim');
            if (res.data.success) {
                toast.success(`🎉 +${res.data.points} XP Claimed!`);
                fetchProfile();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim reward');
        } finally {
            setClaimingReward(false);
        }
    };

    /**
     * Called when a member taps a task in the Daily Missions card.
     * Only 'stretch' can be manually completed — other tasks auto-complete via their own actions.
     */
    const handleCompleteTask = async (task) => {
        if (task.isCompleted) return;

        // Only stretch is manually completable from this screen
        if (task.type !== 'stretch') {
            const info = TASK_LABELS[task.type];
            toast(info?.hint || 'This task auto-completes via its own action', {
                icon: 'ℹ️',
                duration: 3000,
            });
            return;
        }

        setCompletingTask(task.type);
        try {
            const res = await api.post('/api/v1/leaderboard/missions/complete-task', { taskType: task.type });
            if (res.data.success) {
                if (res.data.xpAwarded > 0) {
                    toast.success(`🧘 Stretch done! +${res.data.xpAwarded} XP`);
                } else {
                    toast.success('Stretch already logged today!');
                }
                // Update mission in place without full refetch for snappy UX
                setProfileData(prev => ({
                    ...prev,
                    todayMission: res.data.mission || prev.todayMission
                }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not complete task');
        } finally {
            setCompletingTask(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-member-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profileData) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <Shield className="text-member-muted mb-3" size={40} />
            <p className="text-member-primary font-bold">Could not load your profile</p>
            <button onClick={fetchProfile} className="mt-4 text-xs text-member-accent underline">
                Try again
            </button>
        </div>
    );

    const { profile, overallRank, currentLevelThreshold = 0, nextLevelThreshold, todayMission, achievements } = profileData;

    // Accurate progress bar: progress within the CURRENT level range only
    const xpInCurrentLevel = profile.totalXP - currentLevelThreshold;
    const xpForNextLevel = nextLevelThreshold ? nextLevelThreshold - currentLevelThreshold : xpInCurrentLevel;
    const progressPercent = nextLevelThreshold
        ? Math.min(Math.max((xpInCurrentLevel / xpForNextLevel) * 100, 0), 100)
        : 100;

    const allMissionsCompleted = todayMission?.tasks?.every(t => t.isCompleted);
    const completedCount = todayMission?.tasks?.filter(t => t.isCompleted).length || 0;
    const totalCount = todayMission?.tasks?.length || 0;

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-syne text-member-primary">Your Progress</h1>
                    <p className="text-member-muted text-xs">Level up and earn rewards!</p>
                </div>
                <button
                    onClick={() => navigate('/member/leaderboard')}
                    className="flex items-center gap-1.5 text-xs font-bold text-member-accent bg-member-accent/10 px-3 py-1.5 rounded-lg border border-member-accent/20 active:scale-95 transition-transform"
                >
                    <Award size={14} /> View Ranks
                </button>
            </div>

            {/* Profile Card — Glassmorphism */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-br from-member-surface to-[#1a1a24] border border-member-border rounded-2xl p-5 mb-5 shadow-xl relative overflow-hidden"
            >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-member-accent/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-4 mb-5 relative z-10">
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-member-accent to-purple-500 flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-member-surface overflow-hidden flex items-center justify-center">
                            {profile.photoUrl
                                ? <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                : <span className="text-xl font-bold text-member-primary">{profile.name.charAt(0)}</span>
                            }
                        </div>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-member-primary">{profile.name}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-member-accent bg-member-accent/10 px-2 py-0.5 rounded border border-member-accent/20">
                                <Shield size={11} /> Level {profile.currentLevel}
                            </span>
                            <span className="text-[10px] text-member-muted uppercase font-syne tracking-wider">
                                Gym Rank #{overallRank}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Level Progress Bar */}
                <div className="relative z-10">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                        <span className="text-member-primary">{profile.totalXP} XP total</span>
                        {nextLevelThreshold
                            ? <span className="text-member-muted">{nextLevelThreshold} XP → Level {profile.currentLevel + 1}</span>
                            : <span className="text-member-accent">🏆 Max Level!</span>
                        }
                    </div>
                    <div className="w-full h-2.5 bg-member-bg rounded-full overflow-hidden border border-member-border/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-member-accent to-purple-500 rounded-full"
                        />
                    </div>
                    <p className="text-[10px] text-member-muted mt-1">
                        {nextLevelThreshold
                            ? `${xpInCurrentLevel} / ${xpForNextLevel} XP this level (${Math.round(progressPercent)}%)`
                            : 'You have reached the maximum level!'
                        }
                    </p>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
                <div className="bg-member-surface border border-member-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <Flame size={18} className="text-orange-500 mb-1" />
                    <p className="text-lg font-bold text-member-primary">{profile.streak}</p>
                    <p className="text-[9px] text-member-muted uppercase font-bold tracking-wider">Streak</p>
                </div>
                <div className="bg-member-surface border border-member-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <Zap size={18} className="text-member-accent mb-1" />
                    <p className="text-lg font-bold text-member-primary">{profile.weeklyXP}</p>
                    <p className="text-[9px] text-member-muted uppercase font-bold tracking-wider">Weekly XP</p>
                </div>
                <div className="bg-member-surface border border-member-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <TrendingUp size={18} className="text-emerald-500 mb-1" />
                    <p className="text-lg font-bold text-member-primary">{profile.consistencyScore}%</p>
                    <p className="text-[9px] text-member-muted uppercase font-bold tracking-wider">Consistency</p>
                </div>
            </div>

            {/* Daily Missions */}
            <h3 className="font-bold font-syne text-member-primary mb-3 flex items-center gap-2">
                <Target size={16} className="text-member-accent" /> Daily Missions
                <span className="ml-auto text-[11px] text-member-muted font-normal">
                    {completedCount}/{totalCount} done
                </span>
            </h3>

            <div className="bg-member-surface border border-member-border rounded-xl p-4 mb-5 relative overflow-hidden">
                {todayMission ? (
                    <>
                        <div className="space-y-2.5 relative z-10">
                            {todayMission.tasks.map((task, idx) => {
                                const info = TASK_LABELS[task.type] || { label: task.type, hint: '', xp: 0 };
                                const isManual = task.type === 'stretch';
                                const isLoading = completingTask === task.type;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleCompleteTask(task)}
                                        disabled={task.isCompleted || isLoading || !!completingTask}
                                        className={`w-full flex items-center gap-3 text-left rounded-lg px-2 py-1.5 transition-all
                                            ${task.isCompleted ? 'opacity-60 cursor-default' : isManual ? 'hover:bg-member-accent/5 active:scale-[0.98] cursor-pointer' : 'cursor-default'}
                                        `}
                                    >
                                        {/* Checkbox */}
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border flex-shrink-0 transition-all ${
                                            task.isCompleted
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                : isLoading
                                                    ? 'border-member-accent/50 text-member-accent'
                                                    : isManual
                                                        ? 'border-member-accent/40 bg-member-accent/5 text-transparent'
                                                        : 'border-member-border bg-member-bg text-transparent'
                                        }`}>
                                            {isLoading
                                                ? <Loader size={13} className="animate-spin" />
                                                : <CheckCircle size={14} />
                                            }
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${task.isCompleted ? 'line-through text-member-muted' : 'text-member-primary'}`}>
                                                {info.label}
                                            </p>
                                            {!task.isCompleted && (
                                                <p className="text-[10px] text-member-muted mt-0.5">{info.hint}</p>
                                            )}
                                        </div>

                                        {/* XP badge */}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                            task.isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-member-bg text-member-muted border border-member-border'
                                        }`}>
                                            +{info.xp}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Reward Row */}
                        <div className="mt-4 pt-3 border-t border-member-border relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-member-muted">
                                <Gift
                                    size={14}
                                    className={allMissionsCompleted && !todayMission.isRewardClaimed ? 'text-yellow-500 animate-bounce' : ''}
                                />
                                Reward: <span className="text-yellow-500">{todayMission.rewardXP} XP</span>
                            </div>
                            <button
                                onClick={handleClaimReward}
                                disabled={!allMissionsCompleted || todayMission.isRewardClaimed || claimingReward}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                    todayMission.isRewardClaimed
                                        ? 'bg-member-bg text-member-muted border border-member-border cursor-not-allowed'
                                        : allMissionsCompleted
                                            ? 'bg-member-accent text-white shadow-[0_0_15px_rgba(108,92,231,0.4)]'
                                            : 'bg-member-bg text-member-muted border border-member-border cursor-not-allowed'
                                }`}
                            >
                                {claimingReward ? 'Claiming...' : todayMission.isRewardClaimed ? '✓ Claimed' : 'Claim Reward'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-member-muted text-sm">No missions available today. Check back soon!</p>
                    </div>
                )}
            </div>

            {/* Badges / Achievements */}
            <h3 className="font-bold font-syne text-member-primary mb-3 flex items-center gap-2">
                <Award size={16} className="text-member-accent" /> Achievements
            </h3>

            {achievements && achievements.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    {achievements.map((ach) => (
                        <div key={ach._id} className="bg-member-surface border border-member-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center
                                ${ach.badge?.tier === 'champion' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.3)]' :
                                  ach.badge?.tier === 'gold'     ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                                  ach.badge?.tier === 'silver'   ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' :
                                                                   'bg-amber-800/20 text-amber-700 border border-amber-700/50'}`}
                            >
                                <Award size={24} />
                            </div>
                            <p className="text-[10px] font-bold text-member-primary leading-tight">{ach.badge?.name || 'Badge'}</p>
                            <p className="text-[8px] text-member-muted mt-1">
                                {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-member-surface border border-dashed border-member-border rounded-xl p-6 text-center">
                    <Lock className="mx-auto text-member-muted mb-2" size={32} />
                    <p className="text-sm font-bold text-member-primary">No Badges Yet</p>
                    <p className="text-xs text-member-muted mt-1">Hit the gym daily, rank on leaderboards, and complete missions to earn badges.</p>
                </div>
            )}
        </div>
    );
};

export default MemberGamificationProfile;
