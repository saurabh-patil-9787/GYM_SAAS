import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, CreditCard,
    RefreshCw, AlertCircle, ChevronRight, ChevronLeft, FileText, Zap, XCircle, MessageCircle,
    CheckCircle2, Flame, Award, Bell, Activity, TrendingUp, Droplets, RotateCcw,
    ShoppingBag, Package, Tag, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import { requestNotificationPermission, getNotificationStatus } from '../../utils/firebase';
import { isAndroidApp } from '../../utils/platformUtils';
import {
    initializeCapacitorFCM,
    registerAndroidFCMToken,
    setupCapacitorFCMListeners,
} from '../../utils/capacitorFCM';
import { getMemberFeaturedProducts } from '../../api/productApi';
import { useRealtimeEvent } from '../../context/RealtimeContext';

// ── Plan Expiry Warning Banner ───────────────────────────────────────────────
// Shown from 5 days before expiry. No dismiss — closes only when plan is renewed
// or if member already has a pending renewal request.
const PlanExpiryBanner = ({ daysRemaining, expiryDate, hasPendingRenewal }) => {
    const navigate = useNavigate();

    // Hidden if: outside 5-day window, already expired, or renewal already requested
    if (daysRemaining < 0 || daysRemaining > 5 || hasPendingRenewal) return null;

    // ── Urgency config ladder ────────────────────────────────────────────
    const urgency = daysRemaining <= 1 ? 'critical' : daysRemaining <= 2 ? 'urgent' : daysRemaining <= 3 ? 'important' : 'warning';

    const config = {
        warning:   { iconColor: '#f59e0b', borderColor: 'rgba(245,158,11,0.30)', glowColor: 'rgba(245,158,11,0.12)', bgFrom: 'rgba(245,158,11,0.10)', bgTo: 'rgba(245,158,11,0.04)' },
        important: { iconColor: '#f97316', borderColor: 'rgba(249,115,22,0.30)', glowColor: 'rgba(249,115,22,0.14)', bgFrom: 'rgba(249,115,22,0.12)', bgTo: 'rgba(245,158,11,0.05)' },
        urgent:    { iconColor: '#ef4444', borderColor: 'rgba(244,63,94,0.32)', glowColor: 'rgba(244,63,94,0.16)', bgFrom: 'rgba(244,63,94,0.13)', bgTo: 'rgba(245,158,11,0.06)' },
        critical:  { iconColor: '#f43f5e', borderColor: 'rgba(244,63,94,0.40)', glowColor: 'rgba(244,63,94,0.22)', bgFrom: 'rgba(244,63,94,0.18)', bgTo: 'rgba(245,158,11,0.08)' },
    }[urgency];

    // ── Dynamic headline per day ─────────────────────────────────────────
    const headline = {
        5: 'Plan expires in 5 days',
        4: 'Plan expires in 4 days',
        3: 'Plan expires in 3 days',
        2: 'Plan expires in 2 days!',
        1: 'Plan expires tomorrow!',
        0: 'Plan expires TODAY!',
    }[daysRemaining];

    // Progress bar: fraction of 5-day window remaining
    const progressPct = Math.round((daysRemaining / 5) * 100);
    const expiryStr = expiryDate
        ? new Date(expiryDate).toLocaleDateString('en-GB')
        : null;

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="mx-3 mt-2 mb-3 rounded-2xl overflow-hidden relative"
            style={{
                background: `linear-gradient(135deg, ${config.bgFrom} 0%, ${config.bgTo} 100%)`,
                border: `1px solid ${config.borderColor}`,
                boxShadow: `0 0 28px ${config.glowColor}`,
            }}
        >
            {/* ── Travelling shimmer ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.045) 50%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'expiryShimmer 2.4s linear infinite',
                }}
            />

            <div className="relative z-10 p-[14px]">
                {/* ── Row 1: icon + headline ── */}
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `${config.iconColor}22`, border: `1px solid ${config.iconColor}40` }}
                    >
                        <AlertTriangle
                            size={16}
                            style={{ color: config.iconColor }}
                            className={daysRemaining <= 1 ? 'animate-pulse' : ''}
                        />
                    </div>
                    <p
                        className="font-syne text-[13px] font-extrabold leading-tight flex-1"
                        style={{ color: config.iconColor }}
                    >
                        {headline}
                        {expiryStr && (
                            <span className="font-dmsans font-normal text-member-muted text-[10px] ml-1.5">({expiryStr})</span>
                        )}
                    </p>
                </div>

                {/* ── Row 2: Two bullet points ── */}
                <div className="space-y-1 mb-3 pl-1">
                    <div className="flex items-start gap-1.5">
                        <span className="text-[9px] mt-[3px] flex-shrink-0" style={{ color: config.iconColor }}>•</span>
                        <p className="font-dmsans text-[11px] text-member-secondary leading-snug">
                            Renew on time to keep your gym access active.
                        </p>
                    </div>
                    <div className="flex items-start gap-1.5">
                        <span className="text-[9px] mt-[3px] flex-shrink-0" style={{ color: config.iconColor }}>•</span>
                        <p className="font-dmsans text-[11px] text-member-secondary leading-snug">
                            If your plan lapses, your <span className="font-bold" style={{ color: config.iconColor }}>streak resets to 0</span>.
                        </p>
                    </div>
                </div>

                {/* ── Row 3: progress bar ── */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-syne text-[9px] font-bold uppercase tracking-wider text-member-muted">Renewal window</span>
                        <span className="font-syne text-[9px] font-bold" style={{ color: config.iconColor }}>
                            {daysRemaining === 0 ? 'Last day' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`}
                        </span>
                    </div>
                    <div className="w-full h-[5px] rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                            className="h-full rounded-full"
                            style={{
                                background: `linear-gradient(90deg, ${config.iconColor}cc, ${config.iconColor})`,
                                boxShadow: `0 0 8px ${config.iconColor}80`,
                            }}
                        />
                    </div>
                </div>

                {/* ── Row 4: Renew Now button ── */}
                <button
                    onClick={() => navigate('/member/plans?action=continue')}
                    className="w-full py-2 rounded-[10px] font-syne text-[11px] font-extrabold text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-md"
                    style={{
                        background: `linear-gradient(135deg, ${config.iconColor} 0%, #f43f5e 100%)`,
                        boxShadow: `0 4px 14px ${config.glowColor}`,
                    }}
                >
                    Renew Now <ChevronRight size={13} />
                </button>
            </div>
        </motion.div>
    );
};

// ── Streak Card ─────────────────────────────────────────────────────────────
const ConsistencyStreakCard = ({ profile, streak, checkedInToday, checkingIn, handleCheckIn }) => {
    if (profile?.registrationStatus !== 'approved') return null;
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="member-card mb-[14px] relative overflow-hidden"
        >
            <div className="ambient-glow ambient-glow-bl bg-member-amber" />
            <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center ${checkedInToday ? 'bg-member-amber-soft text-member-amber' : 'bg-member-surface text-member-muted'} border border-member-border`}>
                        <Flame size={18} className={checkedInToday ? 'animate-pulse font-bold' : ''} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-syne text-[10px] text-member-muted uppercase tracking-wider font-semibold truncate">Consistency Streak</p>
                        <p className="font-syne text-base font-black text-member-primary leading-none mt-0.5 truncate">{streak} Days Active</p>
                    </div>
                </div>
                <button
                    onClick={handleCheckIn}
                    disabled={checkedInToday || checkingIn}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-syne font-bold shadow-md transition-all duration-200 active:scale-95 flex items-center gap-1 ${checkedInToday ? 'bg-member-emerald-soft text-member-emerald border border-member-emerald/25' : 'bg-gradient-to-r from-member-amber to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 hover:shadow-member-amber/20'}`}
                >
                    {checkedInToday ? <><CheckCircle2 size={13} /> Checked In</> : checkingIn ? 'Saving...' : <>Check In</>}
                </button>
            </div>
            <div className="member-week-dots-container relative z-10 border-member-amber/30 shadow-[inset_0_2px_10px_rgba(245,158,11,0.05)] bg-[#14141d]">
                <div className="flex justify-between items-center text-center w-full">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date(); date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const label = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
                        const isChecked = (profile?.checkIns || []).some(c => c.date === dateStr);
                        const isToday = i === 6; const isSunday = date.getDay() === 0;
                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <span className={`font-syne text-[8px] font-semibold uppercase leading-none ${isToday ? 'text-member-accent font-bold' : isSunday ? 'text-member-sky/60' : 'text-member-muted'}`}>{isToday ? 'Now' : label}</span>
                                <div className={`member-week-dot ${isChecked ? 'member-week-dot-checked shadow-member-amber/20' : isToday ? 'member-week-dot-today' : isSunday ? 'member-week-dot-missed border-member-sky/20 opacity-40' : 'member-week-dot-missed border-member-border'}`}>{isChecked ? '🔥' : isSunday ? '☀️' : date.getDate()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

// ── Hero Section (Product Showcase Carousel) ────────────────────────────────
const HeroSection = ({ gymName }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = left-to-right slide-in, -1 = right-to-left
    const [isPaused, setIsPaused] = useState(false);
    const autoAdvanceRef = useRef(null);
    const touchStartX = useRef(null);

    useEffect(() => {
        let cancelled = false;
        getMemberFeaturedProducts()
            .then(data => { if (!cancelled) setProducts(Array.isArray(data) ? data : []); })
            .catch(() => { if (!cancelled) setProducts([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const startAutoAdvance = useCallback(() => {
        if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
        if (products.length > 1) {
            autoAdvanceRef.current = setInterval(() => {
                setDirection(1);
                setCurrentIndex(prev => (prev + 1) % products.length);
            }, 5000);
        }
    }, [products.length]);

    useEffect(() => {
        if (!isPaused) startAutoAdvance();
        else if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
        return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
    }, [startAutoAdvance, isPaused]);

    const goTo = (idx) => {
        setDirection(idx > currentIndex ? 1 : -1);
        setCurrentIndex(idx);
        startAutoAdvance();
    };

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null || products.length < 2) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < 40) return;
        if (delta < 0) {
            setDirection(1);
            goTo((currentIndex + 1) % products.length);
        } else {
            setDirection(-1);
            goTo((currentIndex - 1 + products.length) % products.length);
        }
    };

    const product = products.length > 0 ? products[currentIndex] : null;
    const discount = product?.mrp && product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : null;

    // ── Skeleton loader ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="mx-3 mt-2 mb-3">
                <div
                    className="relative w-full rounded-2xl overflow-hidden bg-[#111118] animate-pulse"
                    style={{ height: 'clamp(280px, 44vw, 340px)' }}
                >
                    {/* Blurred shimmer image placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a28] via-[#111118] to-[#0a0a0f]" />
                    {/* Top bar skeleton */}
                    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-3.5">
                        <div className="flex items-center gap-2">
                            <div className="w-[3px] h-4 bg-white/10 rounded-full" />
                            <div className="h-2.5 w-24 bg-white/10 rounded-full" />
                        </div>
                        <div className="h-6 w-16 bg-white/10 rounded-full" />
                    </div>
                    {/* Centre image placeholder */}
                    <div className="absolute inset-x-[20%] top-[14%] bottom-[38%] bg-white/[0.04] rounded-2xl" />
                    {/* Bottom text skeleton */}
                    <div className="absolute inset-x-0 bottom-0 px-4 pb-4 space-y-2">
                        <div className="h-2 w-16 bg-white/10 rounded-full mx-auto" />
                        <div className="h-4 w-44 bg-white/10 rounded-full mx-auto" />
                        <div className="h-5 w-24 bg-white/10 rounded-full mx-auto" />
                        <div className="flex justify-center gap-1.5 pt-1">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    // ── Slide animation variants ─────────────────────────────────────
    const slideVariants = {
        enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.6 }),
        center: { x: 0, opacity: 1, transition: { duration: 0.30, ease: [0.25, 0.46, 0.45, 0.94] } },
        exit: (dir) => ({ x: dir > 0 ? '-55%' : '55%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }),
    };

    return (
        <div className="mx-3 mt-2 mb-1">
            {/* ── Carousel track ─────────────────────────────────────────── */}
            <div
                className="relative w-full overflow-hidden rounded-2xl bg-[#0a0a0f] select-none"
                style={{ height: 'clamp(300px, 48vw, 360px)', cursor: 'pointer' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => navigate(`/member/store/${product._id}`)}
            >
                {/* ── Layer 1: Blurred ambient background ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={'bg-' + currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="absolute inset-0"
                    >
                        {product.image?.url && (
                            <img
                                src={product.image.url}
                                alt=""
                                aria-hidden
                                draggable={false}
                                className="w-full h-full object-cover scale-110"
                                style={{ filter: 'blur(24px) brightness(0.25) saturate(1.7)' }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ── Layer 2: Sliding product image — zone: top 13% → height 62% ── */}
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={'img-' + currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-x-0"
                        style={{ top: '13%', height: '62%' }}
                    >
                        <div className="w-full h-full px-[12%]">
                            {product.image?.url ? (
                                <img
                                    src={product.image.url}
                                    alt={product.name}
                                    draggable={false}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain drop-shadow-[0_20px_48px_rgba(0,0,0,0.9)]"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package size={72} className="text-white/10" strokeWidth={0.8} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* ── Gradient overlays — pulled back so image centre stays clean ── */}
                {/* Top vignette: only 25% height, enough for top bar contrast */}
                <div
                    className="absolute inset-x-0 top-0 pointer-events-none z-10"
                    style={{ height: '25%', background: 'linear-gradient(to bottom, rgba(10,10,15,0.88) 0%, transparent 100%)' }}
                />
                {/* Bottom gradient: 44% height, soft stop at 55% so mid-image stays bright */}
                <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
                    style={{ height: '44%', background: 'linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.78) 55%, transparent 100%)' }}
                />

                {/* ── Top bar: label + View All — sits in 0–13% zone ── */}
                <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-3 pointer-events-none">
                    <div className="flex items-center gap-1.5">
                        <div className="w-[3px] h-[13px] bg-[#6c5ce7] rounded-full" />
                        <span
                            className="text-[10px] font-bold text-white/75 uppercase tracking-[0.18em]"
                            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        >
                            Featured
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate('/member/store'); }}
                        className="pointer-events-auto flex items-center gap-1 bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white/70 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 hover:bg-white/[0.14]"
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                        View All <ChevronRight size={9} className="opacity-60 -ml-0.5" />
                    </button>
                </div>

                {/* ── Bottom footer: 2 compact rows inside the 44% gradient zone ── */}
                <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3.5 pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex + '-info'}
                            initial={{ y: 7, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -4, opacity: 0 }}
                            transition={{ duration: 0.25, delay: 0.10, ease: 'easeOut' }}
                        >
                            {/* Row 1: name (left) + price (right) — side by side */}
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                                {/* Product name — 12px, semibold, single line */}
                                <p
                                    className="text-white font-semibold leading-none line-clamp-1 flex-1 min-w-0"
                                    style={{ fontSize: '12px', fontFamily: 'Inter, system-ui, sans-serif' }}
                                >
                                    {product.name}
                                </p>
                                {/* Actual price — 14px bold indigo */}
                                <span
                                    className="font-bold leading-none flex-shrink-0"
                                    style={{ fontSize: '14px', color: '#6c5ce7', fontFamily: 'Inter, system-ui, sans-serif' }}
                                >
                                    ₹{product.price?.toLocaleString('en-IN')}
                                </span>
                            </div>

                            {/* Row 2: MRP line-through + badge + dots — all in one row */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {/* MRP line-through */}
                                {product.mrp && product.mrp > product.price && (
                                    <span
                                        className="leading-none line-through"
                                        style={{ fontSize: '11px', color: '#999', fontFamily: 'Inter, system-ui, sans-serif' }}
                                    >
                                        ₹{product.mrp?.toLocaleString('en-IN')}
                                    </span>
                                )}

                                {/* Discount badge — amber-500, rounded-full */}
                                {discount && (
                                    <span
                                        className="font-bold px-1.5 py-px rounded-full leading-none"
                                        style={{
                                            fontSize: '10px',
                                            backgroundColor: '#f59e0b',
                                            color: '#0a0a0f',
                                            fontFamily: 'Inter, system-ui, sans-serif',
                                            boxShadow: '0 1px 6px rgba(245,158,11,0.40)',
                                        }}
                                    >
                                        {discount}% OFF
                                    </span>
                                )}

                                {/* Out-of-stock badge */}
                                {product.stockStatus === 'OUT_OF_STOCK' && (
                                    <span
                                        className="font-bold px-1.5 py-px rounded-full leading-none"
                                        style={{
                                            fontSize: '10px',
                                            backgroundColor: 'rgba(244,63,94,0.85)',
                                            color: '#fff',
                                            fontFamily: 'Inter, system-ui, sans-serif',
                                        }}
                                    >
                                        Out of Stock
                                    </span>
                                )}

                                {/* Navigation dots — inline on same row, pushed right via ml-auto */}
                                {products.length > 1 && (
                                    <div className="flex items-center gap-1 ml-auto pointer-events-auto">
                                        {products.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                                                aria-label={`Go to product ${i + 1}`}
                                                style={{
                                                    width: i === currentIndex ? 18 : 6,
                                                    height: 6,
                                                    borderRadius: 999,
                                                    backgroundColor: i === currentIndex ? '#6c5ce7' : '#6b7280',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: i === currentIndex ? '0 0 7px rgba(108,92,231,0.7)' : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};


// ── Main Dashboard ────────────────────────────────────────────────────────────
const MemberDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [notifStatus, setNotifStatus] = useState('default');
    const [notifRequesting, setNotifRequesting] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [reapplying, setReapplying] = useState(false);
    const [reapplySuccess, setReapplySuccess] = useState(false);

    // Fitness/Consistency check-in states
    const [streak, setStreak] = useState(0);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [confettiParticles, setConfettiParticles] = useState([]);
    const [unlockedBadgeAlert, setUnlockedBadgeAlert] = useState(null);

    // Hydration states
    const [waterIntake, setWaterIntake] = useState(0);
    const [showWaterCelebration, setShowWaterCelebration] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchCheckIns();

        if (isAndroidApp()) {
            // ── Native Android FCM path ────────────────────────────────────
            // Runs once on mount; each utility handles its own duplicate-safety.
            // FCM failure is non-fatal — member portal still loads normally.
            (async () => {
                try {
                    await initializeCapacitorFCM();
                    await registerAndroidFCMToken('member');
                    await setupCapacitorFCMListeners();
                } catch (err) {
                    console.warn('[MemberDashboard] Native FCM setup error (non-fatal):', err);
                }
            })();
        } else {
            // ── Web / PWA path — unchanged ─────────────────────────────────
            const currentStatus = getNotificationStatus();
            setNotifStatus(currentStatus);

            // Auto-refresh token on load if permission was already granted previously
            if (currentStatus === 'granted') {
                requestNotificationPermission('/api/member/fcm-token');
            }
        }

        // Load hydration
        const key = `water_${new Date().toISOString().split('T')[0]}`;
        const saved = localStorage.getItem(key);
        if (saved) setWaterIntake(Number(saved));
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get('/api/member/profile');
            setProfile(res.data);
            // Check if member has a pending renewal request (Fresh Start)
            if (res.data?.registrationStatus === 'approved' || res.data?.registrationStatus === 'self') {
                const statusRes = await api.get('/api/member/renewal/status').catch(() => null);
                if (statusRes?.data?.hasPendingRequest) {
                    setPendingRequest({ type: 'renewal', ...statusRes.data.request });
                } else {
                    setPendingRequest(null);
                }
            }
        } catch (err) {
            setError('Failed to load profile');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── SSE: auto-refresh dashboard on key events ─────────────────────────
    // renewal_approved: owner approved fresh start or standard renewal
    useRealtimeEvent('renewal_approved',      fetchProfile);
    // renewal_rejected: fresh start was rejected — clear pending state
    useRealtimeEvent('renewal_rejected',      fetchProfile);
    // registration_approved: new member just got approved
    useRealtimeEvent('registration_approved', fetchProfile);
    // notification: any new notification — refresh profile to pick up any status changes
    useRealtimeEvent('notification',          fetchProfile);

    const fetchCheckIns = async () => {
        try {
            const res = await api.get('/api/member/checkins');
            setStreak(res.data.streak || 0);
            const todayStr = new Date().toISOString().split('T')[0];
            const checkedIn = (res.data.checkIns || []).some(c => c.date === todayStr);
            setCheckedInToday(checkedIn);
        } catch (err) {
            console.error('Failed to fetch check-ins', err);
        }
    };

    const playSuccessSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            osc.start();

            setTimeout(() => {
                osc.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
            }, 80);

            gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
            osc.stop(ctx.currentTime + 0.35);
        } catch (e) {
            console.error('Audio context error:', e);
        }
    };

    const triggerConfetti = () => {
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6'];
        const particles = Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // percentage width
            y: -10,
            size: Math.random() * 8 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.4,
            duration: Math.random() * 1.5 + 1.2,
            angle: Math.random() * 360,
            rotationSpeed: Math.random() * 360 - 180
        }));
        setConfettiParticles(particles);
        setTimeout(() => setConfettiParticles([]), 3500);
    };

    const handleCheckIn = async () => {
        if (checkedInToday || checkingIn) return;
        setCheckingIn(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const res = await api.post('/api/member/checkin', { date: todayStr });
            setStreak(res.data.streak);
            setCheckedInToday(true);

            playSuccessSound();
            triggerConfetti();

            if (res.data.unlockedBadges && res.data.unlockedBadges.length > 0) {
                const badgeNames = {
                    first_step: 'First Step 🏆',
                    streak_7: '7-Day Streak 🔥',
                    streak_30: '30-Day Warrior 🛡️',
                    centurion: 'Centurion 👑'
                };
                const newBadge = res.data.unlockedBadges[0];
                setUnlockedBadgeAlert(badgeNames[newBadge] || 'New Achievement!');
            }

            fetchProfile();
        } catch (err) {
            console.error('Check-in failed', err);
        } finally {
            setCheckingIn(false);
        }
    };

    const addWater = async (ml) => {
        const key = `water_${new Date().toISOString().split('T')[0]}`;
        const prev = waterIntake;
        const next = Math.max(0, prev + ml);
        setWaterIntake(next);
        localStorage.setItem(key, next);
        if (next >= waterGoal && prev < waterGoal) {
            setShowWaterCelebration(true);
            try { await api.post('/api/member/badges/water-warrior'); } catch { }
            setTimeout(() => setShowWaterCelebration(false), 3500);
        }
    };

    const handleReapply = async (updatedData = {}) => {
        setReapplying(true);
        try {
            // Extract gymId — profile.gym may be a populated object or just an ObjectId string
            const gymId = profile?.gym?._id || profile?.gym;
            await api.put(`/api/member/auth/reapply/${profile._id}`, {
                // Required for identity verification
                mobile: profile.mobile,
                gymId,
                // Optional updates
                ...updatedData
            });
            setReapplySuccess(true);
            await fetchProfile();
        } catch (err) {
            console.error('Reapply failed', err);
        } finally {
            setReapplying(false);
        }
    };

    if (loading) {
        return <BicepCurlLoader text="Loading Dashboard..." fullScreen={false} />;
    }

    if (error || !profile) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">{error || 'Unable to load profile'}</p>
                    <button
                        onClick={() => { setLoading(true); setError(''); fetchProfile(); }}
                        className="mt-4 text-indigo-600 font-semibold text-sm hover:text-indigo-700 flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw size={14} /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ── Rejected registration guard ─────────────────────────────────────────
    if (profile?.registrationStatus === 'rejected') {
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl border border-rose-200 shadow-lg p-8 text-center max-w-sm w-full"
                >
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-5">
                        <XCircle size={32} className="text-rose-500" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">
                        {reapplySuccess ? 'Reapplication Submitted!' : 'Registration Not Approved'}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">
                        {reapplySuccess
                            ? 'Your reapplication is waiting for the gym owner to review. You will get a notification once approved.'
                            : 'Your registration request was not approved. Please contact the gym or reapply below.'}
                    </p>
                    {!reapplySuccess && (
                        <>
                            <button
                                onClick={handleReapply}
                                disabled={reapplying}
                                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all mb-3 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {reapplying ? <><RefreshCw size={15} className="animate-spin" /> Reapplying...</> : <><RefreshCw size={15} /> Reapply for Membership</>}
                            </button>
                            {profile?.gym?.contactNumber && (
                                <a
                                    href={`https://wa.me/91${profile.gym.contactNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, my registration was rejected (Mobile: ${profile.mobile}). I'd like more information.`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold border border-emerald-200 transition-all"
                                >
                                    <MessageCircle size={15} /> Contact Gym
                                </a>
                            )}
                        </>
                    )}
                    {reapplySuccess && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <p className="text-xs text-amber-700 font-semibold">⏳ Waiting for gym owner approval</p>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    // Calculate membership status
    const now = new Date();
    const expiryDate = new Date(profile.expiryDate);
    const joiningDate = new Date(profile.joiningDate);
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    let membershipStatus = 'active';
    let statusColor = 'emerald';
    let statusLabel = 'Active';

    if (profile.status === 'Inactive') {
        membershipStatus = 'inactive';
        statusColor = 'slate';
        statusLabel = 'Stopped';
    } else if (daysRemaining <= 0) {
        membershipStatus = 'expired';
        statusColor = 'rose';
        statusLabel = 'Expired';
    } else if (daysRemaining <= 5) {
        membershipStatus = 'expiring';
        statusColor = 'amber';
        statusLabel = 'Expiring Soon';
    }

    const gymData = profile.gym || {};
    const gymName = gymData?.gymName || gymData?.name || null;
    const outstandingDue = Math.max((Number(profile.totalFee) || 0) - (Number(profile.paidFee) || 0), 0);
    const hasMissingDetails = (profile?.registrationStatus === 'approved' || !profile?.registrationStatus) && (!profile.age || !profile.weight || !profile.height || !profile.dob);

    const handleEnableNotifications = async () => {
        setNotifRequesting(true);
        const success = await requestNotificationPermission('/api/member/fcm-token');
        setNotifStatus(getNotificationStatus());
        setNotifRequesting(false);
        if (success) {
            // Optional: Show a brief success toast if desired
        }
    };

    // Calculate BMI & Calories
    const calcWeight = profile?.weight || 70;
    const calcHeight = profile?.height || 175;
    const calcGender = profile?.gender || 'male';
    const calcAge = profile?.age || 25;
    const calcActivity = profile?.activityLevel || 'moderately_active';

    const hm = calcHeight / 100;
    const bmi = hm > 0 ? parseFloat((calcWeight / (hm * hm)).toFixed(1)) : 0;

    let bmiCategory = 'Healthy';
    let bmiColorText = 'text-emerald-400';
    let bmiBg = 'bg-emerald-500/10 border-emerald-500/20';
    if (bmi < 18.5) {
        bmiCategory = 'Underweight';
        bmiColorText = 'text-sky-400';
        bmiBg = 'bg-sky-500/10 border-sky-500/20';
    } else if (bmi < 25) {
        bmiCategory = 'Healthy Weight';
        bmiColorText = 'text-emerald-400';
        bmiBg = 'bg-emerald-500/10 border-emerald-500/20';
    } else if (bmi < 30) {
        bmiCategory = 'Overweight';
        bmiColorText = 'text-amber-400';
        bmiBg = 'bg-amber-500/10 border-amber-500/20';
    } else {
        bmiCategory = 'Obese';
        bmiColorText = 'text-rose-400';
        bmiBg = 'bg-rose-500/10 border-rose-500/20';
    }

    const bmr = calcGender === 'male'
        ? (10 * calcWeight) + (6.25 * calcHeight) - (5 * calcAge) + 5
        : (10 * calcWeight) + (6.25 * calcHeight) - (5 * calcAge) - 161;
    const ACTIVITY_MULTIPLIERS = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extremely_active: 1.9
    };
    const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[calcActivity] || 1.2));

    const waterGoal = (() => {
        const base = calcWeight * 33;
        const bonus = ['very_active', 'extremely_active'].includes(calcActivity) ? 500 : 0;
        return Math.round((base + bonus) / 100) * 100; // round to nearest 100ml
    })();
    const glasses = Math.ceil(waterGoal / 250);
    const waterPct = Math.min(100, Math.round((waterIntake / waterGoal) * 100));

    return (
        <div className="pb-28">
            {/* ── Plan Expiry Warning Banner — priority #1, above hero and streak ── */}
            {/* Suppressed when member already has a pending renewal request */}
            <AnimatePresence>
                {daysRemaining >= 0 && daysRemaining <= 5 && (
                    <PlanExpiryBanner
                        daysRemaining={daysRemaining}
                        expiryDate={profile.expiryDate}
                        hasPendingRenewal={pendingRequest?.type === 'renewal'}
                    />
                )}
            </AnimatePresence>

            <HeroSection gymName={gymName} />

            {/* Confetti Render */}
            {confettiParticles.length > 0 && (
                <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                    {confettiParticles.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ y: '0vh', x: `${p.x}vw`, rotate: 0, opacity: 1 }}
                            animate={{
                                y: '105vh',
                                x: `${p.x + (Math.random() * 20 - 10)}vw`,
                                rotate: p.angle + p.rotationSpeed,
                                opacity: 0
                            }}
                            transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                borderRadius: Math.random() > 0.5 ? '50%' : '20%',
                                transformOrigin: 'center'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Badge Unlocked Popup */}
            {unlockedBadgeAlert && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 z-[99999]"
                >
                    <div className="bg-member-card rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl border border-member-border">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-member-amber to-orange-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Award className="text-[#111118]" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-member-primary font-syne font-extrabold">Badge Unlocked! 🎉</h3>
                        <p className="text-2xl font-black text-member-accent font-syne mt-2">{unlockedBadgeAlert}</p>
                        <p className="text-xs text-member-secondary font-dmsans mt-1">Check your Trophy Room in the Badges tab!</p>
                        <button
                            onClick={() => setUnlockedBadgeAlert(null)}
                            className="mt-5 w-full py-2.5 rounded-xl bg-member-accent hover:opacity-90 text-white text-xs font-syne font-bold transition-all shadow-lg active:scale-95"
                        >
                            AWESOME! 🔥
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Main Padded Content */}
            <div className="p-4">

                <ConsistencyStreakCard
                    profile={profile}
                    streak={streak}
                    checkedInToday={checkedInToday}
                    checkingIn={checkingIn}
                    handleCheckIn={handleCheckIn}
                />

            {/* Notification Permission Banner */}
            {notifStatus === 'default' && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-[14px] bg-member-accent-soft border border-member-accent/20 rounded-[14px] p-[14px] flex items-start gap-3"
                >
                    <div className="w-[28px] h-[28px] rounded-[8px] bg-member-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bell size={14} className="text-member-accent" />
                    </div>
                    <div className="flex-1">
                        <p className="font-syne text-[12px] font-bold text-member-accent">Enable Notifications</p>
                        <p className="font-dmsans text-[11px] text-member-secondary mt-0.5 mb-2">Get reminders for renewals, expiring plans, and payment alerts.</p>
                        <button
                            onClick={handleEnableNotifications}
                            disabled={notifRequesting}
                            className="font-syne text-[10px] font-extrabold bg-member-accent text-white px-3 py-1.5 rounded-[8px] shadow-sm hover:opacity-90 transition-opacity disabled:opacity-70"
                        >
                            {notifRequesting ? 'Enabling...' : 'Enable Now'}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Pending Registration / Renewal Request Banner */}
            {profile?.registrationStatus === 'awaiting_approval' && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-[14px] bg-member-amber-soft border border-member-amber/20 rounded-[14px] p-[14px] flex items-start gap-3"
                >
                    <div className="w-[28px] h-[28px] rounded-[8px] bg-member-amber/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock size={14} className="text-member-amber" />
                    </div>
                    <div className="flex-1">
                        <p className="font-syne text-[12px] font-bold text-member-amber">Registration Pending Approval</p>
                        <p className="font-dmsans text-[11px] text-member-secondary mt-0.5">Your registration request is waiting for the gym owner to review it. You'll get a notification when it's approved.</p>
                    </div>
                </motion.div>
            )}

            {pendingRequest?.type === 'renewal' && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-[14px] bg-member-accent-soft border border-member-accent/20 rounded-[14px] p-[14px] flex items-start gap-3"
                >
                    <div className="w-[28px] h-[28px] rounded-[8px] bg-member-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <RefreshCw size={14} className="text-member-accent" />
                    </div>
                    <div className="flex-1">
                        <p className="font-syne text-[12px] font-bold text-member-accent">Fresh Start Request Pending</p>
                        <p className="font-dmsans text-[11px] text-member-secondary mt-0.5">
                            Your renewal request for <span className="font-semibold text-member-primary">{pendingRequest.planName}</span> is awaiting owner approval.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Profile Completion Reminder Banner */}
            {hasMissingDetails && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-[14px] bg-member-amber-soft border border-member-amber/20 rounded-[14px] p-[14px] flex items-start gap-3"
                >
                    <div className="w-[28px] h-[28px] rounded-[8px] bg-member-amber/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle size={14} className="text-member-amber" />
                    </div>
                    <div className="flex-1">
                        <p className="font-syne text-[12px] font-bold text-member-amber">Complete Your Profile</p>
                        <p className="font-dmsans text-[11px] text-member-secondary mt-0.5 mb-2.5">
                            Please set your <strong>age, weight, height, and date of birth</strong> details in your profile to complete setup.
                        </p>
                        <button
                            onClick={() => navigate('/member/profile')}
                            className="font-syne text-[10px] font-extrabold bg-member-amber text-[#111118] px-3 py-1.5 rounded-[8px] shadow-sm hover:opacity-90 transition-opacity"
                        >
                            Update Profile Details
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Membership Card */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="member-card-hero !p-4 !rounded-[20px] mb-[14px] relative overflow-hidden"
            >
                {/* Glow */}
                <div className="ambient-glow ambient-glow-tr bg-member-accent" />

                {/* Compact Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-member-border relative z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            onClick={() => profile.photoUrl && setPreviewImage({ url: profile.photoUrl, title: profile.name })}
                            className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-member-accent to-purple-600 shadow-sm flex-shrink-0 ${profile.photoUrl ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                        >
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-bold text-sm font-syne">{profile.name?.charAt(0)?.toUpperCase()}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-syne font-black truncate leading-tight text-base text-member-accent">{profile.name}</h2>
                            <p className="font-dmsans text-[10px] text-member-sky font-semibold tracking-wide">ID: {profile.memberId} • {profile.planDuration}M plan</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`member-badge-pill border-[1px] ${membershipStatus === 'inactive'
                                ? 'bg-member-muted/12 text-member-muted border-member-muted/25'
                                : membershipStatus === 'expired'
                                    ? 'bg-member-rose-soft text-member-rose border-member-rose/25'
                                    : membershipStatus === 'expiring'
                                        ? 'bg-member-amber-soft text-member-amber border-member-amber/25'
                                        : 'bg-member-emerald-soft text-member-emerald border-member-emerald/25'
                            }`}>
                            {statusLabel}
                        </span>
                    </div>
                </div>

                {/* 3-Column Stats Grid */}
                <div className="member-stat-grid mb-3 !py-1.5 relative z-10">
                    <div className="member-stat-cell !py-1">
                        <p className="member-stat-cell-label text-member-sky font-bold">Expires</p>
                        <p className="member-stat-cell-val text-member-primary">
                            {expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                    <div className="member-stat-divider !h-12" />
                    <div className="member-stat-cell !py-1">
                        <p className={`member-stat-cell-label font-bold ${daysRemaining <= 0 ? 'text-member-rose' : daysRemaining <= 5 ? 'text-member-amber' : 'text-member-emerald'}`}>Days Left</p>
                        <p className={`member-stat-cell-val ${daysRemaining <= 0 ? 'text-member-rose drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : daysRemaining <= 5 ? 'text-member-amber drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-member-primary'
                            }`}>
                            {membershipStatus === 'inactive' ? '—' : daysRemaining <= 0 ? `${Math.abs(daysRemaining)} overdue` : daysRemaining}
                        </p>
                    </div>
                    <div className="member-stat-divider !h-12" />
                    <div className="member-stat-cell !py-1">
                        <p className={`member-stat-cell-label font-bold ${outstandingDue > 0 ? 'text-member-rose' : 'text-member-accent'}`}>Due</p>
                        <p className={`member-stat-cell-val ${outstandingDue > 0 ? 'text-member-rose drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'text-member-primary'}`}>
                            ₹{outstandingDue}
                        </p>
                    </div>
                </div>

                {/* Primary Action Button */}
                <button
                    onClick={() => {
                        if (membershipStatus === 'inactive') {
                            navigate('/member/plans?action=rejoin');
                        } else {
                            navigate('/member/plans?action=continue');
                        }
                    }}
                    className="member-btn-primary w-full relative z-10 !py-2.5 !rounded-[10px] text-xs"
                >
                    {membershipStatus === 'inactive' ? 'Rejoin Membership' : 'Renew Membership'}
                </button>
            </motion.div>

            {/* Hydration Tracker */}
            {profile?.registrationStatus === 'approved' && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="member-card mb-6 relative overflow-hidden"
                >
                    {/* Celebration overlay */}
                    <AnimatePresence>
                        {showWaterCelebration && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-member-sky/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-[18px]">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                                    className="text-5xl mb-2">💧</motion.div>
                                <p className="font-syne text-[16px] font-black text-white">Hydration Goal Hit!</p>
                                <p className="font-syne text-xs text-white/80 mt-1">Water Warrior badge unlocked 🏆</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-member-sky-soft border border-member-sky/20 flex items-center justify-center flex-shrink-0">
                                <Droplets className="text-member-sky" size={16} />
                            </div>
                            <div>
                                <h3 className="font-syne text-[13px] font-bold text-member-primary">Daily Hydration</h3>
                                <p className="font-dmsans text-[10px] text-member-secondary">Goal: {waterGoal}ml ({glasses} glasses)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-syne text-lg font-black text-member-sky">{waterPct}%</span>
                        </div>
                    </div>

                    {/* Glassmorphic SVG Bottle Animation */}
                    <div className="flex justify-center mb-6 relative z-10">
                        <div className="relative w-28 h-44">
                            <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-xl z-20 absolute inset-0">
                                <defs>
                                    <clipPath id="bottle-clip">
                                        <path d="M35 10 h30 v15 l12 15 v90 a10 10 0 0 1 -10 10 h-34 a10 10 0 0 1 -10 -10 v-90 l12 -15 z" />
                                    </clipPath>
                                </defs>

                                {/* Water Animation perfectly clipped to bottle shape */}
                                <g clipPath="url(#bottle-clip)">
                                    {/* Subtle glass background fill */}
                                    <rect x="0" y="0" width="100" height="140" fill="rgba(255, 255, 255, 0.04)" />

                                    <foreignObject x="0" y="0" width="100" height="140">
                                        <div className="w-full h-full relative">
                                            <motion.div
                                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-sky-400 opacity-90"
                                                initial={{ height: '0%' }}
                                                animate={{ height: `${Math.min(100, waterPct)}%` }}
                                                transition={{ type: 'spring', stiffness: 40, damping: 15 }}
                                            >
                                                {/* Wave SVG on top of the water block */}
                                                <svg viewBox="0 0 100 20" className="absolute -top-4 w-[200%] h-6 animate-[wave_3s_linear_infinite]" preserveAspectRatio="none" style={{ fill: '#38bdf8' }}>
                                                    <path d="M0,10 Q25,20 50,10 T100,10 L100,20 L0,20 Z" />
                                                </svg>
                                                <svg viewBox="0 0 100 20" className="absolute -top-5 w-[200%] h-8 animate-[wave_4s_linear_infinite_reverse] opacity-50" preserveAspectRatio="none" style={{ fill: '#0ea5e9' }}>
                                                    <path d="M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z" />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    </foreignObject>
                                </g>

                                {/* Outline and Reflections drawn ON TOP of water */}
                                <path d="M35 10 h30 v15 l12 15 v90 a10 10 0 0 1 -10 10 h-34 a10 10 0 0 1 -10 -10 v-90 l12 -15 z"
                                    fill="transparent"
                                    stroke="rgba(255, 255, 255, 0.25)"
                                    strokeWidth="2.5" />
                                {/* Measurement marks */}
                                <line x1="23" y1="110" x2="32" y2="110" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" strokeLinecap="round" />
                                <line x1="23" y1="80" x2="32" y2="80" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" strokeLinecap="round" />
                                <line x1="23" y1="50" x2="32" y2="50" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" strokeLinecap="round" />
                                {/* Bottle cap details */}
                                <rect x="33" y="2" width="34" height="8" rx="2" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
                            </svg>

                            {/* Water stats overlay */}
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-white mix-blend-overlay">
                                <span className="font-syne font-black text-xl drop-shadow-md">{waterIntake}</span>
                                <span className="font-dmsans text-[9px] font-bold tracking-widest drop-shadow-md">ML</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick add buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                        {[
                            { ml: 250, label: '+250ml', sub: '1 Glass', emoji: '🥛' },
                            { ml: 500, label: '+500ml', sub: '1 Bottle', emoji: '🍶' },
                            { ml: 1000, label: '+1L', sub: 'Large Jug', emoji: '🪣' },
                        ].map(btn => (
                            <button key={btn.ml} onClick={() => addWater(btn.ml)}
                                className="member-water-btn active:scale-95 transition-all">
                                <p className="text-lg mb-0.5">{btn.emoji}</p>
                                <p className="member-water-btn-label">{btn.label}</p>
                                <p className="member-water-btn-sub">{btn.sub}</p>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 relative z-10">
                        <button onClick={() => addWater(-250)} disabled={waterIntake <= 0}
                            className="flex-1 py-2 rounded-xl border border-member-border text-member-muted text-xs font-syne font-bold bg-member-surface hover:border-member-border/20 hover:text-member-secondary disabled:opacity-40 active:scale-95 transition-all">
                            − 250ml
                        </button>
                        <button onClick={() => { const k = `water_${new Date().toISOString().split('T')[0]}`; setWaterIntake(0); localStorage.removeItem(k); }}
                            className="flex-1 py-2 rounded-xl border border-member-border text-member-muted text-xs font-syne font-bold bg-member-surface hover:border-member-border/20 hover:text-member-secondary flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                            <RotateCcw size={11} /> Reset
                        </button>
                    </div>
                </motion.div>
            )}

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

export default MemberDashboard;
