import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Receipt, Settings, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import RecentInvoices from '../../components/invoice/RecentInvoices';
import GenerateInvoice from './GenerateInvoice';

const Billing = () => {
    const [showGenerator, setShowGenerator] = useState(false);
    const [gymSettings, setGymSettings]     = useState(null);
    const [refresh, setRefresh]             = useState(0);

    useEffect(() => {
        api.get('/api/invoices/settings')
            .then(res => setGymSettings({
                gymName: res.data.gymName,
                logoUrl: res.data.logoUrl,
                ...(res.data.invoiceSettings || {})
            }))
            .catch(() => {});
    }, []);

    const handleCreated = () => {
        setShowGenerator(false);
        setRefresh(r => r + 1);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 sm:py-5">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Receipt size={20} className="text-white" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-xl font-bold text-slate-800 leading-tight">Billing &amp; Invoices</h1>
                            <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                                Generate, view and share professional PDF invoices for your members.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/dashboard/billing/settings"
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
                    >
                        <Settings size={13} />
                        <span className="hidden sm:inline">Invoice</span> Settings
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">

                {/* ── Generate Invoice CTA / Inline form ────────────────── */}
                <AnimatePresence mode="wait">
                    {!showGenerator ? (
                        <motion.button
                            key="trigger"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowGenerator(true)}
                            className="w-full py-4 sm:py-5 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 text-indigo-700 font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Generate New Invoice
                        </motion.button>
                    ) : (
                        <motion.div
                            key="generator"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                        >
                            <GenerateInvoice
                                onClose={() => setShowGenerator(false)}
                                onCreated={handleCreated}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Recent Invoices ────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Receipt size={15} className="text-indigo-500" strokeWidth={1.8} />
                            Recent Invoices
                        </h2>
                        <span className="text-xs text-slate-400 font-medium">Latest 3</span>
                    </div>
                    <RecentInvoices gymSettings={gymSettings} refreshTrigger={refresh} />
                </div>
            </div>
        </div>
    );
};

export default Billing;
