import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Users, IndianRupee, Bell, BarChart3, Smartphone, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

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
        className="glass-card rounded-2xl p-6 flex flex-col gap-4"
        style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
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

export default function Features() {
    const navigate = useNavigate();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                
                .features-page-theme {
                    --bg: #070714;
                    --text-primary: #f0f0ff;
                    --text-muted: #6b7280;
                    --accent-soft: #a78bfa;
                }
            `}</style>

            <div className="features-page-theme" style={{
                minHeight: '100vh',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                fontFamily: "'Poppins', sans-serif",
                padding: '0 0 60px 0',
            }}>
                <Helmet>
                    <title>Features – Majhi Gym</title>
                    <meta name="description" content="Discover the powerful features of Majhi Gym, the smart gym management platform. Members, attendance, fees, reminders, workouts, reports, and more." />
                    <link rel="canonical" href="https://majhigym.com/features" />
                </Helmet>

                {/* Subtle background glow */}
                <div style={{
                    position: 'fixed',
                    top: '-20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(108,92,231,0.15) 0%, rgba(15,15,26,0) 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />
                
                <div style={{ position: 'relative', zIndex: 10 }}>
                    {/* Top Navigation Bar */}
                    <div style={{
                        background: 'rgba(15, 15, 26, 0.75)',
                        borderBottom: '1px solid rgba(108, 92, 231, 0.15)',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        backdropFilter: 'blur(20px)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    color: '#cbd5e1',
                                    padding: '8px 14px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.color = '#cbd5e1';
                                }}
                            >
                                <ArrowLeft size={14} /> Back to Home
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
                                <img
                                    src="/logo.svg"
                                    alt="Majhi Gym"
                                    style={{ height: '28px', width: 'auto', objectFit: 'contain', display: 'block' }}
                                />
                                <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Majhi Gym <span style={{ fontSize: '11px', background: 'rgba(108,92,231,0.25)', color: '#a5b4fc', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, letterSpacing: '0' }}>Features</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Header Section */}
                    <section style={{ padding: '80px 20px 40px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <p className="font-poppins text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--accent-soft)' }}>Majhi Gym Features</p>
                            <h2 className="font-poppins font-bold mb-4" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', color: 'var(--text-primary)', lineHeight: 1.15 }}>
                                Everything you need to <span style={{ color: 'var(--accent-soft)' }}>manage & grow.</span>
                            </h2>
                            <p className="font-poppins" style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                                Majhi Gym is the ultimate toolkit designed to run a modern, digital gym — under one roof. No more excel sheets, just pure efficiency.
                            </p>
                        </motion.div>
                    </section>

                    {/* Features Grid */}
                    <section style={{ padding: '20px 20px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {features.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
                        </div>
                    </section>

                    {/* Footer */}
                    <div style={{
                        maxWidth: '850px',
                        margin: '50px auto 0',
                        padding: '24px',
                        background: 'rgba(108,92,231,0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(108,92,231,0.12)',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                    }}>
                        <strong>Majhi Gym</strong> is a product of <strong>Trackon Gym Management</strong> · Made in India 🇮🇳<br />
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'inline-block' }}>
                            © 2026 Trackon Gym Management. All rights reserved.
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
