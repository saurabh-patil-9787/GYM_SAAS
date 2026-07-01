import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, RefreshCw, Zap, MessageCircle, LogOut, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import api from '../../api/axios';

/**
 * PlanExpiredPage
 * Full-screen block shown inside MemberLayout when a member's plan is expired.
 * Header (with gym logo, name, notification bell) is still rendered by MemberLayout above this.
 * Bottom nav is hidden by MemberLayout when this is shown.
 */
const PlanExpiredPage = ({ gym, expiryDate, onLogout }) => {
    const navigate = useNavigate();
    const [pendingRequest, setPendingRequest] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // ── Check if member already has a pending Fresh Start request ────────────
    useEffect(() => {
        api.get('/api/member/renewal/status')
            .then(res => {
                if (res.data?.hasPendingRequest) {
                    setPendingRequest(res.data.request);
                }
            })
            .catch(() => {})
            .finally(() => setStatusLoading(false));
    }, []);

    const expiredDateStr = expiryDate
        ? new Date(expiryDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
          })
        : null;

    const gymName   = gym?.gymName || '';
    const gymLogo   = gym?.logoUrl || null;
    const gymPhone  = gym?.contactNumber || null;

    const whatsappLink = gymPhone
        ? `https://wa.me/91${gymPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Hi ${gymName}, my gym plan has expired. I would like to renew my membership.`
          )}`
        : null;

    // ── Navigate to the plans page with the appropriate action ───────────────
    const handleContinuePlan = () => {
        navigate('/member/plans?action=continue');
    };

    const handleFreshStart = async () => {
        // Check if there's already a pending request
        if (pendingRequest) return;
        navigate('/member/plans?action=fresh-start');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-member-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background ambient glows */}
            <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(108,92,231,0.06) 0%, transparent 70%)' }} />

            <div className="w-full max-w-sm relative z-10">

                {/* ── Expired Icon ─────────────────────────────────────────── */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex justify-center mb-6"
                >
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.08) 100%)',
                            border: '1px solid rgba(244,63,94,0.25)',
                            boxShadow: '0 0 32px rgba(244,63,94,0.12)'
                        }}>
                        <Calendar size={36} className="text-member-rose" strokeWidth={1.5} />
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-member-rose flex items-center justify-center shadow-lg">
                            <span className="text-white text-[10px] font-bold">!</span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Message Card ─────────────────────────────────────────── */}
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="member-card mb-4 text-center"
                    style={{ border: '1px solid rgba(244,63,94,0.18)', boxShadow: '0 4px 24px rgba(244,63,94,0.08)' }}
                >
                    <h1 className="text-xl font-bold text-member-rose mb-2 font-syne">
                        Plan Expired
                    </h1>

                    {expiredDateStr && (
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Clock size={13} className="text-member-muted flex-shrink-0" />
                            <p className="text-sm text-[#8888a8]">
                                Your plan expired on{' '}
                                <span className="text-[#f0f0f8] font-semibold">{expiredDateStr}</span>
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-[#8888a8] leading-relaxed">
                        Please renew your membership to continue accessing the portal.
                        {gymName ? (
                            <> Contact <span className="text-[#f0f0f8] font-semibold">{gymName}</span> for assistance.</>
                        ) : null}
                    </p>

                    {/* Gym branding (small chip) */}
                    {(gymLogo || gymName) && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-member-border">
                            {gymLogo && (
                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600">
                                    <img src={gymLogo} alt={gymName} className="w-full h-full object-cover" />
                                </div>
                            )}
                            {gymName && (
                                <span className="text-xs font-semibold text-[#8888a8]">{gymName}</span>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* ── Pending Fresh Start Banner ────────────────────────────── */}
                <AnimatePresence>
                    {!statusLoading && pendingRequest && (
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 rounded-[14px] p-[14px] flex items-start gap-3"
                            style={{
                                background: 'rgba(245,158,11,0.10)',
                                border: '1px solid rgba(245,158,11,0.22)'
                            }}
                        >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(245,158,11,0.18)' }}>
                                <Clock size={14} className="text-member-amber" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-member-amber">Fresh Start Request Pending</p>
                                <p className="text-[11px] text-[#8888a8] mt-0.5 leading-relaxed">
                                    Your request for{' '}
                                    <span className="text-[#f0f0f8] font-semibold">{pendingRequest.planName}</span>{' '}
                                    is awaiting owner approval. You'll be notified once approved.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Success Message ───────────────────────────────────────── */}
                <AnimatePresence>
                    {successMsg && (
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 rounded-[14px] p-[14px] flex items-start gap-3"
                            style={{
                                background: 'rgba(0,201,122,0.10)',
                                border: '1px solid rgba(0,201,122,0.22)'
                            }}
                        >
                            <CheckCircle2 size={16} className="text-member-emerald mt-0.5 flex-shrink-0" />
                            <p className="text-[12px] text-member-emerald font-semibold">{successMsg}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Action Buttons ────────────────────────────────────────── */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    {!pendingRequest && (
                        <>
                            {/* Continue Plan */}
                            <button
                                onClick={handleContinuePlan}
                                className="member-btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={15} />
                                Continue Plan (Renew)
                            </button>

                            {/* Start Fresh */}
                            <button
                                onClick={handleFreshStart}
                                disabled={statusLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(234,88,12,0.15) 100%)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    color: '#f59e0b'
                                }}
                            >
                                <Zap size={15} />
                                Start Fresh (New Join Date)
                            </button>

                            {/* Start Fresh explanation */}
                            <p className="text-[10px] text-[#555568] text-center leading-relaxed px-2">
                                Start Fresh sends a request to the gym owner to begin your plan from a new date.
                            </p>
                        </>
                    )}

                    {/* WhatsApp Contact */}
                    {whatsappLink && (
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                            style={{
                                background: 'rgba(0,201,122,0.10)',
                                border: '1px solid rgba(0,201,122,0.22)',
                                color: '#00c97a'
                            }}
                        >
                            <MessageCircle size={15} />
                            Contact {gymName || 'Gym'} on WhatsApp
                        </a>
                    )}

                    {/* Logout */}
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#555568'
                        }}
                    >
                        <LogOut size={13} />
                        Logout
                    </button>
                </motion.div>

                {/* ── Info Note ─────────────────────────────────────────────── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-[10px] text-[#555568] mt-6 leading-relaxed px-4"
                >
                    💡 Once your membership is renewed (by you or the gym owner), you'll be able to access the full portal automatically.
                </motion.p>
            </div>
        </div>
    );
};

export default PlanExpiredPage;
