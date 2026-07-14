import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Users, Zap, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
    const navigate = useNavigate();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                
                .about-page-theme {
                    --bg: #070714;
                    --text-primary: #f0f0ff;
                    --text-muted: #6b7280;
                }
            `}</style>
            <div className="about-page-theme" style={{
                minHeight: '100vh',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                fontFamily: "'Poppins', sans-serif",
                padding: '0 0 60px 0',
            }}>
                <Helmet>
                    <title>About Us – Majhi Gym</title>
                    <meta name="description" content="Learn about Majhi Gym, the smart gym management platform built for gym owners and loved by gym members." />
                    <link rel="canonical" href="https://majhigym.com/about" />
                </Helmet>

                {/* Subtle background glow */}
                <div style={{
                    position: 'fixed',
                    top: '-20%',
                    left: '-10%',
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
                                    Majhi Gym <span style={{ fontSize: '11px', background: 'rgba(108,92,231,0.25)', color: '#a5b4fc', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, letterSpacing: '0' }}>About Us</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Section */}
                    <section style={{ padding: '80px 20px 40px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 style={{
                                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                                fontWeight: 800,
                                marginBottom: '20px',
                                background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.02em'
                            }}>
                                Empowering Indian Gyms.
                            </h1>
                            <p style={{
                                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                                color: 'var(--text-muted)',
                                lineHeight: 1.7,
                                maxWidth: '650px',
                                margin: '0 auto'
                            }}>
                                Majhi Gym is more than just software. It's a comprehensive ecosystem designed specifically for Indian gym owners to automate management, boost revenue, and provide members with a world-class digital fitness experience.
                            </p>
                        </motion.div>
                    </section>

                    {/* Core Values Section */}
                    <section style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="glass-card rounded-2xl p-8"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(108,92,231,0.15)', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <Users size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>Built for Owners & Members</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                    We bridge the gap between gym administration and member engagement. Owners get powerful insights and automation, while members get a beautiful PWA to track attendance, diets, and progress.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="glass-card rounded-2xl p-8"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <Zap size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>Lightning Fast & Modern</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                    No more slow, clunky legacy software. Majhi Gym is built on cutting-edge web technologies ensuring lightning-fast load times, instantaneous data sync, and a buttery-smooth UI on any device.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="glass-card rounded-2xl p-8"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>Uncompromising Security</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                    Your business data is your most valuable asset. We employ military-grade encryption, secure JWT token architecture, and strict role-based access controls to keep your gym's data 100% safe.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="glass-card rounded-2xl p-8"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236,72,153,0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <Heart size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>Made with ❤️ in India</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                    Proudly developed in Kolhapur, Maharashtra. We understand the unique challenges faced by Indian gym owners and are constantly evolving our platform to solve real-world problems.
                                </p>
                            </motion.div>
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
