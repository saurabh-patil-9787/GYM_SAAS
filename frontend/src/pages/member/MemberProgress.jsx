import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, Plus, Target, Award, Save,
    AlertCircle, ChevronDown, ChevronUp, Calendar, Scale,
    ArrowDown, ArrowUp, Minus, CheckCircle2, Clock
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

// ─── Custom Dark Tooltip ──────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="member-card px-3 py-2 shadow-xl !p-3">
                <p className="text-[10px] text-member-accent font-bold">{label}</p>
                <p className="text-sm font-black text-member-primary">{payload[0].value} kg</p>
            </div>
        );
    }
    return null;
};

const MemberProgress = () => {
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState(null);
    const [weightLogs, setWeightLogs] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showAllLogs, setShowAllLogs] = useState(false);
    
    const [logWeight, setLogWeight] = useState('');
    const [logWaist, setLogWaist] = useState('');
    const [logChest, setLogChest] = useState('');
    const [logHip, setLogHip] = useState('');
    const [logArms, setLogArms] = useState('');
    const [logThighs, setLogThighs] = useState('');
    const [logNotes, setLogNotes] = useState('');
    const [showMeasurements, setShowMeasurements] = useState(false);

    const [editGoals, setEditGoals] = useState(false);
    const [fitGoal, setFitGoal] = useState('lose_weight');
    const [targetWeight, setTargetWeight] = useState(70);
    const [targetDateStr, setTargetDateStr] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [unlockedBadges, setUnlockedBadges] = useState([]);

    const fetchProgress = async () => {
        try {
            const res = await api.get('/api/member/progress');
            setProgressData(res.data);
            const logs = (res.data.progressLogs || []).map(log => ({
                ...log,
                displayDate: new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                timestamp: new Date(log.date).getTime()
            })).sort((a, b) => a.timestamp - b.timestamp);
            setWeightLogs(logs);
            if (res.data.fitnessGoal) setFitGoal(res.data.fitnessGoal);
            if (res.data.goalWeight) setTargetWeight(res.data.goalWeight);
            if (res.data.targetDate) setTargetDateStr(new Date(res.data.targetDate).toISOString().split('T')[0]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProgress(); }, []);

    const handleUpdateGoals = async () => {
        setIsSaving(true);
        try {
            await api.put('/api/member/fitness-goals', {
                fitnessGoal: fitGoal, goalWeight: Number(targetWeight), targetDate: targetDateStr || null
            });
            setEditGoals(false);
            fetchProgress();
        } catch {}
        finally { setIsSaving(false); }
    };

    const handleLogProgress = async (e) => {
        e.preventDefault();
        if (!logWeight) return;
        setIsSaving(true);
        try {
            const res = await api.post('/api/member/progress', {
                weight: Number(logWeight),
                waist: logWaist ? Number(logWaist) : null,
                chest: logChest ? Number(logChest) : null,
                hip: logHip ? Number(logHip) : null,
                arms: logArms ? Number(logArms) : null,
                thighs: logThighs ? Number(logThighs) : null,
                notes: logNotes
            });
            if (res.data.unlockedBadges?.length > 0) setUnlockedBadges(res.data.unlockedBadges);
            setLogWeight(''); setLogWaist(''); setLogChest(''); setLogHip('');
            setLogArms(''); setLogThighs(''); setLogNotes('');
            setShowLogModal(false);
            fetchProgress();
        } catch {}
        finally { setIsSaving(false); }
    };

    let joinedSummary = { display: false };
    let projectionSummary = { calculable: false };
    let percentComplete = 0;
    let isOnTrack = null;
    let weeklyTargetKg = null;

    if (weightLogs.length > 0 && progressData) {
        const startWeight = weightLogs[0].weight;
        const currentWeight = progressData.weight || weightLogs[weightLogs.length - 1].weight;
        const goalWeight = progressData.goalWeight;
        const change = parseFloat((currentWeight - startWeight).toFixed(1));
        const daysSince = Math.max(1, Math.round((Date.now() - weightLogs[0].timestamp) / 86400000));
        joinedSummary = {
            display: true, change: Math.abs(change),
            direction: change < 0 ? 'lost' : change > 0 ? 'gained' : 'maintained',
            days: daysSince, current: currentWeight, start: startWeight
        };

        if (goalWeight && startWeight !== goalWeight) {
            const totalDiff = Math.abs(startWeight - goalWeight);
            const achievedDiff = Math.abs(startWeight - currentWeight);
            percentComplete = Math.min(100, Math.round((achievedDiff / totalDiff) * 100));
        }

        if (weightLogs.length >= 2 && goalWeight) {
            const first = weightLogs[0];
            const latest = weightLogs[weightLogs.length - 1];
            const elapsed = Math.max(1, Math.round((latest.timestamp - first.timestamp) / 86400000));
            const ratePerDay = (latest.weight - first.weight) / elapsed;
            const ratePerWeek = ratePerDay * 7;
            const remaining = goalWeight - currentWeight;
            const movingCorrect =
                (progressData.fitnessGoal === 'lose_weight' && ratePerDay < 0) ||
                (progressData.fitnessGoal === 'gain_muscle' && ratePerDay > 0);
            isOnTrack = movingCorrect;
            if (movingCorrect && ratePerDay !== 0) {
                const daysNeeded = remaining / ratePerDay;
                const est = new Date(); est.setDate(est.getDate() + Math.ceil(daysNeeded));
                projectionSummary = {
                    calculable: true,
                    ratePerWeek: Math.abs(ratePerWeek).toFixed(2),
                    targetDateStr: est.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                };
            }
            if (targetDateStr && goalWeight) {
                const weeksLeft = Math.max(1, Math.ceil((new Date(targetDateStr) - Date.now()) / (7 * 86400000)));
                weeklyTargetKg = Math.abs(remaining / weeksLeft).toFixed(2);
            }
        }
    }

    if (loading) return <BicepCurlLoader text="Loading Progress..." fullScreen={false} />;

    const goalConfig = {
        lose_weight: { label: 'Lose Weight', emoji: '📉', accent: '#00c97a', soft: 'rgba(0,201,122,0.12)', border: 'rgba(0,201,122,0.2)', barGrad: 'from-member-emerald to-teal-500' },
        gain_muscle:  { label: 'Build Muscle', emoji: '💪', accent: '#6c5ce7', soft: 'rgba(108,92,231,0.12)', border: 'rgba(108,92,231,0.2)', barGrad: 'from-member-accent to-indigo-600' },
        maintain:     { label: 'Maintain',     emoji: '⚖',  accent: '#f59e0b', soft: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)', barGrad: 'from-member-amber to-orange-500' },
    };
    const gc = goalConfig[fitGoal] || goalConfig.maintain;

    return (
        <div className="pb-28">
            {/* ── Hero Header */}
            <div className="bg-gradient-to-br from-[#0a0a0f] to-[#111118] px-5 pt-5 pb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-member-accent/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-member-emerald/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-member-accent-soft border border-member-accent/20 flex items-center justify-center">
                                <TrendingUp className="text-member-accent" size={16} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-member-primary tracking-tight">Progress Tracker</h1>
                                <p className="text-[10px] text-member-secondary font-medium">Weight · Measurements · Goals</p>
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowLogModal(true)}
                            className="flex items-center gap-1.5 bg-member-accent text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-member-accent/20 border border-member-accent/30">
                            <Plus size={14} /> Log Weight
                        </motion.button>
                    </div>

                    {joinedSummary.display && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {[
                                { label: 'Start', value: `${joinedSummary.start}kg`, sub: 'First log', color: 'text-member-emerald', border: 'border-member-emerald/30' },
                                { label: 'Now', value: `${joinedSummary.current}kg`, sub: `${joinedSummary.days}d active`, color: 'text-member-sky', border: 'border-member-sky/30' },
                                { label: joinedSummary.direction === 'lost' ? 'Lost' : joinedSummary.direction === 'gained' ? 'Gained' : 'Change', value: `${joinedSummary.change}kg`, sub: 'total', color: 'text-member-amber', border: 'border-member-amber/30' },
                            ].map((s, i) => (
                                <div key={i} className={`bg-member-surface border ${s.border} rounded-xl p-2.5 text-center`}>
                                    <p className={`font-syne text-[9px] ${s.color} font-semibold uppercase tracking-wider`}>{s.label}</p>
                                    <p className="font-syne text-base font-black text-member-primary leading-none mt-1">{s.value}</p>
                                    <p className="font-syne text-[8px] text-member-muted mt-0.5">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 pt-5 space-y-4">

                {/* ── Goal Card */}
                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="member-card overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${gc.barGrad} absolute top-0 left-0 right-0`} />
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base border"
                                    style={{ backgroundColor: gc.soft, borderColor: gc.border }}>
                                    {gc.emoji}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-member-primary">Fitness Goal</p>
                                    <p className="text-[10px] font-bold" style={{ color: gc.accent }}>{gc.label}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditGoals(!editGoals)}
                                className="text-[10px] font-black text-member-accent bg-member-accent-soft border border-member-accent/20 px-2.5 py-1 rounded-lg hover:bg-member-accent/20 transition-all active:scale-95">
                                {editGoals ? 'Cancel' : 'Edit Goal'}
                            </button>
                        </div>

                        {!editGoals ? (
                            <div>
                                <div className="flex items-end justify-between mb-2.5">
                                    <div>
                                        <p className="text-sm font-bold text-member-secondary">
                                            Target: <span className="text-member-primary font-black">{targetWeight} kg</span>
                                            {targetDateStr && <span className="text-member-muted font-medium text-xs ml-1">by {new Date(targetDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black leading-none" style={{ color: gc.accent }}>{percentComplete}%</p>
                                        <p className="text-[9px] text-member-muted font-semibold uppercase">Complete</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="member-progress-track mb-2" style={{ height: '10px' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentComplete}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className={`member-progress-fill bg-gradient-to-r ${gc.barGrad} relative`}>
                                        {percentComplete > 10 && (
                                            <div className="absolute right-1 top-0 bottom-0 flex items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {isOnTrack !== null && (
                                    <div className={`flex items-center gap-2 rounded-xl p-2.5 mt-2 border ${isOnTrack ? 'bg-member-emerald-soft border-member-emerald/20' : 'bg-member-amber-soft border-member-amber/20'}`}>
                                        {isOnTrack ? (
                                            <><CheckCircle2 size={13} className="text-member-emerald flex-shrink-0" />
                                            <p className="text-[10px] font-bold text-member-emerald">You're on track!</p></>
                                        ) : (
                                            <><AlertCircle size={13} className="text-member-amber flex-shrink-0" />
                                            <p className="text-[10px] font-bold text-member-amber">Pace up — weight isn't moving in goal direction yet</p></>
                                        )}
                                    </div>
                                )}

                                {weeklyTargetKg && (
                                    <div className="mt-3 flex items-center gap-2.5 bg-member-accent-soft border border-member-accent/20 rounded-xl p-3">
                                        <Clock size={14} className="text-member-accent flex-shrink-0" />
                                        <p className="text-[10px] text-member-secondary font-semibold">
                                            To stay on track: {fitGoal === 'lose_weight' ? 'lose' : 'gain'} <strong className="text-member-primary">{weeklyTargetKg} kg/week</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3.5">
                                <div>
                                    <label className="member-micro-text block mb-2">Goal Type</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {Object.entries(goalConfig).map(([key, cfg]) => (
                                            <button key={key} onClick={() => setFitGoal(key)}
                                                className="py-2.5 rounded-xl text-[10px] font-black border transition-all"
                                                style={fitGoal === key
                                                    ? { backgroundColor: cfg.soft, borderColor: cfg.border, color: cfg.accent }
                                                    : { backgroundColor: '#17171f', borderColor: 'rgba(255,255,255,0.07)', color: '#555568' }}>
                                                {cfg.emoji} {cfg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="member-micro-text block mb-1.5">Target Weight (kg)</label>
                                        <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
                                            className="w-full bg-member-elevated border border-member-border rounded-xl px-3 py-2.5 text-sm font-black text-member-primary outline-none focus:border-member-accent" />
                                    </div>
                                    <div>
                                        <label className="member-micro-text block mb-1.5">Target Date</label>
                                        <input type="date" value={targetDateStr} onChange={e => setTargetDateStr(e.target.value)}
                                            className="w-full bg-member-elevated border border-member-border rounded-xl px-3 py-2 text-xs font-semibold text-member-primary outline-none focus:border-member-accent" />
                                    </div>
                                </div>
                                <button onClick={handleUpdateGoals} disabled={isSaving}
                                    className="member-btn-primary flex items-center justify-center gap-1.5">
                                    <Save size={13} /> {isSaving ? 'Saving...' : 'Save Goal Settings'}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* ── Weight Chart */}
                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 }} className="member-card overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-member-accent to-indigo-500 absolute top-0 left-0 right-0" />
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-member-accent-soft border border-member-accent/20 flex items-center justify-center">
                                <Scale className="text-member-accent" size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-member-primary">Weight Trend Chart</p>
                                <p className="text-[10px] text-member-secondary">{weightLogs.length} data points</p>
                            </div>
                        </div>

                        <div className="h-52 w-full -ml-3">
                            {weightLogs.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weightLogs} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="weightGrad_dark" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.25} />
                                                <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="displayDate" stroke="#555568" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                                        <YAxis domain={['dataMin - 3', 'dataMax + 3']} stroke="#555568" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        {progressData?.goalWeight && (
                                            <ReferenceLine y={progressData.goalWeight} stroke="#f43f5e" strokeDasharray="5 3"
                                                label={{ value: `Goal: ${progressData.goalWeight}kg`, fill: '#f43f5e', fontSize: 9, fontWeight: 'bold', position: 'insideTopRight' }} />
                                        )}
                                        <Area type="monotone" dataKey="weight" stroke="#6c5ce7" strokeWidth={2.5}
                                            fill="url(#weightGrad_dark)"
                                            dot={{ r: 3, stroke: '#0a0a0f', strokeWidth: 2, fill: '#6c5ce7' }}
                                            activeDot={{ r: 5, stroke: '#0a0a0f', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-member-elevated flex items-center justify-center mb-3">
                                        <TrendingUp className="text-member-muted" size={22} />
                                    </div>
                                    <p className="text-xs font-bold text-member-secondary">No weight entries yet</p>
                                    <p className="text-[10px] text-member-muted mt-0.5">Tap "Log Weight" to start your journey</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Smart Projection */}
                {joinedSummary.display && (
                    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.14 }} className="grid grid-cols-2 gap-3">
                        {/* Trend Direction */}
                        <div className={`member-card relative overflow-hidden ${
                            joinedSummary.direction === 'lost' ? 'bg-member-emerald-soft border-member-emerald/20'
                            : joinedSummary.direction === 'gained' ? 'bg-member-amber-soft border-member-amber/20'
                            : 'bg-member-surface border-member-border'
                        }`}>
                            <div className="absolute top-2 right-2 opacity-15 text-3xl">
                                {joinedSummary.direction === 'lost' ? '📉' : joinedSummary.direction === 'gained' ? '📈' : '➡️'}
                            </div>
                            <p className="text-[9px] font-bold text-member-muted uppercase tracking-wider">Since First Log</p>
                            <div className="flex items-center gap-1 mt-1.5">
                                {joinedSummary.direction === 'lost' ? <ArrowDown size={14} className="text-member-emerald" />
                                 : joinedSummary.direction === 'gained' ? <ArrowUp size={14} className="text-member-amber" />
                                 : <Minus size={14} className="text-member-muted" />}
                                <p className="text-xl font-black text-member-primary">{joinedSummary.change} kg</p>
                            </div>
                            <p className="text-[9px] text-member-muted mt-1">in {joinedSummary.days} days</p>
                        </div>

                        {/* Projection */}
                        <div className={`member-card relative overflow-hidden ${projectionSummary.calculable ? 'bg-member-accent-soft border-member-accent/20' : 'bg-member-surface border-member-border'}`}>
                            <div className="absolute top-2 right-2 opacity-15 text-3xl">🎯</div>
                            <p className="text-[9px] font-bold text-member-muted uppercase tracking-wider">Projection</p>
                            {projectionSummary.calculable ? (
                                <>
                                    <p className="text-xs font-black text-member-primary mt-1.5 leading-tight">{projectionSummary.targetDateStr}</p>
                                    <p className="text-[9px] text-member-accent font-semibold mt-1">{projectionSummary.ratePerWeek} kg/week pace</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-bold text-member-secondary mt-1.5 leading-tight">Keep logging!</p>
                                    <p className="text-[9px] text-member-muted mt-0.5">Need 2+ entries</p>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── Logs History */}
                {weightLogs.length > 0 && (
                    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }} className="member-card overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-member-emerald to-teal-500 absolute top-0 left-0 right-0" />
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={13} className="text-member-emerald" />
                                    <p className="member-micro-text">Measurement Logs</p>
                                </div>
                                <button onClick={() => setShowAllLogs(!showAllLogs)}
                                    className="text-[10px] font-bold text-member-accent flex items-center gap-1">
                                    {showAllLogs ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> All {weightLogs.length}</>}
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {(showAllLogs ? [...weightLogs].reverse() : [...weightLogs].reverse().slice(0, 3)).map((log, i) => {
                                    const hasMeasurements = log.waist || log.chest || log.hip || log.arms || log.thighs;
                                    return (
                                        <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                                            className="bg-member-surface border border-member-border rounded-2xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-member-accent-soft border border-member-accent/20 flex items-center justify-center">
                                                        <Scale className="text-member-accent" size={15} />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-member-primary leading-none">
                                                            {log.weight} <span className="text-xs font-medium text-member-muted">kg</span>
                                                        </p>
                                                        <p className="text-[9px] text-member-muted font-semibold mt-0.5">{log.displayDate}</p>
                                                    </div>
                                                </div>
                                                {i > 0 && (() => {
                                                    const sorted = showAllLogs ? [...weightLogs].reverse() : [...weightLogs].reverse().slice(0, 3);
                                                    const prev = sorted[i - 1];
                                                    if (!prev) return null;
                                                    const delta = parseFloat((log.weight - prev.weight).toFixed(1));
                                                    if (delta === 0) return null;
                                                    return (
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${delta < 0 ? 'bg-member-emerald-soft text-member-emerald border-member-emerald/20' : 'bg-member-rose-soft text-member-rose border-member-rose/20'}`}>
                                                            {delta > 0 ? '+' : ''}{delta} kg
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            {hasMeasurements && (
                                                <div className="grid grid-cols-5 gap-1.5 bg-member-elevated border border-member-border rounded-xl p-2 mt-2 text-center">
                                                    {[
                                                        { label: 'Waist', val: log.waist },
                                                        { label: 'Chest', val: log.chest },
                                                        { label: 'Hips', val: log.hip },
                                                        { label: 'Arms', val: log.arms },
                                                        { label: 'Thighs', val: log.thighs },
                                                    ].map(m => m.val && (
                                                        <div key={m.label}>
                                                            <p className="text-[8px] text-member-muted font-bold">{m.label}</p>
                                                            <p className="text-[10px] font-black text-member-secondary mt-0.5">{m.val}cm</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {log.notes && (
                                                <p className="text-[10px] text-member-secondary italic mt-2 bg-member-elevated border border-member-border p-2 rounded-xl leading-relaxed">
                                                    "{log.notes}"
                                                </p>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Floating Log Button */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowLogModal(true)}
                className="fixed bottom-24 right-4 w-14 h-14 rounded-2xl bg-member-accent text-white shadow-xl shadow-member-accent/30 flex items-center justify-center border border-member-accent/30 z-30"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}>
                <Plus size={22} strokeWidth={2.5} />
            </motion.button>

            {/* ── Badge Unlocked Overlay */}
            <AnimatePresence>
                {unlockedBadges.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-5">
                        <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, y: 30 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="member-card-hero p-7 text-center max-w-xs w-full shadow-2xl">
                            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: 2, duration: 0.4 }}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-member-amber to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Award className="text-[#111118]" size={30} />
                            </motion.div>
                            <p className="text-lg font-black text-member-primary">Badge Unlocked! 🎉</p>
                            <p className="text-xl font-black text-member-accent mt-1.5">
                                {unlockedBadges[0] === 'data_nerd' ? 'Data Nerd 🤓' : unlockedBadges[0] === 'target_reached' ? 'Target Reached 🎯' : 'Achievement!'}
                            </p>
                            <p className="text-[11px] text-member-secondary mt-1.5 leading-relaxed">Check your Trophy Room in the Badges tab.</p>
                            <button onClick={() => setUnlockedBadges([])}
                                className="mt-5 member-btn-primary">
                                AWESOME! 🔥
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Log Modal (slide-up) */}
            <AnimatePresence>
                {showLogModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-end justify-center"
                        onClick={() => setShowLogModal(false)}>
                        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-[#111118] rounded-t-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto border border-member-border"
                            onClick={(e) => e.stopPropagation()}>
                            
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-sm font-black text-member-primary">Log Progress 📊</h3>
                                    <p className="text-[10px] text-member-muted mt-0.5">Record your weight & measurements</p>
                                </div>
                                <button onClick={() => setShowLogModal(false)}
                                    className="w-8 h-8 rounded-xl bg-member-elevated flex items-center justify-center text-member-muted text-sm font-bold active:scale-90 transition-all border border-member-border">
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleLogProgress} className="space-y-4">
                                <div>
                                    <label className="member-micro-text block mb-1.5">
                                        Body Weight (kg) <span className="text-member-rose">*</span>
                                    </label>
                                    <input type="number" step="0.1" required value={logWeight} onChange={e => setLogWeight(e.target.value)}
                                        className="w-full border-2 border-member-border focus:border-member-accent rounded-2xl px-4 py-3.5 text-2xl font-black text-member-primary outline-none text-center bg-member-elevated transition-colors"
                                        placeholder="e.g. 74.5" autoFocus />
                                </div>

                                <button type="button" onClick={() => setShowMeasurements(!showMeasurements)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-member-secondary bg-member-elevated border border-member-border rounded-xl px-4 py-3 hover:border-member-border-strong transition-all">
                                    <span>Body Measurements (optional)</span>
                                    {showMeasurements ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>

                                <AnimatePresence>
                                    {showMeasurements && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="grid grid-cols-2 gap-2.5 pb-1">
                                                {[
                                                    { label: 'Waist (cm)', val: logWaist, set: setLogWaist },
                                                    { label: 'Chest (cm)', val: logChest, set: setLogChest },
                                                    { label: 'Hips (cm)', val: logHip, set: setLogHip },
                                                    { label: 'Arms (cm)', val: logArms, set: setLogArms },
                                                    { label: 'Thighs (cm)', val: logThighs, set: setLogThighs },
                                                ].map(f => (
                                                    <div key={f.label}>
                                                        <label className="text-[9px] text-member-muted font-bold uppercase block mb-1">{f.label}</label>
                                                        <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="—"
                                                            className="w-full border border-member-border rounded-xl px-3 py-2 text-sm font-bold text-member-primary outline-none bg-member-elevated focus:border-member-accent text-center" />
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div>
                                    <label className="member-micro-text block mb-1.5">Notes</label>
                                    <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} rows="2"
                                        placeholder="How do you feel today? Started creatine? Bad week?"
                                        className="w-full border border-member-border rounded-2xl px-4 py-3 text-xs text-member-secondary outline-none bg-member-elevated focus:border-member-accent resize-none transition-colors" />
                                </div>

                                <button type="submit" disabled={isSaving || !logWeight}
                                    className="member-btn-primary flex items-center justify-center gap-2">
                                    <Save size={15} /> {isSaving ? 'Logging...' : 'Log My Progress'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberProgress;
