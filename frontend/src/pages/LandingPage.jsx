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
        @keyframes floatD {
            0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
            33% { transform: translateY(-18px) rotate(8deg) scale(1.08); }
            66% { transform: translateY(10px) rotate(-5deg) scale(0.95); }
        }
        @keyframes floatE {
            0%, 100% { transform: translateX(0px) rotate(0deg); }
            50% { transform: translateX(-16px) rotate(-6deg); }
        }
        @keyframes floatF {
            0%, 100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
            50% { transform: translateX(14px) translateY(-12px) rotate(10deg); }
        }
        @keyframes glowPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
        }
        @keyframes drawLine {
            from { stroke-dashoffset: 1000; }
            to { stroke-dashoffset: 0; }
        }
        @keyframes heroIconPop {
            0% { opacity: 0; transform: scale(0.5) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0px); }
        }
        @keyframes orbitGlow {
            0%, 100% { box-shadow: 0 0 12px rgba(108,92,231,0.3), 0 0 24px rgba(108,92,231,0.1); }
            50% { box-shadow: 0 0 20px rgba(108,92,231,0.55), 0 0 40px rgba(108,92,231,0.2); }
        }
        @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .float-a { animation: floatA 6s ease-in-out infinite; }
        .float-b { animation: floatB 8s ease-in-out infinite; }
        .float-c { animation: floatC 7s ease-in-out infinite; }
        .float-d { animation: floatD 9s ease-in-out infinite; }
        .float-e { animation: floatE 7.5s ease-in-out infinite; }
        .float-f { animation: floatF 10s ease-in-out infinite; }
        .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
        .orbit-glow { animation: orbitGlow 3s ease-in-out infinite; }
        .spin-slow { animation: spinSlow 20s linear infinite; }

        /* ── Premium Floating Icon Orbs ── */
        .hero-orb {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            pointer-events: none;
            z-index: 10;
            transition: transform 0.3s ease;
        }
        /* Size variants */
        .hero-orb-lg { width: 64px; height: 64px; }
        .hero-orb-md { width: 52px; height: 52px; }
        .hero-orb-sm { width: 42px; height: 42px; }
        /* Color variants */
        .hero-orb-violet {
            background: radial-gradient(135deg at 30% 30%, rgba(139,92,246,0.35) 0%, rgba(109,40,217,0.18) 100%);
            border: 1px solid rgba(139,92,246,0.45);
            box-shadow: 0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.1);
            color: #c4b5fd;
        }
        .hero-orb-amber {
            background: radial-gradient(135deg at 30% 30%, rgba(251,191,36,0.3) 0%, rgba(217,119,6,0.15) 100%);
            border: 1px solid rgba(251,191,36,0.4);
            box-shadow: 0 0 20px rgba(251,191,36,0.28), 0 0 40px rgba(251,191,36,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
            color: #fcd34d;
        }
        .hero-orb-rose {
            background: radial-gradient(135deg at 30% 30%, rgba(244,63,94,0.3) 0%, rgba(190,18,60,0.15) 100%);
            border: 1px solid rgba(244,63,94,0.4);
            box-shadow: 0 0 20px rgba(244,63,94,0.28), 0 0 40px rgba(244,63,94,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
            color: #fda4af;
        }
        .hero-orb-cyan {
            background: radial-gradient(135deg at 30% 30%, rgba(34,211,238,0.25) 0%, rgba(8,145,178,0.12) 100%);
            border: 1px solid rgba(34,211,238,0.35);
            box-shadow: 0 0 20px rgba(34,211,238,0.25), 0 0 40px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
            color: #67e8f9;
        }
        .hero-orb-emerald {
            background: radial-gradient(135deg at 30% 30%, rgba(16,185,129,0.28) 0%, rgba(4,120,87,0.14) 100%);
            border: 1px solid rgba(16,185,129,0.38);
            box-shadow: 0 0 20px rgba(16,185,129,0.25), 0 0 40px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
            color: #6ee7b7;
        }
        /* Animated glow pulse per color */
        @keyframes glowViolet {
            0%,100% { box-shadow: 0 0 16px rgba(139,92,246,0.3), 0 0 32px rgba(139,92,246,0.1); }
            50%      { box-shadow: 0 0 28px rgba(139,92,246,0.55), 0 0 55px rgba(139,92,246,0.2); }
        }
        @keyframes glowAmber {
            0%,100% { box-shadow: 0 0 16px rgba(251,191,36,0.28), 0 0 32px rgba(251,191,36,0.08); }
            50%      { box-shadow: 0 0 28px rgba(251,191,36,0.5), 0 0 55px rgba(251,191,36,0.18); }
        }
        @keyframes glowRose {
            0%,100% { box-shadow: 0 0 16px rgba(244,63,94,0.28), 0 0 32px rgba(244,63,94,0.08); }
            50%      { box-shadow: 0 0 28px rgba(244,63,94,0.5), 0 0 55px rgba(244,63,94,0.18); }
        }
        @keyframes glowCyan {
            0%,100% { box-shadow: 0 0 16px rgba(34,211,238,0.25), 0 0 32px rgba(34,211,238,0.08); }
            50%      { box-shadow: 0 0 28px rgba(34,211,238,0.45), 0 0 55px rgba(34,211,238,0.15); }
        }
        @keyframes glowEmerald {
            0%,100% { box-shadow: 0 0 16px rgba(16,185,129,0.25), 0 0 32px rgba(16,185,129,0.08); }
            50%      { box-shadow: 0 0 28px rgba(16,185,129,0.45), 0 0 55px rgba(16,185,129,0.15); }
        }
        .glow-violet { animation: glowViolet 3.5s ease-in-out infinite; }
        .glow-amber  { animation: glowAmber  4s   ease-in-out infinite; }
        .glow-rose   { animation: glowRose   3s   ease-in-out infinite; }
        .glow-cyan   { animation: glowCyan   4.5s ease-in-out infinite; }
        .glow-emerald{ animation: glowEmerald 3.8s ease-in-out infinite; }

        /* hero wrapper */
        .hero-scene {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 70px 80px;
        }
        @media (max-width: 900px)  { .hero-scene { padding: 60px 60px; } }
        @media (max-width: 640px)  { .hero-scene { padding: 44px 44px; } .hero-orb-lg { width: 48px; height: 48px; } .hero-orb-md { width: 40px; height: 40px; } .hero-orb-sm { width: 34px; height: 34px; } }
        @media (max-width: 420px)  { .hero-orb-hide-xs { display: none; } .hero-scene { padding: 36px 36px; } }

        /* hero image frame */
        .hero-img-frame {
            position: relative;
            width: 100%;
            max-width: 820px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow:
                0 0 0 1px rgba(108,92,231,0.25),
                0 20px 60px rgba(108,92,231,0.22),
                0 0 80px rgba(108,92,231,0.08);
            z-index: 2;
        }
        .hero-img-frame img {
            width: 100%;
            height: auto;
            display: block;
            object-fit: cover;
            object-position: top center;
            border-radius: 20px;
            transition: transform 0.6s ease;
        }
        .hero-img-frame:hover img { transform: scale(1.015); }
        .hero-img-frame::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            background: linear-gradient(to bottom, transparent 55%, rgba(7,7,20,0.7) 85%, rgba(7,7,20,0.98) 100%);
            pointer-events: none;
            z-index: 3;
        }

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
                                <img
                                    src="/app_logo.png"
                                    alt="माझी जिम - Gym Management"
                                    style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }}
                                />
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

                        {/* ── Hero Scene: Premium Floating Icon Orbs ── */}
                        <div className="hero-scene">

                            {/* === 8 Floating Premium Icon Orbs === */}

                            {/* 1. DUMBBELL — top-left, large violet */}
                            <div className="float-a" style={{ position: 'absolute', top: '6%', left: '3%', animationDelay: '0s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-lg hero-orb-violet glow-violet"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.7, delay: 0.6, type: 'spring', stiffness: 220 }}
                                >
                                    <svg width="30" height="15" viewBox="0 0 120 60" fill="currentColor">
                                        <rect x="0" y="18" width="18" height="24" rx="5"/>
                                        <rect x="18" y="23" width="10" height="14" rx="3"/>
                                        <rect x="92" y="23" width="10" height="14" rx="3"/>
                                        <rect x="102" y="18" width="18" height="24" rx="5"/>
                                        <rect x="28" y="27" width="64" height="6" rx="3"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* 2. FLAME — top-right, large amber */}
                            <div className="float-b" style={{ position: 'absolute', top: '5%', right: '3%', animationDelay: '1.2s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-lg hero-orb-amber glow-amber"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.7, delay: 0.8, type: 'spring', stiffness: 220 }}
                                >
                                    <svg width="22" height="28" viewBox="0 0 40 50" fill="currentColor">
                                        <path d="M20 0 C20 0 8 14 8 24 C8 31.7 13.4 38 20 38 C26.6 38 32 31.7 32 24 C32 18 27 12 27 12 C27 12 26 20 22 22 C22 22 28 14 20 0Z"/>
                                        <path d="M20 28 C17 28 14 30.7 14 34 C14 37.3 16.7 40 20 40 C23.3 40 26 37.3 26 34 C26 30.7 23 28 20 28Z" opacity="0.7"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* 3. HEARTBEAT ECG — left-upper, medium rose */}
                            <div className="float-e hero-orb-hide-xs" style={{ position: 'absolute', top: '25%', left: '-8px', animationDelay: '0.6s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-md hero-orb-rose glow-rose"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.7, delay: 1.0, type: 'spring', stiffness: 200 }}
                                >
                                    <svg width="28" height="16" viewBox="0 0 56 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="0,16 10,16 16,16 20,4 26,28 30,16 36,16 40,2 46,30 50,16 56,16"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* 4. KETTLEBELL — left-lower, medium violet */}
                            <div className="float-d hero-orb-hide-xs" style={{ position: 'absolute', bottom: '28%', left: '-8px', animationDelay: '2.2s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-md hero-orb-violet glow-violet"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.7, delay: 1.4, type: 'spring', stiffness: 200 }}
                                >
                                    <svg width="26" height="28" viewBox="0 0 52 56" fill="currentColor">
                                        <circle cx="26" cy="22" r="18"/>
                                        <circle cx="26" cy="22" r="10" fill="rgba(13,13,31,0.7)"/>
                                        <path d="M18 8 Q26 -2 34 8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                                        <rect x="14" y="38" width="24" height="18" rx="6"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* 5. RUNNING FIGURE — right-upper, medium cyan */}
                            <div className="float-c hero-orb-hide-xs" style={{ position: 'absolute', top: '25%', right: '-8px', animationDelay: '1.8s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-md hero-orb-cyan glow-cyan"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.7, delay: 1.2, type: 'spring', stiffness: 200 }}
                                >
                                    <svg width="26" height="28" viewBox="0 0 48 54" fill="currentColor">
                                        <circle cx="30" cy="6" r="6"/>
                                        <path d="M26 14 L16 28 L8 24 M26 14 L30 28 L38 38 M16 28 L10 44 M30 28 L36 44"
                                            stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* 6. BARBELL PLATES — right-lower, medium amber */}
                            <div className="float-f hero-orb-hide-xs" style={{ position: 'absolute', bottom: '28%', right: '-8px', animationDelay: '0.9s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-md hero-orb-amber glow-amber"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.7, delay: 1.6, type: 'spring', stiffness: 200 }}
                                >
                                    <svg width="30" height="18" viewBox="0 0 60 36" fill="currentColor">
                                        <rect x="0" y="10" width="10" height="16" rx="3"/>
                                        <rect x="10" y="13" width="6" height="10" rx="2"/>
                                        <rect x="44" y="13" width="6" height="10" rx="2"/>
                                        <rect x="50" y="10" width="10" height="16" rx="3"/>
                                        <rect x="16" y="16" width="28" height="4" rx="2"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* 7. WATER DROP — bottom-left, small cyan */}
                            <div className="float-a" style={{ position: 'absolute', bottom: '8%', left: '8%', animationDelay: '3s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-sm hero-orb-cyan glow-cyan"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6, delay: 1.8, type: 'spring', stiffness: 240 }}
                                >
                                    <svg width="18" height="22" viewBox="0 0 36 44" fill="currentColor">
                                        <path d="M18 2 C18 2 2 20 2 28 C2 37 9.2 44 18 44 C26.8 44 34 37 34 28 C34 20 18 2 18 2Z"/>
                                        <path d="M10 30 Q14 24 18 30" stroke="rgba(13,13,31,0.5)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* 8. LIGHTNING BOLT — bottom-right, small emerald */}
                            <div className="float-b" style={{ position: 'absolute', bottom: '8%', right: '8%', animationDelay: '2s', zIndex: 10 }}>
                                <motion.div
                                    className="hero-orb hero-orb-sm hero-orb-emerald glow-emerald"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6, delay: 2.0, type: 'spring', stiffness: 240 }}
                                >
                                    <svg width="18" height="24" viewBox="0 0 36 48" fill="currentColor">
                                        <polygon points="22,2 10,26 18,26 14,46 30,18 20,18"/>
                                    </svg>
                                </motion.div>
                            </div>

                            {/* ── The Hero Image (centered, constrained) ── */}
                            <motion.div
                                className="hero-img-frame"
                                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                            >
                                <img
                                    src="/hero_image.png"
                                    alt="माझी जिम — Gym Management Dashboard Preview"
                                    loading="eager"
                                />
                            </motion.div>

                        </div>
                        {/* end hero-scene */}
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
