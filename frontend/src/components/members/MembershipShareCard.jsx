import React, { forwardRef } from 'react';

const fmt = (d) =>
    d
        ? new Date(d).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

const rupee = (v) =>
    `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * MembershipShareCard — Invoice-style membership card.
 *
 * Props:
 *   member       – member data object
 *   gymName      – gym display name
 *   gymLogoUrl   – base64 or URL of gym logo (pass base64 for PWA/CORS safety)
 *   gymMobile    – gym contact number
 *   memberPhotoUrl – base64 or URL of member photo (pass base64 for PWA/CORS safety)
 */
const MembershipShareCard = forwardRef(
    ({ member, gymName, gymLogoUrl, gymMobile, memberPhotoUrl }, ref) => {
        if (!member) return null;

        const due = Math.max(
            0,
            Number(member.totalFee || 0) - Number(member.paidFee || 0)
        );
        const admissionFee = Number(member.admissionFee || 0);
        const fees = Number(member.totalFee || 0) - admissionFee;
        const discount = Number(member.discount || 0);
        const taxableAmount = Number(member.totalFee || 0) - discount;
        const taxAmount = Number(member.tax || 0);
        const finalAmount = taxableAmount + taxAmount;
        const totalPaid = Number(member.paidFee || 0);
        const totalUnpaid = Math.max(0, finalAmount - totalPaid);

        // Photo to display — prefer passed base64, then member.photoUrl
        const photoSrc = memberPhotoUrl || member.photoUrl || null;
        // Logo to display — prefer passed base64, then gymLogoUrl prop
        const logoSrc = gymLogoUrl || null;

        return (
            <div
                ref={ref}
                style={{
                    width: '480px',
                    background: '#ffffff',
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                    border: '1px solid #e2e8f0',
                }}
            >
                {/* ── HEADER: Gym info + logo ── */}
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '18px', fontWeight: '800', color: '#4f46e5', margin: 0, lineHeight: 1.2 }}>
                                {gymName || 'My Gym'}
                            </p>
                            {gymMobile && (
                                <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0', fontWeight: '600' }}>
                                    {gymMobile}
                                </p>
                            )}
                            {member.receiptNo && (
                                <p style={{ fontSize: '12px', color: '#475569', margin: '6px 0 0', fontWeight: '700' }}>
                                    Receipt No. {member.receiptNo}
                                </p>
                            )}
                        </div>

                        {/* Gym logo or GYM icon */}
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: logoSrc ? 'transparent' : '#f1f0ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Gym Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <GymIcon />
                            )}
                        </div>
                    </div>
                </div>

                {/* ── MEMBER SECTION ── */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Member photo */}
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e0e7ff',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #c7d2fe',
                    }}>
                        {photoSrc ? (
                            <img
                                src={photoSrc}
                                alt={member.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <DefaultAvatarIcon name={member.name} />
                        )}
                    </div>

                    <div>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{member.name}</p>
                        {member.memberId && (
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0', fontWeight: '600' }}>
                                Member id : {member.memberId}
                            </p>
                        )}
                        {member.mobile && (
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0', fontWeight: '600' }}>
                                {member.mobile}
                            </p>
                        )}
                        {member.joiningDate && (
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0' }}>
                                Joined : {fmt(member.joiningDate)}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── PLAN DETAILS ── */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                    <Row label="Purchase date" value={fmt(member.joiningDate)} />
                    <Row label="Plan name" value={member.planName || `${member.planDuration || 1} Month${Number(member.planDuration) === 1 ? '' : 's'}`} />
                    <Row label="Start date" value={fmt(member.startDate || member.joiningDate)} />
                    <Row label="Expire date" value={fmt(member.expiryDate)} />
                </div>

                {/* ── FEE BREAKDOWN ── */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                    <FeeRow label="Admission fee" value={rupee(admissionFee)} />
                    <FeeRow label="Fees" value={rupee(member.totalFee)} />
                    <FeeRow label="Discount" value={rupee(discount)} />
                </div>

                {/* ── TAX / TOTALS ── */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                    <FeeRow label="Taxable amount" value={rupee(taxableAmount)} bold />
                    <FeeRow label="Tax amount" value={rupee(taxAmount)} />
                </div>

                {/* ── FINAL TOTALS ── */}
                <div style={{ padding: '16px 24px' }}>
                    <FeeRow label="Final amount" value={rupee(finalAmount)} bold />
                    <FeeRow label="Total paid amount" value={rupee(totalPaid)} bold color="#059669" />
                    <FeeRow label="Total Unpaid amount" value={rupee(totalUnpaid)} bold color={totalUnpaid > 0 ? '#dc2626' : '#1e293b'} />
                </div>

                {/* ── FOOTER ── */}
                <div style={{ background: '#1e293b', padding: '12px 24px', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0, fontWeight: '600', letterSpacing: '0.05em' }}>
                        Thank you for being part of the {gymName || 'gym'} family. 💪
                    </p>
                </div>
            </div>
        );
    }
);

/* ── Sub-components ── */

const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{label}</span>
        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700' }}>{value}</span>
    </div>
);

const FeeRow = ({ label, value, bold, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: bold ? '700' : '600' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: bold ? '800' : '700', color: color || '#1e293b' }}>{value}</span>
    </div>
);

/* Inline SVG gym icon (no external deps for html2canvas) */
const GymIcon = () => (
    <svg viewBox="0 0 80 80" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" rx="8" fill="#f1f0ff" />
        <rect x="28" y="48" width="24" height="18" rx="2" fill="#7c3aed" />
        <rect x="24" y="36" width="32" height="16" rx="2" fill="#4f46e5" />
        <rect x="20" y="30" width="40" height="10" rx="2" fill="#6d28d9" />
        {/* barbell */}
        <rect x="12" y="22" width="56" height="6" rx="3" fill="#4f46e5" />
        <rect x="10" y="18" width="8" height="14" rx="3" fill="#7c3aed" />
        <rect x="62" y="18" width="8" height="14" rx="3" fill="#7c3aed" />
        <rect x="16" y="16" width="6" height="18" rx="2" fill="#5b21b6" />
        <rect x="58" y="16" width="6" height="18" rx="2" fill="#5b21b6" />
        {/* windows */}
        <rect x="30" y="52" width="8" height="8" rx="1" fill="#c4b5fd" />
        <rect x="42" y="52" width="8" height="8" rx="1" fill="#c4b5fd" />
        <rect x="26" y="39" width="10" height="7" rx="1" fill="#c4b5fd" />
        <rect x="44" y="39" width="10" height="7" rx="1" fill="#c4b5fd" />
    </svg>
);

/* Silhouette avatar when no photo */
const DefaultAvatarIcon = ({ name }) => {
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const idx = name ? name.charCodeAt(0) % colors.length : 0;
    const bg = colors[idx];
    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '26px',
            fontWeight: '800',
        }}>
            {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
    );
};

MembershipShareCard.displayName = 'MembershipShareCard';
export default MembershipShareCard;
