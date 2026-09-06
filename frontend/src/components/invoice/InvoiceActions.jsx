import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import InvoicePreview from './InvoicePreview';
import { generatePdfFromElement, downloadPdf, sharePdf } from '../../utils/invoicePdf';

const InvoiceActions = ({ invoice, member, gymSettings, onDone }) => {
    const previewRef = useRef(null);
    const [genLoading, setGenLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [error, setError] = useState('');
    const [shareMsg, setShareMsg] = useState('');

    const ensureBlob = async () => {
        if (pdfBlob) return pdfBlob;
        if (!previewRef.current) throw new Error('Preview not ready');
        const blob = await generatePdfFromElement(previewRef.current);
        setPdfBlob(blob);
        return blob;
    };

    const handleDownload = async () => {
        setGenLoading(true);
        setError('');
        try {
            const blob = await ensureBlob();
            downloadPdf(blob, invoice.invoiceNumber, member?.name || invoice.memberName, gymSettings?.gymName);
        } catch (e) {
            console.error(e);
            setError('Unable to generate the invoice. Please try again.');
        } finally {
            setGenLoading(false);
        }
    };

    const handleShare = async () => {
        setShareLoading(true);
        setError('');
        setShareMsg('');
        try {
            const blob = await ensureBlob();
            const result = await sharePdf(blob, invoice.invoiceNumber, member?.name || invoice.memberName, gymSettings?.gymName);
            if (!result.shared && !result.downloaded) {
                setShareMsg('Share cancelled.');
            } else if (!result.shared && result.downloaded) {
                setShareMsg('Sharing not available — invoice downloaded instead.');
            }
        } catch (e) {
            console.error(e);
            setError('Invoice generated successfully. Sharing is not available on this device.');
        } finally {
            setShareLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Success banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center"
            >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-emerald-500" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-bold text-emerald-800 mb-1">Invoice Created!</h3>
                <p className="text-sm font-semibold text-emerald-700">{invoice.invoiceNumber}</p>
                <p className="text-xs text-emerald-600 mt-1">
                    {member?.name || invoice.memberName} • ₹{Number(invoice.totalAmount).toLocaleString('en-IN')}
                </p>
            </motion.div>

            {/* Error / share messages */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-semibold text-center">
                    {error}
                </div>
            )}
            {shareMsg && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-xs font-semibold text-center">
                    {shareMsg}
                </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleDownload}
                    disabled={genLoading}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {genLoading ? <><Loader2 size={16} className="animate-spin" /> Generating PDF...</> : <><Download size={16} /> Download PDF</>}
                </button>

                <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {shareLoading ? <><Loader2 size={16} className="animate-spin" /> Preparing...</> : <><Share2 size={16} /> Share Invoice</>}
                </button>

                <button
                    onClick={onDone}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all"
                >
                    Done — Generate Another
                </button>
            </div>

            {/* Hidden InvoicePreview for PDF capture — off-screen but rendered */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
                <InvoicePreview ref={previewRef} invoice={invoice} gymSettings={gymSettings} member={member} />
            </div>
        </div>
    );
};

export default InvoiceActions;
