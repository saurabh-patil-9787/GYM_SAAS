import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Share2, Eye, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import InvoicePreview from './InvoicePreview';
import { generatePdfFromElement, downloadPdf, sharePdf } from '../../utils/invoicePdf';

const RecentInvoices = ({ gymSettings, refreshTrigger }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [viewingInvoice, setViewingInvoice] = useState(null);
    const previewRef = useRef(null);
    const [pdfAction, setPdfAction] = useState(null); // { id, type: 'download'|'share' }

    useEffect(() => {
        fetchRecent();
    }, [refreshTrigger]);

    const fetchRecent = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/invoices/recent');
            setInvoices(res.data || []);
        } catch { setInvoices([]); }
        finally { setLoading(false); }
    };

    const handlePdf = async (invoice, type) => {
        setPdfAction({ id: invoice._id, type });
        try {
            // Temporarily set viewingInvoice so the hidden preview renders
            setViewingInvoice(invoice);
            await new Promise(r => setTimeout(r, 200)); // let DOM settle
            if (!previewRef.current) return;
            const blob = await generatePdfFromElement(previewRef.current);
            const memberName = invoice.member?.name || 'Member';
            if (type === 'download') {
                downloadPdf(blob, invoice.invoiceNumber, memberName, gymSettings?.gymName);
            } else {
                await sharePdf(blob, invoice.invoiceNumber, memberName, gymSettings?.gymName);
            }
        } catch (e) {
            console.error('PDF action failed', e);
        } finally {
            setPdfAction(null);
            setViewingInvoice(null);
        }
    };

    const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="text-center py-8">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-slate-500 font-medium">No invoices generated yet</p>
                <p className="text-xs text-slate-400 mt-1">Generate your first invoice to see it here.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {invoices.map((inv, i) => (
                    <motion.div
                        key={inv._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                    <FileText size={18} className="text-indigo-500" strokeWidth={1.8} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{inv.invoiceNumber}</p>
                                    <p className="text-xs text-slate-500">
                                        {inv.member?.name || '—'} • {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-indigo-700">{fmt(inv.totalAmount)}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {inv.paymentStatus}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setViewingInvoice(inv)}
                                className="flex-1 min-w-[60px] py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                                <Eye size={12} /> View
                            </button>
                            <button
                                onClick={() => handlePdf(inv, 'download')}
                                disabled={pdfAction?.id === inv._id}
                                className="flex-1 min-w-[80px] py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                                {pdfAction?.id === inv._id && pdfAction.type === 'download'
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <Download size={12} />}
                                <span className="hidden sm:inline">Download</span>
                                <span className="sm:hidden">PDF</span>
                            </button>
                            <button
                                onClick={() => handlePdf(inv, 'share')}
                                disabled={pdfAction?.id === inv._id}
                                className="flex-1 min-w-[60px] py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                                {pdfAction?.id === inv._id && pdfAction.type === 'share'
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <Share2 size={12} />}
                                Share
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* View Invoice Modal */}
            <AnimatePresence>
                {viewingInvoice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => { if (!pdfAction) setViewingInvoice(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                                <h3 className="font-bold text-slate-800">{viewingInvoice.invoiceNumber}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePdf(viewingInvoice, 'download')}
                                        disabled={!!pdfAction}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                                        <Download size={12} /> Download
                                    </button>
                                    <button onClick={() => { if (!pdfAction) setViewingInvoice(null); }}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                                        Close
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <InvoicePreview
                                    ref={previewRef}
                                    invoice={viewingInvoice}
                                    gymSettings={gymSettings}
                                    member={viewingInvoice.member}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden preview for PDF generation when not in view modal */}
            {pdfAction && !viewingInvoice && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
                    <InvoicePreview ref={previewRef} invoice={pdfAction.invoice} gymSettings={gymSettings} member={pdfAction.invoice?.member} />
                </div>
            )}
        </>
    );
};

export default RecentInvoices;
