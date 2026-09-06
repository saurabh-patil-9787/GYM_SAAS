import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const INVOICE_TYPES = ['Membership', 'New Membership', 'Renewal', 'Registration', 'Other'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Online', 'Other'];

const InvoiceForm = ({ gymSettings, initialMemberId, onPreview }) => {
    // ── Member search state ──────────────────────────────────────────────────
    const [query, setQuery]               = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching]       = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberPayments, setMemberPayments] = useState([]);
    const searchRef  = useRef(null);
    const inputRef   = useRef(null);

    // ── Invoice fields ────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        invoiceType:        'Membership',
        description:        '',
        invoiceDate:        new Date().toISOString().split('T')[0],
        subtotal:           '',
        discount:           '0',
        paymentMethod:      'Cash',
        transactionId:      '',
        paymentStatus:      'PAID',
        notes:              '',
        useGst:             !!(gymSettings?.gstEnabled),
        selectedPaymentRef: null
    });
    const [error, setError] = useState('');

    // ── Pre-fill when memberId passed from MembersPage / URL query param ──────
    useEffect(() => {
        if (!initialMemberId) return;
        // Fetch the member directly from the members list (returns full profile)
        api.get(`/api/members?search=${initialMemberId}&limit=5`)
            .then(res => {
                // Response: { data: [...members], total, page, pages }
                const members = res.data?.data || [];
                // Try to match by _id
                const found = members.find(m => m._id === initialMemberId) || members[0];
                if (found) {
                    selectMember(found);
                }
            })
            .catch(() => {});
    }, [initialMemberId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Close dropdown on outside click ─────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Debounced member search ────────────────────────────────────────────────
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                // GET /api/members returns { data: [...], total, page, pages }
                const res = await api.get(`/api/members?search=${encodeURIComponent(q)}&limit=8`);
                const members = res.data?.data || res.data?.members || (Array.isArray(res.data) ? res.data : []);
                setSearchResults(members);
                setShowDropdown(true);
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    // ── Load payment history for selected member ─────────────────────────────
    const loadMemberHistory = async (memberId) => {
        try {
            // GET /api/members/:id/history returns { success, data: { name, history: [...] } }
            const res = await api.get(`/api/members/${memberId}/history`);
            const history = res.data?.data?.history || [];
            // Map history items to payment pick format
            setMemberPayments(history.map(h => ({
                _id:    h._id,
                amount: h.amount,
                type:   h.type || h.transactionType || 'Cash',
                date:   h.date,
                remark: h.remark || h.plan || ''
            })));
        } catch {
            setMemberPayments([]);
        }
    };

    // ── Select a member from the dropdown ────────────────────────────────────
    const selectMember = (m) => {
        setSelectedMember(m);
        setQuery('');
        setSearchResults([]);
        setShowDropdown(false);
        // Auto-fill description
        setForm(f => ({
            ...f,
            description: m.planName ? `${m.planName} — Membership` : '',
            selectedPaymentRef: null
        }));
        loadMemberHistory(m._id);
    };

    const clearMember = () => {
        setSelectedMember(null);
        setMemberPayments([]);
        setForm(f => ({ ...f, description: '', selectedPaymentRef: null }));
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handlePaymentSelect = (p) => {
        setForm(f => ({
            ...f,
            subtotal:           String(p.amount || ''),
            paymentMethod:      p.type === 'Online' ? 'Online' : 'Cash',
            selectedPaymentRef: p
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    // ── Live calculations ────────────────────────────────────────────────────
    const sub     = Number(form.subtotal)  || 0;
    const disc    = Number(form.discount)  || 0;
    const taxable = Math.max(sub - disc, 0);
    const useGst  = form.useGst && gymSettings?.gstEnabled;
    const gstRate = gymSettings?.gstRate || 18;
    const cgst    = useGst ? parseFloat(((taxable * gstRate) / 200).toFixed(2)) : 0;
    const sgst    = cgst;
    const total   = parseFloat((taxable + cgst + sgst).toFixed(2));

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!selectedMember)                        { setError('Please select a member.'); return; }
        if (!form.subtotal || sub <= 0)             { setError('Please enter a valid amount.'); return; }
        if (!form.description.trim())               { setError('Please enter a description.'); return; }

        const payload = {
            memberId:       selectedMember._id,
            memberName:     selectedMember.name,
            memberMobile:   selectedMember.mobile,
            paymentReference: form.selectedPaymentRef ? {
                paymentId: form.selectedPaymentRef._id,
                date:      form.selectedPaymentRef.date,
                amount:    form.selectedPaymentRef.amount,
                type:      form.selectedPaymentRef.type,
                remark:    form.selectedPaymentRef.remark
            } : {},
            invoiceDate:    form.invoiceDate,
            invoiceType:    form.invoiceType,
            description:    form.description.trim(),
            subtotal:       sub,
            discount:       disc,
            taxableAmount:  taxable,
            gstEnabled:     useGst,
            gstRate:        useGst ? gstRate : 0,
            cgst, sgst, igst: 0,
            totalAmount:    total,
            paymentMethod:  form.paymentMethod,
            transactionId:  form.transactionId.trim() || null,
            paymentStatus:  form.paymentStatus,
            notes:          form.notes.trim() || null
        };
        onPreview(payload, selectedMember);
    };

    const inputCls = "w-full border border-slate-200 bg-white text-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";
    const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Error ── */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    {error}
                </div>
            )}

            {/* ── Member Search ─────────────────────────────────────────────── */}
            <div ref={searchRef}>
                <label className={labelCls}>Select Member *</label>

                {selectedMember ? (
                    /* ── Selected member chip ── */
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {selectedMember.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-indigo-900 truncate">{selectedMember.name}</p>
                            <p className="text-xs text-indigo-600 mt-0.5">
                                ID: {selectedMember.memberId} &nbsp;•&nbsp; {selectedMember.mobile}
                                {selectedMember.planName && <span className="ml-2 text-indigo-400">({selectedMember.planName})</span>}
                            </p>
                        </div>
                        <button type="button" onClick={clearMember}
                            className="text-indigo-400 hover:text-rose-500 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-rose-50">
                            <X size={15} />
                        </button>
                    </div>
                ) : (
                    /* ── Search input + dropdown ── */
                    <div className="relative">
                        <div className="relative">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type name or mobile number to search…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                className={`${inputCls} pl-9 pr-8`}
                                autoComplete="off"
                            />
                            {/* Inline spinner */}
                            {searching && (
                                <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                            )}
                        </div>

                        {/* ── Dropdown ── */}
                        <AnimatePresence>
                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                                    style={{ maxHeight: '260px', overflowY: 'auto' }}
                                >
                                    {searching && searchResults.length === 0 && (
                                        <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400">
                                            <Loader2 size={12} className="animate-spin" /> Searching…
                                        </div>
                                    )}
                                    {!searching && searchResults.length === 0 && query.length >= 2 && (
                                        <div className="px-4 py-4 text-center text-xs text-slate-400">
                                            No members found for "<strong>{query}</strong>"
                                        </div>
                                    )}
                                    {searchResults.map(m => (
                                        <button
                                            key={m._id}
                                            type="button"
                                            onMouseDown={e => e.preventDefault()} // prevent blur before click
                                            onClick={() => selectMember(m)}
                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                                                {m.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{m.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {m.memberId} &nbsp;•&nbsp; {m.mobile}
                                                    {m.planName && <span className="ml-1.5 text-slate-400">({m.planName})</span>}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${m.isPlanExpired ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {m.isPlanExpired ? 'Expired' : 'Active'}
                                            </span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Payment History Quick Pick ─────────────────────────────────── */}
            {selectedMember && memberPayments.length > 0 && (
                <div>
                    <label className={labelCls}>Link to Payment <span className="normal-case font-normal text-slate-400">(Optional — auto-fills amount)</span></label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {memberPayments.slice(0, 5).map((p, i) => {
                            const isSelected = form.selectedPaymentRef?._id === p._id;
                            return (
                                <button
                                    key={p._id || i}
                                    type="button"
                                    onClick={() => handlePaymentSelect(p)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
                                        isSelected
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50'
                                    }`}
                                >
                                    {isSelected && <CheckCircle2 size={12} className="text-indigo-500 flex-shrink-0" />}
                                    <span className="font-bold">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                                    <span className="text-slate-500">• {p.type}</span>
                                    <span className="text-slate-400">• {new Date(p.date).toLocaleDateString('en-IN')}</span>
                                    {p.remark && <span className="text-slate-400 truncate">— {p.remark}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Invoice Type + Date ── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Invoice Type</label>
                    <select name="invoiceType" value={form.invoiceType} onChange={handleChange} className={inputCls}>
                        {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Invoice Date</label>
                    <input type="date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange} className={inputCls} />
                </div>
            </div>

            {/* ── Description ── */}
            <div>
                <label className={labelCls}>Description *</label>
                <input type="text" name="description" value={form.description} onChange={handleChange}
                    placeholder="e.g. Premium Gym Membership — 3 Months" className={inputCls} maxLength={150} />
            </div>

            {/* ── Amount + Discount ── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Amount (₹) *</label>
                    <input type="number" name="subtotal" value={form.subtotal} onChange={handleChange}
                        placeholder="0" min="0" step="0.01" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Discount (₹)</label>
                    <input type="number" name="discount" value={form.discount} onChange={handleChange}
                        placeholder="0" min="0" step="0.01" className={inputCls} />
                </div>
            </div>

            {/* ── Payment Method + Status ── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Payment Method</label>
                    <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className={inputCls}>
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Payment Status</label>
                    <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange} className={inputCls}>
                        <option value="PAID">PAID</option>
                        <option value="PENDING">PENDING</option>
                    </select>
                </div>
            </div>

            {/* ── Transaction ID ── */}
            <div>
                <label className={labelCls}>Transaction ID <span className="normal-case font-normal text-slate-400">(Optional)</span></label>
                <input type="text" name="transactionId" value={form.transactionId} onChange={handleChange}
                    placeholder="UPI ref / Bank ref..." className={inputCls} maxLength={100} />
            </div>

            {/* ── GST Toggle ── */}
            {gymSettings?.gstEnabled && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input type="checkbox" name="useGst" id="useGst" checked={form.useGst} onChange={handleChange}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                    <label htmlFor="useGst" className="text-sm font-semibold text-slate-700 cursor-pointer">
                        Apply GST ({gstRate}%) — CGST {gstRate / 2}% + SGST {gstRate / 2}%
                    </label>
                </div>
            )}

            {/* ── Notes ── */}
            <div>
                <label className={labelCls}>Notes <span className="normal-case font-normal text-slate-400">(Optional)</span></label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                    placeholder="Any additional information..." rows={2}
                    className={`${inputCls} resize-none`} maxLength={300} />
            </div>

            {/* ── Live Total Preview ── */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-semibold">₹{sub.toLocaleString('en-IN')}</span></div>
                    {disc > 0 && <div className="flex justify-between text-rose-600"><span>Discount</span><span>− ₹{disc.toLocaleString('en-IN')}</span></div>}
                    {useGst && <>
                        <div className="flex justify-between text-slate-600"><span>Taxable Amount</span><span>₹{taxable.toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between text-slate-600"><span>CGST + SGST ({gstRate}%)</span><span>₹{(cgst + sgst).toLocaleString('en-IN')}</span></div>
                    </>}
                    <div className="flex justify-between text-indigo-800 font-bold text-base pt-2 border-t border-indigo-200 mt-2">
                        <span>TOTAL</span>
                        <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <button type="submit"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                Preview Invoice →
            </button>
        </form>
    );
};

export default InvoiceForm;
