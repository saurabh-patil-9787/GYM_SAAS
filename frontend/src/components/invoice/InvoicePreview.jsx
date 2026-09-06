import React from 'react';

/**
 * InvoicePreview — Pure presentational component.
 * Used both as the live preview modal AND as the html2canvas capture target.
 *
 * CRITICAL: Zero Tailwind classes — only inline styles so that html2canvas
 * captures the PDF-ready layout correctly regardless of the app's CSS context.
 */
const InvoicePreview = React.forwardRef(({ invoice, gymSettings, member }, ref) => {
    if (!invoice) return null;

    const {
        invoiceNumber, invoiceDate, invoiceType, description,
        subtotal, discount, taxableAmount,
        gstEnabled, gstRate, cgst, sgst, igst,
        totalAmount, paymentMethod, transactionId, paymentStatus, notes
    } = invoice;

    const gs = gymSettings || {};
    const dateStr = invoiceDate
        ? new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const fmt = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const INDIGO  = '#4f46e5';
    const INDIGO2 = '#6366f1';
    const SLATE   = '#1e293b';
    const MUTED   = '#64748b';
    const BORDER  = '#e2e8f0';
    const BG_LIGHT = '#f8fafc';

    return (
        <div
            ref={ref}
            style={{
                width: '794px',
                minHeight: '1123px',
                background: '#ffffff',
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                color: SLATE,
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* ── COLOUR-BAND HEADER ─────────────────────────────────────────── */}
            <div style={{
                background: `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO2} 100%)`,
                padding: '32px 48px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}>
                {/* Left: Gym Name + Contact Info (no logo) */}
                <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                        {gs.gymName || 'Gym Name'}
                    </div>
                    {gs.address && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>{gs.address}</div>}
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {gs.mobile && <span>📞 {gs.mobile}</span>}
                        {gs.email  && <span>✉ {gs.email}</span>}
                    </div>
                    {gs.gstEnabled && gs.gstin && (
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>GSTIN: {gs.gstin}</div>
                    )}
                </div>

                {/* Right: INVOICE label + number */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1', opacity: 0.9 }}>
                        INVOICE
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: '6px' }}>
                        {invoiceNumber || '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>{dateStr}</div>
                    {/* Status badge */}
                    <div style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        padding: '4px 14px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: '800',
                        letterSpacing: '1px',
                        background: paymentStatus === 'PAID' ? '#dcfce7' : '#fef9c3',
                        color:       paymentStatus === 'PAID' ? '#14532d' : '#713f12',
                    }}>
                        {paymentStatus || 'PAID'}
                    </div>
                </div>
            </div>

            {/* ── BODY ──────────────────────────────────────────────────────── */}
            <div style={{ padding: '36px 48px' }}>

                {/* ── BILL TO / INVOICE DETAILS row ─────────────────────────── */}
                <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
                    {/* Bill To */}
                    <div style={{
                        flex: 1, background: BG_LIGHT,
                        border: `1px solid ${BORDER}`, borderRadius: '10px',
                        padding: '18px 20px',
                    }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Bill To
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: SLATE }}>{member?.name || invoice.memberName || '—'}</div>
                        <div style={{ fontSize: '12px', color: MUTED, marginTop: '5px' }}>
                            Member ID: <span style={{ fontWeight: '600', color: SLATE }}>{member?.memberId || invoice.memberId || '—'}</span>
                        </div>
                        {(member?.mobile || invoice.memberMobile) && (
                            <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>
                                Mobile: <span style={{ fontWeight: '600', color: SLATE }}>{member?.mobile || invoice.memberMobile}</span>
                            </div>
                        )}
                    </div>

                    {/* Invoice Details */}
                    <div style={{
                        flex: 1, background: BG_LIGHT,
                        border: `1px solid ${BORDER}`, borderRadius: '10px',
                        padding: '18px 20px',
                    }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Invoice Details
                        </div>
                        <DetailRow label="Invoice Number" value={invoiceNumber || '—'} />
                        <DetailRow label="Invoice Date"   value={dateStr} />
                        <DetailRow label="Invoice Type"   value={invoiceType || 'Membership'} />
                        <DetailRow label="Payment Method" value={paymentMethod || 'Cash'} />
                        {transactionId && <DetailRow label="Transaction ID" value={transactionId} />}
                    </div>
                </div>

                {/* ── ITEMS TABLE ─────────────────────────────────────────────── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                    <thead>
                        <tr style={{ background: INDIGO }}>
                            <th style={{ textAlign: 'left',   padding: '10px 16px', fontSize: '10px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.8px', borderRadius: '6px 0 0 6px' }}>
                                Description
                            </th>
                            <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '10px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Qty
                            </th>
                            <th style={{ textAlign: 'right',  padding: '10px 16px', fontSize: '10px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.8px', borderRadius: '0 6px 6px 0' }}>
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ background: '#ffffff' }}>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: SLATE, borderBottom: `1px solid ${BORDER}` }}>
                                {description}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: SLATE, textAlign: 'center', borderBottom: `1px solid ${BORDER}` }}>
                                1
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: SLATE, textAlign: 'right', borderBottom: `1px solid ${BORDER}` }}>
                                {fmt(subtotal)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── AMOUNT SUMMARY ───────────────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
                    <div style={{ width: '300px', background: BG_LIGHT, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                        <SummaryRow label="Subtotal"       value={fmt(subtotal)} />
                        {Number(discount) > 0 && (
                            <SummaryRow label="Discount" value={`− ${fmt(discount)}`} valueColor="#ef4444" />
                        )}
                        {gstEnabled && <SummaryRow label="Taxable Amount" value={fmt(taxableAmount)} />}
                        {gstEnabled && Number(cgst) > 0 && (
                            <SummaryRow label={`CGST (${Number(gstRate) / 2}%)`} value={fmt(cgst)} />
                        )}
                        {gstEnabled && Number(sgst) > 0 && (
                            <SummaryRow label={`SGST (${Number(gstRate) / 2}%)`} value={fmt(sgst)} />
                        )}
                        {gstEnabled && Number(igst) > 0 && (
                            <SummaryRow label={`IGST (${Number(gstRate)}%)`} value={fmt(igst)} />
                        )}
                        {/* Total row — highlighted */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 18px',
                            background: `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO2} 100%)`,
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>TOTAL</span>
                            <span style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>{fmt(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* ── NOTES ──────────────────────────────────────────────────── */}
                {notes && (
                    <div style={{
                        marginBottom: '24px', padding: '14px 18px',
                        background: '#fffbeb', borderRadius: '8px',
                        border: '1px solid #fde68a',
                    }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: '#92400e', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>Notes</div>
                        <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.7' }}>{notes}</div>
                    </div>
                )}

                {/* ── TERMS ──────────────────────────────────────────────────── */}
                {gs.terms && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: MUTED, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>Terms & Conditions</div>
                        <div style={{ fontSize: '11px', color: MUTED, lineHeight: '1.7' }}>{gs.terms}</div>
                    </div>
                )}

                {/* ── FOOTER ──────────────────────────────────────────────────── */}
                <div style={{
                    marginTop: '32px',
                    borderTop: `2px solid ${BORDER}`,
                    paddingTop: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: MUTED }}>
                            {gs.footerNote || `Thank you for choosing ${gs.gymName || 'our gym'}!`}
                        </div>
                        <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '4px' }}>Generated by MajhiGym · majhigym.com</div>
                    </div>

                    {/* Authorised Signature area */}
                    <div style={{ textAlign: 'center', minWidth: '140px' }}>
                        <div style={{ borderTop: '1.5px solid #94a3b8', paddingTop: '6px', marginTop: '24px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: MUTED }}>Authorised Signatory</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{gs.gymName || ''}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

InvoicePreview.displayName = 'InvoicePreview';
export default InvoicePreview;

// ── Sub-components ────────────────────────────────────────────────────────────

const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0', gap: '8px' }}>
        <span style={{ color: '#94a3b8', fontWeight: '500', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontWeight: '600', color: '#1e293b', textAlign: 'right' }}>{value}</span>
    </div>
);

const SummaryRow = ({ label, value, valueColor }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 18px',
        borderBottom: '1px solid #f1f5f9',
        fontSize: '12px', color: '#475569',
    }}>
        <span>{label}</span>
        <span style={{ fontWeight: '600', color: valueColor || '#1e293b' }}>{value}</span>
    </div>
);
