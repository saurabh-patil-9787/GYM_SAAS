import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, ChevronLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import InvoiceForm from '../../components/invoice/InvoiceForm';
import InvoicePreview from '../../components/invoice/InvoicePreview';
import InvoiceActions from '../../components/invoice/InvoiceActions';

/**
 * GenerateInvoice
 * Three-state page: form → preview → success
 * Works both embedded inside Billing.jsx (onClose prop) and as a
 * standalone route at /dashboard/billing/generate (?memberId=xxx).
 */
const GenerateInvoice = ({ initialMemberId, onClose, onCreated }) => {
    const [searchParams] = useSearchParams();
    const effectiveMemberId = initialMemberId || searchParams.get('memberId') || null;

    const [stage, setStage]                   = useState('form');
    const [gymSettings, setGymSettings]       = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [previewData, setPreviewData]       = useState(null);
    const [previewMember, setPreviewMember]   = useState(null);
    const [createdInvoice, setCreatedInvoice] = useState(null);
    const [submitting, setSubmitting]         = useState(false);
    const [submitError, setSubmitError]       = useState('');
    const previewRef = useRef(null);

    useEffect(() => {
        api.get('/api/invoices/settings')
            .then(res => setGymSettings({
                gymName: res.data.gymName,
                logoUrl: res.data.logoUrl,
                ...(res.data.invoiceSettings || {})
            }))
            .catch(() => {})
            .finally(() => setSettingsLoading(false));
    }, []);

    const handlePreview = (payload, member) => {
        setPreviewData(payload);
        setPreviewMember(member);
        setStage('preview');
    };

    const handleGeneratePdf = async () => {
        if (!previewData || submitting) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await api.post('/api/invoices', previewData);
            const inv = res.data.invoice;
            setCreatedInvoice({
                ...previewData,
                ...inv,
                memberName:   previewMember?.name,
                memberId:     previewMember?.memberId,
                memberMobile: previewMember?.mobile
            });
            setStage('success');
            if (onCreated) onCreated();
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Unable to generate the invoice. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setStage('form');
        setPreviewData(null);
        setPreviewMember(null);
        setCreatedInvoice(null);
        setSubmitError('');
    };

    if (settingsLoading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
    );

    // Stage label helpers
    const stageTitle = {
        form:    'Generate Invoice',
        preview: 'Preview Invoice',
        success: 'Invoice Created ✓'
    }[stage];

    const stageSubtitle = {
        form:    'Select a member and fill in the invoice details.',
        preview: 'Review before generating the PDF.',
        success: 'Invoice saved. Download or share it below.'
    }[stage];

    return (
        <div className="flex flex-col">
            {/* ── Header strip inside the card ─────────────────────────── */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                    {/* Back arrow when not on form (mobile-friendly) */}
                    {stage !== 'form' && stage !== 'success' && (
                        <button
                            onClick={() => setStage('form')}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all flex-shrink-0"
                        >
                            <ChevronLeft size={17} />
                        </button>
                    )}
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">{stageTitle}</h2>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{stageSubtitle}</p>
                    </div>
                </div>
                {/* Close button — only when used as embedded component in Billing */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all flex-shrink-0 ml-2"
                    >
                        <X size={17} />
                    </button>
                )}
            </div>

            {/* ── Stage content ────────────────────────────────────────── */}
            <div className="px-4 sm:px-6 py-5">
                <AnimatePresence mode="wait">

                    {/* FORM */}
                    {stage === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                        >
                            <InvoiceForm
                                gymSettings={gymSettings}
                                initialMemberId={effectiveMemberId}
                                onPreview={handlePreview}
                            />
                        </motion.div>
                    )}

                    {/* PREVIEW */}
                    {stage === 'preview' && previewData && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                        >
                            {submitError && (
                                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
                                    {submitError}
                                </div>
                            )}

                            {/* Scrollable invoice preview — horizontal scroll on mobile */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto mb-5">
                                <InvoicePreview
                                    ref={previewRef}
                                    invoice={previewData}
                                    gymSettings={gymSettings}
                                    member={previewMember}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setStage('form')}
                                    disabled={submitting}
                                    className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all disabled:opacity-50 order-2 sm:order-1"
                                >
                                    ← Edit Details
                                </button>
                                <button
                                    onClick={handleGeneratePdf}
                                    disabled={submitting}
                                    className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 order-1 sm:order-2"
                                >
                                    {submitting
                                        ? <><Loader2 size={16} className="animate-spin" /> Generating...</>
                                        : 'Generate PDF →'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* SUCCESS */}
                    {stage === 'success' && createdInvoice && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <InvoiceActions
                                invoice={createdInvoice}
                                member={previewMember}
                                gymSettings={gymSettings}
                                onDone={handleReset}
                            />
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default GenerateInvoice;
