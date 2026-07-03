import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Dumbbell, Droplets, RotateCcw, Play, Pause, AlertCircle, Plus, 
    Award, Zap, Clock, Save, Trash2, ChevronDown, ChevronUp,
    Activity, Heart, Flame, Target, Scale, BarChart3, Apple, CheckCircle
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import toast from 'react-hot-toast';

// ─── Premium tab config ─────────────────────────────────────────────────────
const TABS = [
    { id: 'calculators', label: 'BMI & Calories', icon: Heart },
    { id: '1rm', label: '1RM & PRs', icon: Dumbbell },
    { id: 'timer', label: 'Timer', icon: Clock },
];

const EXERCISES = [
    { value: 'bench_press', label: 'Bench Press' },
    { value: 'squat', label: 'Barbell Squat' },
    { value: 'deadlift', label: 'Deadlift' },
    { value: 'overhead_press', label: 'Overhead Press' },
    { value: 'barbell_row', label: 'Barbell Row' },
    { value: 'bicep_curl', label: 'Bicep Curl' },
    { value: 'lat_pulldown', label: 'Lat Pulldown' },
    { value: 'leg_press', label: 'Leg Press' },
    { value: 'other', label: 'Other Lift' },
];

const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
};

const MemberHealth = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('calculators');

    // ── Profile Fetch ─────────────────────────────────────────────────────────
    const fetchProfile = async () => {
        try {
            const res = await api.get('/api/member/profile');
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to load profile details', err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchProfile(); }, []);

    // ── 1. BMI & TDEE State ───────────────────────────────────────────────────
    const [calcGender, setCalcGender] = useState('male');
    const [calcAge, setCalcAge] = useState(25);
    const [calcWeight, setCalcWeight] = useState(70);
    const [calcHeight, setCalcHeight] = useState(175);
    const [calcActivity, setCalcActivity] = useState('moderately_active');
    const [isSavingGoals, setIsSavingGoals] = useState(false);
    const [saveGoalsSuccess, setSaveGoalsSuccess] = useState(false);
    const [showMacros, setShowMacros] = useState(false);

    useEffect(() => {
        if (profile) {
            if (profile.gender) setCalcGender(profile.gender);
            if (profile.age) setCalcAge(profile.age);
            if (profile.weight) setCalcWeight(profile.weight);
            if (profile.height) setCalcHeight(profile.height);
            if (profile.activityLevel) setCalcActivity(profile.activityLevel);
        }
    }, [profile]);

    // BMI
    const hm = calcHeight / 100;
    const bmi = hm > 0 ? parseFloat((calcWeight / (hm * hm)).toFixed(1)) : 0;
    const idealMin = Math.round(18.5 * hm * hm);
    const idealMax = Math.round(24.9 * hm * hm);

    let bmiCategory = 'Healthy'; let bmiColor = '#10B981'; let bmiGradient = 'from-emerald-500 to-teal-500';
    let bmiZone = 50; let bmiBg = 'bg-emerald-500'; let bmiText = 'text-emerald-600';
    if (bmi < 18.5) {
        bmiCategory = 'Underweight'; bmiColor = '#38BDF8';
        bmiGradient = 'from-sky-400 to-blue-500'; bmiBg = 'bg-sky-500'; bmiText = 'text-sky-600';
        bmiZone = Math.max(5, Math.min(28, ((bmi - 12) / 6.5) * 28));
    } else if (bmi < 25) {
        bmiCategory = 'Healthy Weight'; bmiColor = '#10B981';
        bmiGradient = 'from-emerald-400 to-teal-500'; bmiZone = 28 + ((bmi - 18.5) / 6.5) * 30;
    } else if (bmi < 30) {
        bmiCategory = 'Overweight'; bmiColor = '#F59E0B';
        bmiGradient = 'from-amber-400 to-orange-500'; bmiBg = 'bg-amber-500'; bmiText = 'text-amber-600';
        bmiZone = 58 + ((bmi - 25) / 5) * 22;
    } else {
        bmiCategory = 'Obese'; bmiColor = '#EF4444';
        bmiGradient = 'from-rose-500 to-red-600'; bmiBg = 'bg-rose-500'; bmiText = 'text-rose-600';
        bmiZone = Math.min(96, 80 + ((bmi - 30) / 10) * 16);
    }

    // TDEE (Mifflin-St Jeor)
    const bmr = calcGender === 'male'
        ? (10 * calcWeight) + (6.25 * calcHeight) - (5 * calcAge) + 5
        : (10 * calcWeight) + (6.25 * calcHeight) - (5 * calcAge) - 161;
    const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[calcActivity] || 1.2));
    const fatLoss = tdee - 500;
    const muscleGain = tdee + 250;

    // Macro splits by goal
    const macrosByGoal = {
        lose_weight: { protein: 0.35, carbs: 0.40, fat: 0.25 },
        gain_muscle:  { protein: 0.30, carbs: 0.45, fat: 0.25 },
        maintain:     { protein: 0.25, carbs: 0.50, fat: 0.25 },
    };
    const selectedGoal = profile?.fitnessGoal || 'maintain';
    const macros = macrosByGoal[selectedGoal] || macrosByGoal.maintain;
    const calsForMacro = profile?.fitnessGoal === 'lose_weight' ? fatLoss : profile?.fitnessGoal === 'gain_muscle' ? muscleGain : tdee;
    const proteinG = Math.round(calsForMacro * macros.protein / 4);
    const carbsG = Math.round(calsForMacro * macros.carbs / 4);
    const fatG = Math.round(calsForMacro * macros.fat / 9);

    const saveTDEEChoices = async (goal) => {
        setIsSavingGoals(true);
        try {
            await api.put('/api/member/fitness-goals', {
                fitnessGoal: goal,
                activityLevel: calcActivity,
                goalWeight: goal === 'lose_weight' ? Math.round(calcWeight * 0.9) : goal === 'gain_muscle' ? Math.round(calcWeight * 1.1) : calcWeight
            });
            setSaveGoalsSuccess(true);
            setTimeout(() => setSaveGoalsSuccess(false), 2500);
            fetchProfile();
        } catch (e) { console.error(e); }
        finally { setIsSavingGoals(false); }
    };

    // ── 2. Water Tracker ───────────────────────────────────────────────────────
    const [waterIntake, setWaterIntake] = useState(0);
    const [showWaterCelebration, setShowWaterCelebration] = useState(false);

    // Auto-calculate from profile weight + activity
    const waterGoal = (() => {
        const base = calcWeight * 33;
        const bonus = ['very_active', 'extremely_active'].includes(calcActivity) ? 500 : 0;
        return Math.round((base + bonus) / 100) * 100; // round to nearest 100ml
    })();
    const glasses = Math.ceil(waterGoal / 250);
    const waterPct = Math.min(100, Math.round((waterIntake / waterGoal) * 100));

    useEffect(() => {
        const key = `water_${new Date().toISOString().split('T')[0]}`;
        const saved = localStorage.getItem(key);
        if (saved) setWaterIntake(Number(saved));
    }, []);

    const addWater = async (ml) => {
        const key = `water_${new Date().toISOString().split('T')[0]}`;
        const prev = waterIntake;
        const next = Math.max(0, prev + ml);
        setWaterIntake(next);
        localStorage.setItem(key, next);
        if (next >= waterGoal && prev < waterGoal) {
            setShowWaterCelebration(true);
            try { await api.post('/api/member/badges/water-warrior'); } catch {}
            setTimeout(() => setShowWaterCelebration(false), 3500);
        }
    };

    // ── 3. 1RM Calculator ─────────────────────────────────────────────────────
    const [rmWeight, setRmWeight] = useState(60);
    const [rmReps, setRmReps] = useState(5);
    const [rmExercise, setRmExercise] = useState('bench_press');
    const [prHistory, setPrHistory] = useState([]);
    const [isSavingPR, setIsSavingPR] = useState(false);
    const [prSuccess, setPrSuccess] = useState(false);

    const oneRM = rmReps === 1 ? rmWeight
        : Math.round((rmWeight * (1 + rmReps / 30) + rmWeight / (1.0278 - 0.0278 * rmReps)) / 2);

    const fetchPRs = async () => {
        try { const r = await api.get('/api/member/prs'); setPrHistory(r.data || []); }
        catch {}
    };
    useEffect(() => { fetchPRs(); }, []);

    const handleSavePR = async () => {
        setIsSavingPR(true);
        try {
            const label = EXERCISES.find(e => e.value === rmExercise)?.label || rmExercise;
            await api.post('/api/member/prs', { exercise: label, oneRM });
            setPrSuccess(true);
            setTimeout(() => setPrSuccess(false), 2500);
            fetchPRs();
        } catch {}
        finally { setIsSavingPR(false); }
    };

    const ZONES = [
        { pct: 90, label: 'Strength', desc: '1-3 reps', color: 'bg-rose-500' },
        { pct: 80, label: 'Power', desc: '3-5 reps', color: 'bg-orange-500' },
        { pct: 70, label: 'Hypertrophy', desc: '8-12 reps', color: 'bg-amber-500' },
        { pct: 60, label: 'Endurance', desc: '15+ reps', color: 'bg-emerald-500' },
    ];

    // ── 4. Workout Timer ──────────────────────────────────────────────────────
    const [timerMode, setTimerMode] = useState('presets');
    const [timerRunning, setTimerRunning] = useState(false);
    const [swTime, setSwTime] = useState(0);
    const [swLaps, setSwLaps] = useState([]);
    const swRef = useRef(null);
    const [cdTime, setCdTime] = useState(60);
    const [cdInitial, setCdInitial] = useState(60);
    const cdRef = useRef(null);
    const [hiitWork, setHiitWork] = useState(40);
    const [hiitRest, setHiitRest] = useState(20);
    const [hiitRounds, setHiitRounds] = useState(8);
    const [currentRound, setCurrentRound] = useState(1);
    const [hiitPhase, setHiitPhase] = useState('work');
    const [hiitTimeLeft, setHiitTimeLeft] = useState(40);
    const hiitRef = useRef(null);
    const [wakeLock, setWakeLock] = useState(null);
    const [hiitDone, setHiitDone] = useState(false);

    // ── 5. Stretch Timer ──────────────────────────────────────────────────────
    const STRETCH_DURATION = 300; // 5 minutes in seconds
    const STRETCH_CUES = [
        { emoji: '🙆', text: 'Raise both arms overhead — hold & breathe' },
        { emoji: '🤸', text: 'Side bend left — feel the stretch' },
        { emoji: '🤸', text: 'Side bend right — slow and steady' },
        { emoji: '🧎', text: 'Quad stretch — hold your ankle behind you' },
        { emoji: '🧘', text: 'Forward fold — reach for your toes' },
        { emoji: '💪', text: 'Cross-body arm stretch — loosen shoulders' },
        { emoji: '🦵', text: 'Hip flexor lunge — open your hips' },
        { emoji: '🌀', text: 'Neck rolls — slow circles, both directions' },
    ];
    const [stretchTime, setStretchTime] = useState(STRETCH_DURATION);
    const [stretchRunning, setStretchRunning] = useState(false);
    const [stretchDone, setStretchDone] = useState(false);
    const [stretchXPClaimed, setStretchXPClaimed] = useState(false);
    const [stretchCueIdx, setStretchCueIdx] = useState(0);
    const stretchRef = useRef(null);
    const stretchCueRef = useRef(null);

    const startStretch = () => {
        if (stretchDone) return;
        if (stretchRunning) {
            // Pause
            clearInterval(stretchRef.current);
            clearInterval(stretchCueRef.current);
            releaseWakeLock();
            setStretchRunning(false);
        } else {
            // Start / Resume
            requestWakeLock();
            stretchRef.current = setInterval(() => {
                setStretchTime(prev => {
                    if (prev <= 1) {
                        clearInterval(stretchRef.current);
                        clearInterval(stretchCueRef.current);
                        releaseWakeLock();
                        setStretchRunning(false);
                        setStretchDone(true);
                        beep(true);
                        return 0;
                    }
                    if (prev <= 4) beep(false);
                    return prev - 1;
                });
            }, 1000);
            // Rotate stretch cue every 37s (300 / 8 ≈ 37.5)
            stretchCueRef.current = setInterval(() => {
                setStretchCueIdx(i => (i + 1) % STRETCH_CUES.length);
            }, 37000);
            setStretchRunning(true);
        }
    };

    const resetStretch = () => {
        clearInterval(stretchRef.current);
        clearInterval(stretchCueRef.current);
        setStretchTime(STRETCH_DURATION);
        setStretchRunning(false);
        setStretchDone(false);
        setStretchXPClaimed(false);
        setStretchCueIdx(0);
        releaseWakeLock();
    };

    // Called once when timer completes — claim stretch mission XP
    const claimStretchXP = async () => {
        if (stretchXPClaimed) return;
        setStretchXPClaimed(true);
        try {
            const res = await api.post('/api/v1/leaderboard/missions/complete-task', { taskType: 'stretch' });
            if (res.data.success) {
                if (res.data.xpAwarded > 0) {
                    toast.success(`🧘 Stretch complete! +${res.data.xpAwarded} XP earned!`, { duration: 4000 });
                } else {
                    toast('🧘 Stretch logged! Already earned XP today.', { icon: '✅', duration: 3000 });
                }
            }
        } catch {
            toast.error('Could not log stretch XP. Try again.');
            setStretchXPClaimed(false);
        }
    };

    // Auto-claim XP when done flag flips
    useEffect(() => {
        if (stretchDone && !stretchXPClaimed) {
            claimStretchXP();
        }
    }, [stretchDone]);

    // Cleanup stretch on unmount
    useEffect(() => () => {
        clearInterval(stretchRef.current);
        clearInterval(stretchCueRef.current);
    }, []);

    useEffect(() => () => {
        clearInterval(swRef.current); clearInterval(cdRef.current); clearInterval(hiitRef.current);
        if (wakeLock) wakeLock.release().catch(() => {});
    }, []);

    const beep = (hi = false) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.setValueAtTime(hi ? 940 : 520, ctx.currentTime);
            gain.gain.setValueAtTime(0.10, ctx.currentTime);
            osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
            osc.stop(ctx.currentTime + 0.28);
        } catch {}
    };

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try { const lock = await navigator.wakeLock.request('screen'); setWakeLock(lock); } catch {}
        }
    };
    const releaseWakeLock = () => { if (wakeLock) { wakeLock.release().then(() => setWakeLock(null)).catch(() => {}); } };

    // Stopwatch
    const startSW = () => {
        if (timerRunning) { clearInterval(swRef.current); releaseWakeLock(); }
        else { requestWakeLock(); const t0 = Date.now() - swTime; swRef.current = setInterval(() => setSwTime(Date.now() - t0), 10); }
        setTimerRunning(!timerRunning);
    };
    const resetSW = () => { clearInterval(swRef.current); setSwTime(0); setSwLaps([]); setTimerRunning(false); releaseWakeLock(); };

    // Preset countdown
    const startCD = () => {
        if (timerRunning) { clearInterval(cdRef.current); releaseWakeLock(); }
        else {
            requestWakeLock();
            cdRef.current = setInterval(() => {
                setCdTime(p => {
                    if (p <= 1) { clearInterval(cdRef.current); setTimerRunning(false); beep(true); releaseWakeLock(); return 0; }
                    if (p <= 4) beep(false);
                    return p - 1;
                });
            }, 1000);
        }
        setTimerRunning(!timerRunning);
    };
    const resetCD = (s) => { clearInterval(cdRef.current); setCdTime(s || cdInitial); if (s) setCdInitial(s); setTimerRunning(false); releaseWakeLock(); };

    // HIIT
    const startHIIT = () => {
        if (timerRunning) { clearInterval(hiitRef.current); releaseWakeLock(); }
        else {
            setHiitDone(false);
            requestWakeLock();
            hiitRef.current = setInterval(() => {
                setHiitTimeLeft(p => {
                    if (p <= 1) {
                        beep(true);
                        if (hiitPhase === 'work') { setHiitPhase('rest'); return hiitRest; }
                        else {
                            if (currentRound >= hiitRounds) {
                                clearInterval(hiitRef.current); setTimerRunning(false); releaseWakeLock();
                                setHiitDone(true); return 0;
                            }
                            setCurrentRound(c => c + 1); setHiitPhase('work'); return hiitWork;
                        }
                    }
                    if (p <= 4) beep(false);
                    return p - 1;
                });
            }, 1000);
        }
        setTimerRunning(!timerRunning);
    };

    const resetHIIT = () => {
        clearInterval(hiitRef.current);
        setHiitTimeLeft(hiitWork);
        setHiitPhase('work');
        setCurrentRound(1);
        setTimerRunning(false);
        setHiitDone(false);
        releaseWakeLock();
    };

    const stopTimers = () => {
        clearInterval(swRef.current);
        clearInterval(cdRef.current);
        clearInterval(hiitRef.current);
        setTimerRunning(false);
        releaseWakeLock();
    };

    const fmtS = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };
    const fmtSW = (ms) => {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        const centi = Math.floor((ms % 1000) / 10);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${centi.toString().padStart(2, '0')}`;
    };

    return (
        <div className="pb-28">
            {/* ── Hero Header ───────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-[#0a0a0f] to-[#111118] border-b border-member-border px-5 pt-5 pb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-member-accent/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-member-accent/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-member-accent-soft border border-member-accent/20 flex items-center justify-center">
                            <Activity className="text-member-accent" size={16} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-member-primary tracking-tight font-syne">Health Hub</h1>
                            <p className="text-[10px] text-member-secondary font-medium font-syne">Calculators · Hydration · PRs · Timer</p>
                        </div>
                    </div>
                    {profile?.weight && profile?.height && (
                        <div className="mt-3 grid grid-cols-3 gap-2 relative z-10">
                            {[
                                { label: 'BMI', value: bmi, unit: '', color: 'text-member-emerald', border: 'border-member-emerald/30' },
                                { label: 'Weight', value: `${profile.weight}`, unit: 'kg', color: 'text-member-sky', border: 'border-member-sky/30' },
                                { label: 'TDEE', value: tdee.toLocaleString(), unit: 'kcal', color: 'text-member-amber', border: 'border-member-amber/30' },
                            ].map((s, i) => (
                                <div key={i} className={`bg-member-surface border ${s.border} rounded-xl p-2.5 text-center`}>
                                    <p className={`font-syne text-[9px] ${s.color} font-semibold uppercase tracking-wider`}>{s.label}</p>
                                    <p className="font-syne text-base font-black text-member-primary leading-none mt-1">{s.value}<span className="text-[9px] font-normal text-member-secondary ml-0.5">{s.unit}</span></p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sticky Tab Navigation ─────────────────────────────────── */}
            <div className="sticky top-[61px] z-20 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-member-border px-4 py-2.5">
                <div className="max-w-lg mx-auto w-full flex items-center justify-between gap-2">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { stopTimers(); setActiveTab(tab.id); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-member-accent-soft border border-member-accent text-member-primary shadow-sm shadow-member-accent/10' 
                                        : 'bg-transparent border border-transparent text-member-secondary hover:text-member-primary hover:bg-member-surface'
                                }`}
                            >
                                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-member-accent' : ''} />
                                <span className={`text-[11px] font-bold font-syne ${isActive ? 'text-member-primary' : ''}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Tab Content ───────────────────────────────────────────── */}
            <div className="px-4 pt-5">
                <AnimatePresence mode="wait">

                    {/* ── BMI & TDEE ───────────────────────────────────────── */}
                    {activeTab === 'calculators' && (
                        <motion.div key="calc" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }} className="space-y-5">

                            {/* BMI Card */}
                            <div className="member-card overflow-hidden">
                                {/* Top accent bar */}
                                <div className={`h-1.5 w-full bg-gradient-to-r ${bmiGradient} absolute top-0 left-0 right-0`} />
                                <div className="pt-2">
                                    <div className="flex items-start justify-between mb-5">
                                        <div>
                                            <p className="member-micro-text">Body Mass Index</p>
                                            <div className="flex items-end gap-2 mt-1">
                                                <p className="font-syne text-5xl font-black text-member-primary leading-none">{bmi}</p>
                                                <div className="mb-1.5">
                                                    <span className={`member-badge-pill border-[1px] ${
                                                        bmiCategory === 'Healthy Weight' ? 'bg-member-emerald-soft text-member-emerald border-member-emerald/25'
                                                        : bmiCategory === 'Overweight' ? 'bg-member-amber-soft text-member-amber border-member-amber/25'
                                                        : bmiCategory === 'Obese' ? 'bg-member-rose-soft text-member-rose border-member-rose/25'
                                                        : 'bg-member-sky-soft text-member-sky border-member-sky/25'
                                                    }`}>{bmiCategory}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-member-surface border border-member-border rounded-2xl p-3 text-right">
                                            <p className="font-syne text-[9px] text-member-muted font-bold uppercase">Ideal Range</p>
                                            <p className="font-syne text-sm font-black text-member-primary mt-0.5">{idealMin}–{idealMax} kg</p>
                                            <p className="font-dmsans text-[9px] text-member-muted mt-0.5">for {calcHeight}cm height</p>
                                        </div>
                                    </div>

                                    {/* BMI Meter Bar */}
                                    <div className="relative h-3 rounded-full overflow-hidden mb-2 bg-member-surface">
                                        <div className="absolute inset-y-0 left-0 w-[28%] bg-member-sky-soft/75 rounded-l-full" />
                                        <div className="absolute inset-y-0 left-[28%] w-[32%] bg-member-emerald-soft/75" />
                                        <div className="absolute inset-y-0 left-[60%] w-[20%] bg-member-amber-soft/75" />
                                        <div className="absolute inset-y-0 left-[80%] w-[20%] bg-member-rose-soft/75 rounded-r-full" />
                                        <motion.div
                                            animate={{ left: `calc(${bmiZone}% - 7px)` }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-[3px] shadow-md z-10"
                                            style={{ borderColor: bmiColor }}
                                        />
                                    </div>
                                    <div className="flex justify-between font-syne text-[8px] text-member-muted font-bold uppercase tracking-wider px-0.5">
                                        <span>Under</span><span>Healthy (18.5–24.9)</span><span>Over</span><span>Obese</span>
                                    </div>

                                    {/* Sliders */}
                                    <div className="mt-5 space-y-4 bg-member-surface rounded-2xl p-4 border border-member-border">
                                        <div>
                                            <div className="flex justify-between font-dmsans text-[11px] font-bold text-member-secondary mb-1.5">
                                                <span>Age: <span className="text-member-accent">{calcAge} yrs</span></span>
                                                <span>Height: <span className="text-member-accent">{calcHeight} cm</span></span>
                                            </div>
                                            <input type="range" min="15" max="80" value={calcAge} onChange={e => setCalcAge(+e.target.value)} className="w-full accent-member-accent h-1.5 appearance-none bg-member-elevated rounded-full mb-2" />
                                            <input type="range" min="120" max="230" value={calcHeight} onChange={e => setCalcHeight(+e.target.value)} className="w-full accent-member-accent h-1.5 appearance-none bg-member-elevated rounded-full" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between font-dmsans text-[11px] font-bold text-member-secondary mb-1.5">
                                                <span>Weight: <span className="text-member-accent">{calcWeight} kg</span></span>
                                            </div>
                                            <input type="range" min="30" max="200" value={calcWeight} onChange={e => setCalcWeight(+e.target.value)} className="w-full accent-member-accent h-1.5 appearance-none bg-member-elevated rounded-full" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['male', 'female'].map(g => (
                                                <button key={g} onClick={() => setCalcGender(g)}
                                                    className={`py-2 rounded-xl text-xs font-bold font-syne border transition-all ${calcGender === g ? 'bg-member-accent text-white border-transparent shadow-sm shadow-member-accent/20' : 'bg-member-surface text-member-secondary border-member-border'}`}>
                                                    {g === 'male' ? '♂ Male' : '♀ Female'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TDEE Card */}
                            <div className="member-card overflow-hidden">
                                <div className="h-1.5 w-full bg-gradient-to-r from-member-amber to-orange-500 absolute top-0 left-0 right-0" />
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-member-amber-soft border border-member-amber/20 flex items-center justify-center">
                                            <Flame className="text-member-amber" size={16} />
                                        </div>
                                        <div>
                                            <p className="font-syne text-xs font-black text-member-primary">Daily Calorie Needs (TDEE)</p>
                                            <p className="font-dmsans text-[10px] text-member-secondary">Base metabolic rate × activity factor</p>
                                        </div>
                                    </div>

                                    {/* BMR Callout */}
                                    <div className="bg-member-surface border border-member-border rounded-2xl p-3.5 text-center mb-4 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-member-accent/5 to-purple-600/5" />
                                        <p className="font-syne text-[10px] text-member-muted uppercase tracking-widest font-semibold relative z-10">Your Resting Burn Rate (BMR)</p>
                                        <p className="font-syne text-3xl font-black text-member-primary relative z-10 leading-none mt-1">{Math.round(bmr).toLocaleString()} <span className="text-sm font-medium text-member-secondary">kcal</span></p>
                                        <p className="font-dmsans text-[9px] text-member-muted mt-1 relative z-10">Your body burns this doing absolutely nothing</p>
                                    </div>

                                    {/* Activity selector */}
                                    <div className="mb-4">
                                        <label className="member-micro-text mb-2.5 block">Select your activity level</label>
                                        <div className="relative">
                                            <select
                                                value={calcActivity}
                                                onChange={(e) => setCalcActivity(e.target.value)}
                                                className="w-full bg-member-surface border border-member-border rounded-xl px-4 py-3 text-xs font-semibold text-member-primary outline-none focus:border-member-accent appearance-none shadow-sm"
                                            >
                                                <option value="sedentary">🛋️ Sedentary (Office job, little/no exercise)</option>
                                                <option value="lightly_active">🚶 Lightly Active (1–3 days/week)</option>
                                                <option value="moderately_active">🏃 Moderately Active (3–5 days/week)</option>
                                                <option value="very_active">💪 Very Active (6–7 days/week)</option>
                                                <option value="extremely_active">🔥 Extremely Active (Physical job/2x daily)</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-member-secondary pointer-events-none" size={16} />
                                        </div>
                                    </div>

                                    {/* 3 Calorie Goals */}
                                    <div className="space-y-2.5">
                                        {[
                                            { id: 'maintain', label: 'Maintain Weight', cal: tdee, emoji: '⚖', grad: 'from-member-accent to-indigo-600', light: 'bg-member-accent-soft border-member-accent/20', textAccent: 'text-member-accent' },
                                            { id: 'lose_weight', label: 'Fat Loss (−500 kcal)', cal: fatLoss, emoji: '📉', grad: 'from-member-emerald to-teal-600', light: 'bg-member-emerald-soft border-member-emerald/20', textAccent: 'text-member-emerald' },
                                            { id: 'gain_muscle', label: 'Muscle Gain (+250 kcal)', cal: muscleGain, emoji: '📈', grad: 'from-member-amber to-orange-500', light: 'bg-member-amber-soft border-member-amber/20', textAccent: 'text-member-amber' },
                                        ].map(g => {
                                            const isSelected = profile?.fitnessGoal === g.id;
                                            return (
                                                <div key={g.id} className={`rounded-2xl border p-3 flex items-center justify-between transition-all ${isSelected ? `${g.light} shadow-sm` : 'bg-member-surface border-member-border'}`}>
                                                    <div>
                                                        <p className="text-xs font-bold text-member-primary font-syne">{g.emoji} {g.label}</p>
                                                        {isSelected && <span className="member-badge-pill border-[1px] bg-member-emerald-soft text-member-emerald border-member-emerald/25 mt-1 inline-block">Your goal</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-2.5 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r ${g.grad} shadow-sm font-syne`}>
                                                            {g.cal.toLocaleString()} kcal
                                                        </div>
                                                        <button onClick={() => saveTDEEChoices(g.id)} disabled={isSavingGoals}
                                                            className="w-8 h-8 rounded-xl bg-member-surface hover:bg-member-elevated border border-member-border flex items-center justify-center text-member-secondary hover:text-member-accent active:scale-90 transition-all shadow-sm">
                                                            <Save size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {saveGoalsSuccess && (
                                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 text-center text-xs text-member-emerald font-bold bg-member-emerald-soft border border-member-emerald/20 rounded-xl py-2">
                                            ✓ Goal synced with your profile!
                                        </motion.div>
                                    )}

                                    {/* Macro Split Preview */}
                                    <div className="mt-5 border-t border-member-border pt-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold font-syne text-member-primary mb-3">
                                            <BarChart3 size={13} className="text-member-accent" />
                                            Macro Split Preview
                                        </div>
                                        <div className="space-y-3">
                                            <p className="font-syne text-[9px] text-member-muted font-bold uppercase">Based on your selected goal ({selectedGoal.replace('_', ' ')})</p>
                                            {[
                                                { label: 'Protein', g: proteinG, pct: Math.round(macros.protein * 100), color: 'bg-member-accent', light: 'text-member-accent', emoji: '🥩' },
                                                { label: 'Carbohydrates', g: carbsG, pct: Math.round(macros.carbs * 100), color: 'bg-member-amber', light: 'text-member-amber', emoji: '🌾' },
                                                { label: 'Fats', g: fatG, pct: Math.round(macros.fat * 100), color: 'bg-member-rose', light: 'text-member-rose', emoji: '🥑' },
                                            ].map((m, i) => (
                                                <div key={i}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[11px] font-semibold text-member-primary font-dmsans">{m.emoji} {m.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-member-muted font-syne">{m.pct}%</span>
                                                            <span className="text-xs font-black text-member-primary font-syne">{m.g}g</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-member-surface rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                                                            className={`h-full ${m.color} rounded-full`} />
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="font-dmsans text-[9px] text-member-muted text-center pt-1">
                                                Calories: {calsForMacro.toLocaleString()} kcal/day — {proteinG * 4 + carbsG * 4 + fatG * 9} kcal from macros
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}



                    {/* ── 1RM TAB ───────────────────────────────────────────── */}
                    {activeTab === '1rm' && (
                        <motion.div key="1rm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }} className="space-y-5">
                            <div className="member-card overflow-hidden">
                                <div className="h-1.5 bg-gradient-to-r from-member-rose to-member-amber absolute top-0 left-0 right-0" />
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-8 h-8 rounded-xl bg-member-rose-soft border border-member-rose/25 flex items-center justify-center">
                                            <Dumbbell className="text-member-rose" size={16} />
                                        </div>
                                        <div>
                                            <p className="font-syne text-xs font-black text-member-primary">1RM Calculator</p>
                                            <p className="font-dmsans text-[10px] text-member-secondary">Epley + Brzycki average method</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="member-micro-text block mb-1.5">Exercise</label>
                                            <select value={rmExercise} onChange={e => setRmExercise(e.target.value)}
                                                className="w-full bg-member-surface border border-member-border rounded-xl px-3 py-2.5 text-xs font-semibold text-member-primary outline-none focus:border-member-accent">
                                                {EXERCISES.map(ex => <option key={ex.value} value={ex.value} className="bg-member-surface text-member-primary">{ex.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="member-micro-text block mb-1.5">Weight Lifted (kg)</label>
                                            <input type="number" value={rmWeight} onChange={e => setRmWeight(Math.max(1, +e.target.value))}
                                                className="w-full border border-member-border rounded-xl px-3 py-2 text-sm font-bold text-member-primary outline-none focus:border-member-accent bg-member-surface" />
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex justify-between font-syne text-[11px] font-bold text-member-secondary mb-2">
                                            <span>Reps Completed</span>
                                            <span className="text-member-rose font-bold">{rmReps} reps</span>
                                        </div>
                                        <input type="range" min="1" max="20" value={rmReps} onChange={e => setRmReps(+e.target.value)}
                                            className="w-full accent-member-rose h-1.5 appearance-none bg-member-surface rounded-full" />
                                        <div className="flex justify-between font-syne text-[8px] text-member-muted mt-1 px-0.5 font-semibold">
                                            {Array.from({ length: 20 }).map((_, i) => (
                                                <span key={i} style={{ opacity: (i === 0 || (i + 1) % 5 === 0) ? 1 : 0.3 }}>
                                                    {i + 1}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 1RM Result */}
                                    <div className="bg-member-surface border border-member-border rounded-2xl p-5 text-center mb-5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-member-rose-soft to-transparent pointer-events-none" />
                                        <p className="font-syne text-[10px] text-member-rose uppercase tracking-widest font-semibold relative z-10">Estimated 1RM</p>
                                        <motion.p key={oneRM} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                                            className="font-syne text-5xl font-black text-member-primary leading-none mt-1.5 relative z-10">{oneRM} <span className="text-lg font-medium text-member-secondary font-dmsans">kg</span></motion.p>
                                        <button onClick={handleSavePR} disabled={isSavingPR}
                                            className="mt-4 px-5 py-2.5 rounded-xl bg-member-accent text-white font-syne font-bold text-xs hover:opacity-90 flex items-center gap-1.5 mx-auto active:scale-95 transition-all shadow-sm relative z-10"
                                        >
                                            <Save size={13} /> Save Personal Record
                                        </button>
                                        {prSuccess && (
                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-member-emerald text-xs font-bold mt-2 relative z-10 font-syne">🏆 PR Saved!</motion.p>
                                        )}
                                    </div>

                                    {/* Training Zones */}
                                    <h4 className="member-micro-text mb-3">Training Zones</h4>
                                    <div className="space-y-2">
                                        {ZONES.map(z => (
                                            <div key={z.pct} className="flex items-center gap-3 bg-member-surface border border-member-border rounded-xl px-3.5 py-2.5">
                                                <div className={`w-1.5 h-8 rounded-full ${z.color} flex-shrink-0`} />
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-member-primary font-syne">{z.label}</p>
                                                    <p className="font-dmsans text-[9px] text-member-secondary font-medium">{z.desc}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-member-accent font-syne">{Math.round(oneRM * z.pct / 100)} kg</p>
                                                    <p className="font-dmsans text-[9px] text-member-muted">{z.pct}% of 1RM</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* PR History */}
                            {prHistory.length > 0 && (
                                <div className="member-card">
                                    <h3 className="member-micro-text mb-4 flex items-center gap-1.5">
                                        <Award className="text-member-amber" size={13} /> Personal Records History
                                    </h3>
                                    <div className="space-y-2">
                                        {prHistory.slice(-5).reverse().map((pr, i) => (
                                            <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                                                className="flex items-center justify-between bg-member-surface border border-member-border rounded-2xl px-4 py-3">
                                                <div>
                                                    <p className="text-xs font-bold font-syne text-member-primary">{pr.exercise}</p>
                                                    <p className="font-dmsans text-[9px] text-member-muted mt-0.5">{new Date(pr.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-base font-black text-member-amber font-syne">{pr.oneRM}</span>
                                                    <span className="text-[10px] text-member-muted font-dmsans">kg 🏆</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── TIMER TAB ─────────────────────────────────────────── */}
                    {activeTab === 'timer' && (
                        <motion.div key="timer" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
                            <div className="member-card overflow-hidden">
                                <div className="h-1.5 bg-gradient-to-r from-member-accent to-purple-600 absolute top-0 left-0 right-0" />
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-8 h-8 rounded-xl bg-member-accent-soft border border-member-accent/20 flex items-center justify-center">
                                            <Clock className="text-member-accent" size={16} />
                                        </div>
                                        <div>
                                            <p className="font-syne text-xs font-black text-member-primary">Workout Timer</p>
                                            <p className="font-dmsans text-[10px] text-member-secondary">Rest · HIIT · Stopwatch</p>
                                        </div>
                                        {wakeLock && <span className="ml-auto text-[9px] bg-member-emerald-soft border border-member-emerald/20 text-member-emerald font-bold px-2 py-0.5 rounded-full font-syne">Screen Active</span>}
                                    </div>



                                    {/* Mode selector — 4 tabs */}
                                    <div className="grid grid-cols-4 gap-1.5 bg-member-surface p-1.5 rounded-2xl mb-6 border border-member-border">
                                        {[
                                            { id: 'presets',   label: '⏱ Rest' },
                                            { id: 'hiit',      label: '🔥 HIIT' },
                                            { id: 'stopwatch', label: '⏱ Watch' },
                                            { id: 'stretch',   label: '🧘 Stretch' },
                                        ].map(m => (
                                            <button key={m.id}
                                                onClick={() => { stopTimers(); resetStretch(); setTimerMode(m.id); }}
                                                className={`py-2.5 rounded-xl text-[11px] font-black font-syne transition-all ${
                                                    timerMode === m.id
                                                        ? m.id === 'stretch'
                                                            ? 'bg-[#0d2b1f] text-emerald-400 shadow-sm border border-emerald-500/60'
                                                            : 'bg-[#1e1e28] text-member-accent shadow-sm border border-member-accent'
                                                        : 'text-member-secondary border border-transparent'
                                                }`}>
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* REST COUNTDOWN */}
                                    {timerMode === 'presets' && (
                                        <div className="space-y-5">
                                            {/* Ring clock */}
                                            <div className="flex justify-center">
                                                <div className="relative w-44 h-44">
                                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 176 176">
                                                        <circle cx="88" cy="88" r="76" stroke="rgba(255,255,255,0.04)" strokeWidth="10" fill="transparent" />
                                                        <motion.circle cx="88" cy="88" r="76"
                                                            stroke="url(#timerGrad)" strokeWidth="10" fill="transparent"
                                                            strokeDasharray={2 * Math.PI * 76}
                                                            animate={{ strokeDashoffset: 2 * Math.PI * 76 * (1 - cdTime / cdInitial) }}
                                                            transition={{ duration: 0.3 }}
                                                            strokeLinecap="round"
                                                        />
                                                        <defs>
                                                            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#6c5ce7" /><stop offset="100%" stopColor="#a855f7" />
                                                            </linearGradient>
                                                        </defs>
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <p className="text-4xl font-black text-member-primary font-mono">{fmtS(cdTime)}</p>
                                                        <p className="font-syne text-[9px] text-member-muted font-semibold uppercase tracking-widest mt-1">Rest Timer</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Presets */}
                                            <div className="grid grid-cols-4 gap-2">
                                                {[30, 60, 90, 120].map(s => (
                                                    <button key={s} onClick={() => resetCD(s)}
                                                        className={`py-2 rounded-xl text-xs font-syne font-bold border transition-all ${cdInitial === s ? 'bg-member-accent text-white border-transparent shadow-sm' : 'bg-member-surface text-member-secondary border-member-border'}`}>
                                                        {s}s
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Custom time */}
                                            <input type="number" placeholder="Custom seconds" min="10" max="600"
                                                className="w-full border border-member-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-member-primary outline-none bg-member-surface focus:border-member-accent text-center"
                                                onBlur={e => { if (+e.target.value > 0) resetCD(+e.target.value); }} />
                                            <div className="flex gap-2">
                                                <button onClick={startCD}
                                                    className={`flex-1 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm font-syne ${timerRunning ? 'bg-member-amber text-[#111118]' : 'bg-member-accent text-white shadow-member-accent/20'}`}>
                                                    {timerRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
                                                </button>
                                                <button onClick={() => resetCD()} className="px-5 py-3.5 rounded-2xl border border-member-border bg-member-surface text-member-secondary text-sm font-bold hover:bg-member-elevated flex items-center gap-1.5 active:scale-95 transition-all">
                                                    <RotateCcw size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* HIIT TIMER */}
                                    {timerMode === 'hiit' && (
                                        <div className="space-y-5">
                                            {/* HIIT display */}
                                            <div className={`rounded-2xl p-5 text-center border transition-all duration-500 bg-member-surface ${hiitPhase === 'work' ? 'bg-member-emerald-soft/10 border-member-emerald/20' : 'bg-member-amber-soft/10 border-member-amber/20'}`}>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${hiitPhase === 'work' ? 'text-member-emerald' : 'text-member-amber'}`}>
                                                    {hiitDone ? '✅ Complete!' : `${hiitPhase.toUpperCase()} PHASE`}
                                                </p>
                                                <p className={`text-6xl font-black leading-none font-mono ${hiitPhase === 'work' ? 'text-member-emerald' : 'text-member-amber'}`}>{fmtS(hiitTimeLeft)}</p>
                                                <p className="text-xs font-bold text-member-secondary mt-2">Round {currentRound} / {hiitRounds}</p>
                                                {/* Progress dots */}
                                                <div className="flex items-center justify-center gap-1.5 mt-3">
                                                    {Array.from({ length: hiitRounds }).map((_, i) => (
                                                        <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < currentRound - 1 ? 'bg-member-emerald' : i === currentRound - 1 ? (hiitPhase === 'work' ? 'bg-member-emerald scale-125' : 'bg-member-amber scale-125') : 'bg-member-surface'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Settings */}
                                            <div className="grid grid-cols-3 gap-2.5">
                                                {[
                                                    { label: 'Work (s)', val: hiitWork, set: v => { setHiitWork(v); if (hiitPhase === 'work') setHiitTimeLeft(v); } },
                                                    { label: 'Rest (s)', val: hiitRest, set: v => { setHiitRest(v); if (hiitPhase === 'rest') setHiitTimeLeft(v); } },
                                                    { label: 'Rounds', val: hiitRounds, set: setHiitRounds },
                                                ].map((f, i) => (
                                                    <div key={i}>
                                                        <label className="text-[9px] text-member-muted font-bold uppercase block mb-1 font-syne">{f.label}</label>
                                                        <input type="number" value={f.val} onChange={e => f.set(+e.target.value)}
                                                            className="w-full border border-member-border rounded-xl px-2 py-2 text-xs font-black text-member-primary text-center outline-none bg-member-surface" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={startHIIT}
                                                    className={`flex-1 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm font-syne ${timerRunning ? 'bg-member-amber text-[#111118]' : 'bg-member-emerald text-white'}`}>
                                                    {timerRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {hiitDone ? 'Restart HIIT' : 'Start HIIT'}</>}
                                                </button>
                                                <button onClick={resetHIIT} className="px-5 py-3.5 rounded-2xl border border-member-border bg-member-surface text-member-secondary font-bold hover:bg-member-elevated active:scale-95 transition-all">
                                                    <RotateCcw size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* STOPWATCH */}
                                    {timerMode === 'stopwatch' && (
                                        <div className="space-y-5">
                                            <div className="bg-member-surface border border-member-border rounded-2xl p-5 text-center relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-member-accent/10 to-purple-600/10" />
                                                <p className="text-5xl font-black text-member-primary font-mono tracking-widest relative z-10">{fmtSW(swTime)}</p>
                                                <p className="text-[9px] text-member-muted font-semibold uppercase tracking-widest mt-2 relative z-10">Precision Stopwatch</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={startSW}
                                                    className={`flex-1 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm font-syne ${timerRunning ? 'bg-member-amber text-[#111118]' : 'bg-member-accent text-white'}`}>
                                                    {timerRunning ? <><Pause size={16} /> Stop</> : <><Play size={16} /> Start</>}
                                                </button>
                                                <button onClick={() => setSwLaps([swTime, ...swLaps])} disabled={!timerRunning}
                                                    className="px-4 py-3.5 rounded-2xl border border-member-border text-member-secondary text-xs font-bold disabled:opacity-40 hover:bg-member-elevated active:scale-95 transition-all bg-member-surface font-syne">
                                                    Lap
                                                </button>
                                                <button onClick={resetSW} className="px-4 py-3.5 rounded-2xl border border-member-border text-member-muted text-xs font-bold hover:bg-member-elevated active:scale-95 transition-all bg-member-surface font-syne">
                                                    <RotateCcw size={14} />
                                                </button>
                                            </div>
                                            {swLaps.length > 0 && (
                                                <div className="bg-member-surface border border-member-border rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
                                                    {swLaps.map((lap, i) => (
                                                        <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-member-border last:border-0 text-xs bg-member-surface font-dmsans">
                                                            <span className="text-member-muted font-semibold">Lap {swLaps.length - i}</span>
                                                            <span className="font-black text-member-primary font-mono">{fmtSW(lap)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STRETCH TIMER */}
                                    {timerMode === 'stretch' && (
                                        <div className="space-y-5">

                                            {/* Completion Banner */}
                                            <AnimatePresence>
                                                {stretchDone && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="rounded-2xl p-5 text-center border"
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.06))',
                                                            borderColor: 'rgba(16,185,129,0.35)'
                                                        }}
                                                    >
                                                        <div className="text-4xl mb-2">🎉</div>
                                                        <p className="font-black text-emerald-400 text-base font-syne">Stretch Complete!</p>
                                                        <p className="text-xs text-white/45 mt-1.5">
                                                            {stretchXPClaimed ? '✅ +10 XP awarded to your rank!' : 'Claiming your XP...'}
                                                        </p>
                                                        <button
                                                            onClick={resetStretch}
                                                            className="mt-4 text-xs font-bold text-white/35 underline"
                                                        >
                                                            Start Again
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Circular Ring Timer */}
                                            {!stretchDone && (
                                                <div className="flex justify-center">
                                                    <div className="relative w-48 h-48">
                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                                                            <circle cx="96" cy="96" r="84"
                                                                stroke="rgba(16,185,129,0.1)" strokeWidth="10" fill="transparent" />
                                                            <motion.circle cx="96" cy="96" r="84"
                                                                stroke="url(#stretchGrad)" strokeWidth="10" fill="transparent"
                                                                strokeDasharray={2 * Math.PI * 84}
                                                                animate={{ strokeDashoffset: 2 * Math.PI * 84 * (stretchTime / STRETCH_DURATION) }}
                                                                transition={{ duration: 0.8 }}
                                                                strokeLinecap="round"
                                                            />
                                                            <defs>
                                                                <linearGradient id="stretchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#10b981" />
                                                                    <stop offset="100%" stopColor="#34d399" />
                                                                </linearGradient>
                                                            </defs>
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <p className="text-4xl font-black text-white font-mono">{fmtS(stretchTime)}</p>
                                                            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1 font-syne">Stretch</p>
                                                            <p className="text-[8px] text-white/30 mt-0.5">
                                                                {Math.round(((STRETCH_DURATION - stretchTime) / STRETCH_DURATION) * 100)}% done
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Current stretch cue card */}
                                            {!stretchDone && (
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={stretchCueIdx}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        transition={{ duration: 0.4 }}
                                                        className="rounded-2xl p-4 text-center border"
                                                        style={{
                                                            background: stretchRunning ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                                                            borderColor: stretchRunning ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'
                                                        }}
                                                    >
                                                        <p className="text-3xl mb-2">{STRETCH_CUES[stretchCueIdx].emoji}</p>
                                                        <p className="text-sm font-bold text-white/80 font-syne leading-snug">
                                                            {STRETCH_CUES[stretchCueIdx].text}
                                                        </p>
                                                        <p className="text-[9px] text-white/25 mt-2 font-syne">
                                                            {stretchRunning ? `Pose ${stretchCueIdx + 1} of ${STRETCH_CUES.length} · Changes every ~37s` : 'Start the timer to begin'}
                                                        </p>
                                                    </motion.div>
                                                </AnimatePresence>
                                            )}

                                            {/* XP reward strip */}
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[11px] text-white/35 font-syne">
                                                    🎯 Complete all 5 mins to earn
                                                </p>
                                                <span className="text-sm font-black" style={{ color: '#34d399' }}>+10 XP</span>
                                            </div>

                                            {/* Controls */}
                                            {!stretchDone && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={startStretch}
                                                        className="flex-1 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 font-syne text-white"
                                                        style={{
                                                            background: stretchRunning
                                                                ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
                                                                : 'linear-gradient(135deg, #10b981, #059669)',
                                                            boxShadow: stretchRunning
                                                                ? '0 4px 15px rgba(245,158,11,0.3)'
                                                                : '0 4px 15px rgba(16,185,129,0.35)'
                                                        }}
                                                    >
                                                        {stretchRunning
                                                            ? <><Pause size={16} /> Pause</>
                                                            : <><Play size={16} /> {stretchTime === STRETCH_DURATION ? 'Start Stretching' : 'Resume'}</>
                                                        }
                                                    </button>
                                                    <button
                                                        onClick={resetStretch}
                                                        className="px-5 py-3.5 rounded-2xl border border-member-border bg-member-surface text-member-secondary font-bold hover:bg-member-elevated active:scale-95 transition-all"
                                                    >
                                                        <RotateCcw size={15} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Pose reference grid */}
                                            <div className="border-t border-white/5 pt-4">
                                                <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold mb-3 font-syne">All 8 Stretch Poses</p>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {STRETCH_CUES.map((cue, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all"
                                                            style={{
                                                                background: i === stretchCueIdx && stretchRunning
                                                                    ? 'rgba(16,185,129,0.12)'
                                                                    : 'rgba(255,255,255,0.025)',
                                                                border: `1px solid ${i === stretchCueIdx && stretchRunning ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`
                                                            }}
                                                        >
                                                            <span className="text-base flex-shrink-0">{cue.emoji}</span>
                                                            <p className="text-[9px] text-white/40 leading-tight font-syne">
                                                                {cue.text.split('—')[0].trim()}
                                                            </p>
                                                        </div>
                                                    ))}
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

export default MemberHealth;
