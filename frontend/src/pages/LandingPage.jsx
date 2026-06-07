import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Crown, User, BarChart3, Shield, Bell, Smartphone,
    Users, IndianRupee, Menu, X, ChevronRight, Zap,
    Target, Activity, TrendingUp, Award, CheckCircle
} from 'lucide-react';
import {
    motion, useMotionValue, useTransform, useInView,
    AnimatePresence, useAnimation
} from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ─── Google Fonts ─────────────────────────────────────────── */
const GoogleFontsStyle = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Tiro+Devanagari+Marathi&family=Baloo+2:wght@400;600;700;800&family=Mukta:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: #070714;
            --surface: #0d0d1f;
            --border: rgba(255,255,255,0.05);
            --border-glow: rgba(108,92,231,0.3);
            --accent: #6c5ce7;
            --accent-soft: #a78bfa;
            --glow: #4f46e5;
            --text-primary: #f0f0ff;
            --text-muted: #6b7280;
            --success: #10b981;
            --warning: #f59e0b;
        }

        html { scroll-behavior: smooth; }

        body {
            background: var(--bg);
            color: var(--text-primary);
            font-family: 'Poppins', sans-serif;
            overflow-x: hidden;
        }

        .font-marathi-brand {
            font-family: 'Tiro Devanagari Marathi', 'Baloo 2', serif;
            font-weight: 700;
            letter-spacing: 0.02em;
        }
        .font-marathi-body {
            font-family: 'Baloo 2', 'Mukta', 'Noto Sans Devanagari', sans-serif;
        }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .font-mono-num { font-family: 'JetBrains Mono', monospace; }
        /* legacy aliases — keep for any remaining refs */
        .font-dmsans { font-family: 'Poppins', sans-serif; }
        .font-bebas  { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }

        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }

        /* animated grid */
        .animated-grid {
            background-image:
                linear-gradient(rgba(108,92,231,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(108,92,231,0.04) 1px, transparent 1px);
            background-size: 60px 60px;
        }

        /* glass card */
        .glass-card {
            background: rgba(13,13,31,0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.06);
        }

        /* feature card hover */
        .feature-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 0 30px rgba(108,92,231,0.25);
            border-color: rgba(108,92,231,0.4) !important;
        }

        /* stat number */
        .stat-num {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
            background: linear-gradient(135deg, #a78bfa, #6c5ce7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* floating shapes */
        @keyframes floatA {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes floatB {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(16px) rotate(-4deg); }
        }
        @keyframes floatC {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-14px) scale(1.05); }
        }
        @keyframes glowPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
        }
        @keyframes drawLine {
            from { stroke-dashoffset: 1000; }
            to { stroke-dashoffset: 0; }
        }

        .float-a { animation: floatA 6s ease-in-out infinite; }
        .float-b { animation: floatB 8s ease-in-out infinite; }
        .float-c { animation: floatC 7s ease-in-out infinite; }
        .float-d { animation: floatA 9s ease-in-out infinite reverse; }
        .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }

        /* hero buttons */
        .hero-btn-owner {
            background: #ffffff;
            color: #0d0d1f;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            transition: all 0.25s ease;
            white-space: nowrap;
        }
        .hero-btn-owner:hover {
            background: #e8e8ff;
            box-shadow: 0 4px 20px rgba(255,255,255,0.2);
            transform: translateY(-1px);
        }
        .hero-btn-member {
            background: linear-gradient(135deg, #6c5ce7, #4f46e5);
            color: white;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            transition: all 0.25s ease;
            white-space: nowrap;
        }
        .hero-btn-member:hover {
            background: linear-gradient(135deg, #7c6cf7, #5f56f5);
            box-shadow: 0 4px 24px rgba(108,92,231,0.45);
            transform: translateY(-1px);
        }

        /* navbar */
        .nav-glass {
            background: rgba(7,7,20,0.88);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(108,92,231,0.12);
        }

        /* step connector */
        .step-line {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            transition: stroke-dashoffset 1.5s ease;
        }
        .step-line.active {
            stroke-dashoffset: 0;
        }

        /* hero image */
        .hero-img-container {
            position: relative;
            width: 100%;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 80px rgba(108,92,231,0.25), 0 0 0 1px rgba(108,92,231,0.12);
        }
        .hero-img-container::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom,
                transparent 55%,
                rgba(7,7,20,0.6) 80%,
                rgba(7,7,20,0.95) 100%);
            pointer-events: none;
        }
        .hero-img-container img {
            width: 100%;
            height: auto;
            display: block;
            object-fit: cover;
            transition: transform 0.6s ease;
        }
        .hero-img-container:hover img {
            transform: scale(1.015);
        }

        @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-up {
            animation: heroFadeUp 0.8s ease forwards;
        }
    `}</style>
);



/* ─── Feature Card ─────────────────────────────────────────── */
const features = [
    { icon: <Users size={24} />, title: 'Member Management', desc: 'Add, track, and manage all members in one place. Profiles, photos, plans — everything organised.' },
    { icon: <IndianRupee size={24} />, title: 'Fee & Revenue Tracking', desc: 'Never miss a payment or renewal. Track dues, receipts and monthly revenue at a glance.' },
    { icon: <Bell size={24} />, title: 'Plan & Expiry Alerts', desc: 'Auto-alerts before memberships expire — push notifications keep owners and members in sync.' },
    { icon: <BarChart3 size={24} />, title: 'Analytics Dashboard', desc: 'Visual insights into your gym\'s growth, retention, and revenue trends over time.' },
    { icon: <Smartphone size={24} />, title: 'Member PWA Portal', desc: 'Members check progress, earn badges, view health data — all from their phone, no app install needed.' },
    { icon: <Shield size={24} />, title: 'Secure & Reliable', desc: 'Role-based access, encrypted data, 99.9% uptime. Your gym data is always safe and available.' },
];

const FeatureCard = ({ icon, title, desc, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        className="feature-card glass-card rounded-2xl p-6 flex flex-col gap-4"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent-soft)' }}>
            {icon}
        </div>
        <div>
            <h3 className="font-poppins font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="font-poppins text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
        </div>
    </motion.div>
);

/* ─── Dashboard Mockup Card ────────────────────────────────── */
const DashboardMockup = () => {
    const cardRef = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [8, -8]);
    const rotateY = useTransform(x, [-100, 100], [-8, 8]);

    const handleMouse = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    }, [x, y]);

    const handleLeave = useCallback(() => {
        x.set(0); y.set(0);
    }, [x, y]);

    const members = [
        { name: 'Rahul Patil', plan: 'Premium', status: 'active', days: 22 },
        { name: 'Sneha More', plan: 'Basic', status: 'expiring', days: 3 },
        { name: 'Amit Desai', plan: 'Annual', status: 'active', days: 180 },
    ];

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
            className="relative w-full max-w-sm mx-auto md:mx-0"
        >
            {/* Glow behind card */}
            <div className="absolute inset-0 rounded-2xl glow-pulse" style={{
                background: 'radial-gradient(ellipse at center, rgba(108,92,231,0.35) 0%, transparent 70%)',
                transform: 'scale(1.15) translateY(8px)',
                filter: 'blur(20px)',
                zIndex: 0,
            }} />

            <div className="relative glass-card rounded-2xl p-5 z-10" style={{ border: '1px solid rgba(108,92,231,0.3)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="font-poppins text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>OWNER DASHBOARD</p>
                        <p className="font-poppins text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>PowerHouse Gym, Pune</p>
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)', boxShadow: '0 0 8px #10b981' }} />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Active Members', val: '142', color: '#a78bfa' },
                        { label: 'Renewals Due', val: '8', color: '#f59e0b' },
                        { label: 'Revenue', val: '₹1.24L', color: '#10b981' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="font-mono-num text-lg font-bold leading-tight" style={{ color: s.color }}>{s.val}</p>
                            <p className="font-poppins text-[9px] mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Mini list */}
                <p className="font-poppins text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Recent Members</p>
                <div className="flex flex-col gap-2">
                    {members.map((m) => (
                        <div key={m.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: 'rgba(108,92,231,0.25)', color: 'var(--accent-soft)' }}>
                                    {m.name[0]}
                                </div>
                                <div>
                                    <p className="font-poppins text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                                    <p className="font-poppins text-[9px]" style={{ color: 'var(--text-muted)' }}>{m.plan}</p>
                                </div>
                            </div>
                            <span className="font-poppins text-[9px] px-2 py-0.5 rounded-full font-medium" style={{
                                background: m.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                color: m.status === 'active' ? '#10b981' : '#f59e0b',
                            }}>
                                {m.status === 'active' ? `${m.days}d left` : `⚠️ ${m.days}d`}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Mini bar chart */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="font-poppins text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Revenue (Last 6 Months)</p>
                    <div className="flex items-end gap-1.5 h-14">
                        {[55, 72, 60, 88, 79, 100].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 0.8, delay: 0.8 + i * 0.1, ease: 'easeOut' }}
                                className="flex-1 rounded-sm"
                                style={{ background: i === 5 ? 'var(--accent)' : 'rgba(108,92,231,0.3)' }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ─── Floating Fitness Icons (ambient) ─────────────────────── */
const AmbientIcon = ({ children, style, className }) => (
    <div className={`absolute pointer-events-none ${className}`} style={{ color: 'rgba(108,92,231,0.2)', ...style }}>
        {children}
    </div>
);

/* ─── How It Works Step ─────────────────────────────────────── */
const steps = [
    { num: '01', icon: <Crown size={28} />, title: 'Create Your Gym', desc: 'Sign up as an owner, fill in your gym profile, set your membership plans in minutes.' },
    { num: '02', icon: <Users size={28} />, title: 'Add Your Members', desc: 'Import or add members individually with their plans, fees, and contact details.' },
    { num: '03', icon: <TrendingUp size={28} />, title: 'Track Everything', desc: 'Your real-time dashboard gives full visibility — renewals, revenue, attendance, growth.' },
];

const StepCard = ({ step, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, delay: index * 0.2 }}
        className="relative flex flex-col items-center text-center md:items-start md:text-left"
    >
        {/* Big faded step number */}
        <div className="font-bebas absolute -top-8 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 text-8xl font-bold select-none pointer-events-none" style={{ color: 'rgba(108,92,231,0.08)', fontSize: '7rem', lineHeight: 1 }}>
            {step.num}
        </div>
        <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', color: 'var(--accent-soft)' }}>
            {step.icon}
        </div>
        <h3 className="font-poppins font-bold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
        <p className="font-poppins text-sm leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: '260px' }}>{step.desc}</p>
    </motion.div>
);

/* ─── Dumbbell SVG ─────────────────────────────────────────── */
const DumbbellSVG = ({ size = 80, opacity = 0.15 }) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <rect x="0" y="20" width="16" height="20" rx="4" fill="currentColor" />
        <rect x="16" y="24" width="8" height="12" rx="2" fill="currentColor" />
        <rect x="96" y="24" width="8" height="12" rx="2" fill="currentColor" />
        <rect x="104" y="20" width="16" height="20" rx="4" fill="currentColor" />
        <rect x="24" y="28" width="72" height="4" rx="2" fill="currentColor" />
    </svg>
);

/* ─── ECG Pulse SVG ─────────────────────────────────────────── */
const ECGLine = ({ size = 120 }) => (
    <svg width={size} height={size * 0.35} viewBox="0 0 200 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.2 }}>
        <polyline
            points="0,35 30,35 45,35 55,10 65,60 75,35 85,35 100,5 115,65 125,35 140,35 170,35 200,35"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
    </svg>
);

/* ═══════════════════════════════════════════════════════════ */
/*                    MAIN LANDING PAGE                        */
/* ═══════════════════════════════════════════════════════════ */
const LandingPage = () => {
    const { user, token, loading } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);

    // ── Auto-redirect authenticated users straight to their dashboard ──────
    // This is the core "no daily login" UX: AuthContext.loadUser() silently
    // restores the session from the 30-day httpOnly cookie.  By the time the
    // landing page renders, the session is already hydrated.
    useEffect(() => {
        if (!loading && token && user) {
            if (user.role === 'member') {
                navigate('/member/dashboard', { replace: true });
            } else if (user.role === 'owner') {
                navigate(user.hasGym ? '/dashboard' : '/gym-setup', { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            }
        }
    }, [loading, token, user, navigate]);

    useEffect(() => {
        const onScroll = () => setNavScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Still restoring session — render nothing to avoid flicker
    if (loading) return null;

    return (
        <>
            <GoogleFontsStyle />
            <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>

                {/* ══════════════════════════════════════════
                    1. STICKY NAVBAR
                ══════════════════════════════════════════ */}
                <motion.nav
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="nav-glass fixed top-0 left-0 right-0 z-50"
                    style={{ boxShadow: navScrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none' }}
                >
                    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <Link to="/" className="flex items-center gap-2 shrink-0">
                                <img src="/app_logo.png" alt="माझी जिम" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
                            </Link>

                            {/* Desktop CTAs */}
                            <div className="hidden md:flex items-center gap-3">
                                <Link
                                    to="/login"
                                    id="nav-owner-login"
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl font-poppins font-semibold text-sm transition-all"
                                    style={{ border: '1px solid rgba(108,92,231,0.4)', color: 'var(--accent-soft)', background: 'transparent' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,92,231,0.1)'; e.currentTarget.style.borderColor = 'rgba(108,92,231,0.7)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(108,92,231,0.4)'; }}
                                >
                                    <Crown size={15} /> Owner Login
                                </Link>
                                <Link
                                    to="/member/find-gym"
                                    id="nav-member-portal"
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl font-poppins font-semibold text-sm transition-all"
                                    style={{ background: 'linear-gradient(135deg, #6c5ce7, #4f46e5)', color: 'white', boxShadow: '0 0 16px rgba(108,92,231,0.3)' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(108,92,231,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(108,92,231,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <User size={15} /> Member Portal
                                </Link>
                            </div>

                            {/* Mobile Hamburger */}
                            <button
                                className="md:hidden p-2 rounded-lg"
                                style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)' }}
                                onClick={() => setMobileMenuOpen(v => !v)}
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>

                        {/* Mobile menu */}
                        <AnimatePresence>
                            {mobileMenuOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden md:hidden"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <div className="flex flex-col gap-3 py-4">
                                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl font-poppins font-semibold text-sm" style={{ border: '1px solid rgba(108,92,231,0.4)', color: 'var(--accent-soft)' }}>
                                            <Crown size={15} /> Owner Login
                                        </Link>
                                        <Link to="/member/find-gym" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl font-poppins font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #6c5ce7, #4f46e5)', color: 'white' }}>
                                            <User size={15} /> Member Portal
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.nav>

                {/* ══════════════════════════════════════════
                    2. HERO SECTION
                ══════════════════════════════════════════ */}
                <section
                    className="animated-grid relative"
                    style={{ overflow: 'hidden', paddingTop: '64px' }}
                >
                    {/* Background glow blobs */}
                    <div className="absolute pointer-events-none" style={{
                        width: '900px', height: '600px',
                        background: 'radial-gradient(ellipse at center, rgba(108,92,231,0.14) 0%, transparent 70%)',
                        top: '10%', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 0,
                    }} />
                    <div className="absolute pointer-events-none" style={{
                        width: '500px', height: '500px',
                        background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.1) 0%, transparent 70%)',
                        bottom: '0', right: '10%',
                        zIndex: 0,
                    }} />

                    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0', width: '100%', position: 'relative', zIndex: 1 }}>

                        {/* ── Hero Image FIRST ── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="hero-img-container"
                            style={{
                                borderRadius: '0',
                                boxShadow: '0 10px 60px rgba(108,92,231,0.18)',
                            }}
                        >
                            <img
                                src="/hero_image.png"
                                alt="माझी जिम — Gym Management Dashboard Preview"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    objectFit: 'cover',
                                    objectPosition: 'top center',
                                }}
                                loading="eager"
                            />
                            {/* Bottom gradient to blend into text block below */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '40%',
                                background: 'linear-gradient(to bottom, transparent 0%, rgba(7,7,20,0.7) 75%, var(--bg) 100%)',
                                pointerEvents: 'none',
                                zIndex: 2,
                            }} />
                        </motion.div>

                        {/* ── Text + CTA Block BELOW image ── */}
                        <div className="text-center" style={{ padding: '48px 20px 60px' }}>
                            {/* Brand badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                                style={{ background: 'rgba(108,92,231,0.12)', border: '1px solid rgba(108,92,231,0.28)' }}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                                <span className="font-poppins text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-soft)' }}>
                                    India's #1 Gym Management Platform
                                </span>
                            </motion.div>

                            {/* Main heading */}
                            <motion.h1
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.5 }}
                                className="font-poppins font-extrabold"
                                style={{
                                    fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
                                    lineHeight: 1.12,
                                    letterSpacing: '-0.02em',
                                    marginBottom: '16px',
                                }}
                            >
                                <span style={{ color: 'var(--text-primary)' }}>Built for </span>
                                <span style={{
                                    background: 'linear-gradient(135deg, #a78bfa 0%, #6c5ce7 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>Gym Owners.</span>
                                <span style={{ color: 'var(--text-primary)' }}> Loved by </span>
                                <span style={{ color: '#10b981' }}>Members.</span>
                            </motion.h1>

                            {/* Subheading */}
                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="font-poppins"
                                style={{
                                    fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.75,
                                    maxWidth: '560px',
                                    margin: '0 auto 32px',
                                }}
                            >
                                One platform to manage members, track fees, send renewal alerts, and grow your gym — effortlessly.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                                style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}
                            >
                                <Link
                                    to="/login"
                                    id="hero-owner-login"
                                    className="hero-btn-owner inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm"
                                    aria-label="Gym Owner Login"
                                >
                                    <Crown size={17} />
                                    <span>Owner Login</span>
                                </Link>
                                <Link
                                    to="/member/find-gym"
                                    id="hero-member-portal"
                                    className="hero-btn-member inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm"
                                    aria-label="Gym Member Portal"
                                >
                                    <User size={17} />
                                    <span>Member Portal</span>
                                </Link>
                            </motion.div>

                            {/* Trust chips */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.85 }}
                                style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}
                            >
                                {['✅ Free to Start', '📱 Works on Any Device', '🔒 Data Secure', '🇮🇳 Made in India'].map(t => (
                                    <span
                                        key={t}
                                        className="font-poppins text-xs px-3 py-1.5 rounded-full"
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        {t}
                                    </span>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>



                {/* ══════════════════════════════════════════
                    4. FEATURES SECTION
                ══════════════════════════════════════════ */}
                <section style={{ padding: '100px 20px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <p className="font-poppins text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent-soft)' }}>Features</p>
                            <h2 className="font-poppins font-bold mb-4" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', color: 'var(--text-primary)', lineHeight: 1.15 }}>
                                Everything you need to <span style={{ color: 'var(--accent-soft)' }}>manage & grow.</span>
                            </h2>
                            <p className="font-poppins" style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                                Everything you need to run a modern, digital gym — under one roof.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {features.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    5. HOW IT WORKS
                ══════════════════════════════════════════ */}
                <section style={{ padding: '80px 20px', background: 'rgba(13,13,31,0.5)' }}>
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-20"
                        >
                            <p className="font-poppins text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent-soft)' }}>How It Works</p>
                            <h2 className="font-poppins font-bold" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', color: 'var(--text-primary)', lineHeight: 1.15 }}>
                                3 Steps to a <span style={{ color: 'var(--accent-soft)' }}>Smarter Gym</span>
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative">
                            {/* Connecting dashed line (desktop only) */}
                            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 pointer-events-none" style={{ height: '2px', top: '32px' }}>
                                <svg width="100%" height="2" viewBox="0 0 600 2" preserveAspectRatio="none">
                                    <line x1="0" y1="1" x2="600" y2="1" stroke="rgba(108,92,231,0.25)" strokeWidth="1.5" strokeDasharray="8 6" />
                                </svg>
                            </div>
                            {steps.map((step, i) => <StepCard key={step.num} step={step} index={i} />)}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    6. AMBIENT FITNESS SECTION
                ══════════════════════════════════════════ */}
                <section style={{ padding: '100px 20px', background: 'linear-gradient(135deg, #08082a 0%, #0d0d1f 50%, #0a0a20 100%)', position: 'relative', overflow: 'hidden' }}>
                    {/* Particle dots */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                width: Math.random() > 0.5 ? 4 : 3,
                                height: Math.random() > 0.5 ? 4 : 3,
                                borderRadius: '50%',
                                background: 'rgba(108,92,231,0.6)',
                                left: `${8 + i * 8}%`,
                                top: `${15 + (i % 5) * 15}%`,
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {/* Floating fitness icons */}
                    <div className="float-a absolute left-8 top-12 pointer-events-none hidden md:block" style={{ color: 'rgba(108,92,231,0.12)' }}>
                        <DumbbellSVG size={120} opacity={1} />
                    </div>
                    <div className="float-b absolute right-8 bottom-12 pointer-events-none hidden md:block" style={{ color: 'rgba(108,92,231,0.1)' }}>
                        <Target size={80} />
                    </div>
                    <div className="float-c absolute right-24 top-16 pointer-events-none hidden lg:block" style={{ color: 'rgba(167,139,250,0.1)' }}>
                        <Activity size={64} />
                    </div>
                    <div className="float-d absolute left-24 bottom-8 pointer-events-none hidden lg:block" style={{ color: 'rgba(108,92,231,0.08)' }}>
                        <Award size={64} />
                    </div>

                    <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center mb-14"
                        >
                            <h2 className="font-poppins font-bold mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                Not just management.{' '}
                                <span style={{ color: 'var(--accent-soft)' }}>A fitness ecosystem.</span>
                            </h2>
                            <p className="font-poppins" style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7 }}>
                                माझी जिम gives your members a portal they'll actually love to use.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <TrendingUp size={28} />, title: 'Progress Tracker',
                                    desc: 'Members log workouts, track weight, and visualise their fitness journey over weeks and months.',
                                    color: '#6c5ce7',
                                },
                                {
                                    icon: <Award size={28} />, title: 'Badges & Achievements',
                                    desc: 'Gamified milestones keep members motivated — first check-in, 30-day streak, plan renewal and more.',
                                    color: '#f59e0b',
                                },
                            ].map((card, i) => (
                                <motion.div
                                    key={card.title}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.15 }}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="glass-card rounded-2xl p-8 flex gap-5 items-start"
                                    style={{ border: `1px solid rgba(255,255,255,0.07)`, cursor: 'default' }}
                                >
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${card.color}22`, color: card.color, border: `1px solid ${card.color}44` }}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-poppins font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                                        <p className="font-poppins text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{card.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    7. DUAL CTA SECTION
                ══════════════════════════════════════════ */}
                <section style={{ padding: '100px 20px' }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-12"
                        >
                            <h2 className="font-poppins font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                Choose your <span style={{ color: 'var(--accent-soft)' }}>login path</span>
                            </h2>
                            <p className="font-poppins text-sm mt-3" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Select the option that applies to you to get started.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* GYM OWNER CARD */}
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(255,255,255,0.08)' }}
                                className="glass-card rounded-3xl p-10 flex flex-col items-start gap-5"
                                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', color: '#f0f0ff' }}>
                                    <Crown size={32} />
                                </div>
                                <div>
                                    <h3 className="font-poppins font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>Gym Owner</h3>
                                    <p className="font-poppins text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                        Manage members, track revenue, control renewals — all from a powerful dashboard built for you.
                                    </p>
                                </div>
                                <Link
                                    to="/login"
                                    id="cta-owner-login"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-poppins font-semibold text-sm transition-all mt-auto"
                                    style={{ background: '#ffffff', color: '#0d0d1f' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#e8e8ff'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    Start Managing <ChevronRight size={16} />
                                </Link>
                            </motion.div>

                            {/* GYM MEMBER CARD */}
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(108,92,231,0.4)' }}
                                className="rounded-3xl p-10 flex flex-col items-start gap-5"
                                style={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #4f46e5 60%, #3730a3 100%)', border: '1px solid rgba(255,255,255,0.15)' }}
                            >
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                    <User size={32} color="white" />
                                </div>
                                <div>
                                    <h3 className="font-poppins font-bold text-2xl mb-2" style={{ color: 'white' }}>Gym Member</h3>
                                    <p className="font-poppins text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                        Access your portal, check membership status, track your fitness progress, and earn badges.
                                    </p>
                                </div>
                                <Link
                                    to="/member/find-gym"
                                    id="cta-member-portal"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-poppins font-semibold text-sm transition-all mt-auto"
                                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    Find My Gym <ChevronRight size={16} />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    8. FOOTER
                ══════════════════════════════════════════ */}
                <footer style={{ background: '#050510', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '50px 20px 30px' }}>
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-10">
                            {/* Logo + tagline */}
                            <div className="flex flex-col items-center md:items-start gap-3">
                                <img src="/app_logo.png" alt="माझी जिम" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                                <p className="font-marathi-body text-sm" style={{ color: 'var(--text-muted)' }}>
                                    माझी जिम — Made with ❤️ for Indian Gyms
                                </p>
                            </div>

                            {/* Links */}
                            <div className="flex flex-wrap items-center gap-6 justify-center">
                                {[
                                    { label: 'Privacy Policy', to: '/privacy' },
                                    { label: 'Terms of Service', to: '/terms' },
                                    { label: 'Contact Us', to: '/contact' },
                                    { label: 'Owner Login', to: '/login' },
                                    { label: 'Member Portal', to: '/member/find-gym' },
                                ].map(link => (
                                    <Link
                                        key={link.label}
                                        to={link.to}
                                        className="font-poppins text-sm transition-colors"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-soft)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Bottom bar */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }} className="flex flex-col md:flex-row items-center justify-between gap-3">
                            <p className="font-poppins text-xs" style={{ color: 'rgba(107,114,128,0.7)' }}>
                                © 2026 माझी जिम. All rights reserved.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="font-poppins text-xs" style={{ color: 'rgba(107,114,128,0.5)' }}>Built in</span>
                                <span className="font-mono-num text-xs font-semibold" style={{ color: 'var(--accent-soft)' }}>भारत 🇮🇳</span>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
};

export default LandingPage;
