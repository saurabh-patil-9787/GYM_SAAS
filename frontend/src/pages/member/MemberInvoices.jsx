import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Loader2, Receipt, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import InvoicePreview from '../../components/invoice/InvoicePreview';
import { generatePdfFromElement, downloadPdf, sharePdf } from '../../utils/invoicePdf';
import { useRealtimeEvent } from '../../context/RealtimeContext';

const MemberInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [gymSettings, setGymSettings] = useState(null);
    const [viewingInvoice, setViewingInvoice] = useState(null);
    const [pdfAction, setPdfAction] = useState(null); // { id, type }
    const previewRef = useRef(null);
    const navigate   = useNavigate();

    const fetchData = useCallback(() => {
        Promise.all([
            api.get('/api/member/invoices'),
            api.get('/api/member/profile')
        ])
        .then(([invRes, profileRes]) => {
            setInvoices(invRes.data || []);

            // Build gymSettings matching the same shape InvoicePreview expects
            const profile = profileRes.data;
            const gymInfo = profile?.gym || {};
            const invSettings = gymInfo.invoiceSettings || {};
            setGymSettings({
                gymName:    gymInfo.gymName  || '',
                address:    invSettings.address || gymInfo.address || '',
                mobile:     invSettings.mobile  || gymInfo.whatsappNumber || gymInfo.phone || '',
                email:      invSettings.email   || '',
                gstEnabled: !!invSettings.gstEnabled,
                gstin:      invSettings.gstin   || '',
                gstRate:    invSettings.gstRate || 18,
                terms:      invSettings.terms   || '',
                footerNote: invSettings.footerNote || `Thank you for choosing ${gymInfo.gymName || 'our gym'}!`
            });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh invoices when a new invoice is created (SSE event from owner)
    useRealtimeEvent('invoice_created', fetchData);

    // Build a rich member object from the invoice's populated or denormalized data
    const getMemberFromInvoice = (inv) => {
        // Prefer populated member object, fall back to denormalized fields
        if (inv.member && typeof inv.member === 'object') {
            return {
                _id:      inv.member._id,
                name:     inv.member.name     || inv.memberName   || '',
                mobile:   inv.member.mobile   || inv.memberMobile || '',
                memberId: inv.member.memberId || ''
            };
        }
        // Purely denormalized (no populate)
        return {
            name:     inv.memberName   || '',
            mobile:   inv.memberMobile || '',
            memberId: ''
        };
    };

    const handlePdf = async (invoice, type = 'download') => {
        setPdfAction({ id: invoice._id, type });
        setViewingInvoice(invoice);
        await new Promise(r => setTimeout(r, 200));
        try {
            if (!previewRef.current) return;
            const blob = await generatePdfFromElement(previewRef.current);
            const memberName = getMemberFromInvoice(invoice).name || 'Member';
            if (type === 'share') {
                await sharePdf(blob, invoice.invoiceNumber, memberName, gymSettings?.gymName);
            } else {
                downloadPdf(blob, invoice.invoiceNumber, memberName, gymSettings?.gymName);
            }
        } catch (e) {
            console.error('PDF action failed', e);
        } finally {
            setPdfAction(null);
            setViewingInvoice(null);
        }
    };

    const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 pt-safe pt-6 pb-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-1">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all flex-shrink-0"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                        <Receipt size={18} className="text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800 leading-tight">My Invoices</h1>
                        <p className="text-[11px] text-slate-400">
                            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 space-y-3">
                {invoices.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <FileText size={28} className="text-slate-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">No invoices yet</p>
                        <p className="text-xs text-slate-400 mt-1">Your gym will generate invoices for your payments.</p>
                    </div>
                ) : (
                    invoices.map((inv, i) => {
                        const mem = getMemberFromInvoice(inv);
                        const isActing = pdfAction?.id === inv._id;
                        return (
                            <motion.div
                                key={inv._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                            >
                                <div className="p-4">
                                    {/* Invoice header row */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <FileText size={18} className="text-indigo-500" strokeWidth={1.8} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800">{inv.invoiceNumber}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5 truncate">{inv.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-indigo-700">{fmt(inv.totalAmount)}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                inv.paymentStatus === 'PAID'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {inv.paymentStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Type + Method badges */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                            {inv.invoiceType}
                                        </span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
                                            {inv.paymentMethod}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => handlePdf(inv, 'download')}
                                            disabled={isActing}
                                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.98]"
                                        >
                                            {isActing && pdfAction.type === 'download'
                                                ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
                                                : <><Download size={12} /> Download PDF</>}
                                        </button>
                                        <button
                                            onClick={() => handlePdf(inv, 'share')}
                                            disabled={isActing}
                                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.98]"
                                        >
                                            {isActing && pdfAction.type === 'share'
                                                ? <><Loader2 size={12} className="animate-spin" /> Preparing...</>
                                                : <><Share2 size={12} /> Share</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Off-screen InvoicePreview for PDF capture */}
            {viewingInvoice && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
                    <InvoicePreview
                        ref={previewRef}
                        invoice={viewingInvoice}
                        gymSettings={gymSettings}
                        member={getMemberFromInvoice(viewingInvoice)}
                    />
                </div>
            )}
        </div>
    );
};

export default MemberInvoices;
