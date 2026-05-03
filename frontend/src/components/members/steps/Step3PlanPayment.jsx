import React from 'react';
import StickyBottomBar from '../../ui/StickyBottomBar';
import { IndianRupee } from 'lucide-react';

const Step3PlanPayment = ({ data, updateData, onSubmit, isSubmitting }) => {
    const isNew = data.memberType === 'new';

    const isValid = data.joiningDate && data.totalFee !== '' && data.paidFee !== '' && (isNew ? data.planDuration : data.expiryDate);

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800">Plan & Payment</h2>
                    <p className="text-slate-500 text-sm">Final step to add the member.</p>
                </div>

                <div>
                    <label className="block text-slate-600 text-xs font-bold mb-2 uppercase tracking-wider">Member Type</label>
                    <div className="flex gap-6 mt-1 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="memberType" value="new" checked={isNew} onChange={() => updateData({ memberType: 'new' })} className="w-4 h-4 text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                            <span className={`font-bold ${isNew ? 'text-indigo-600' : 'text-slate-500'}`}>New Member</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="memberType" value="existing" checked={!isNew} onChange={() => updateData({ memberType: 'existing' })} className="w-4 h-4 text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                            <span className={`font-bold ${!isNew ? 'text-indigo-600' : 'text-slate-500'}`}>Existing</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isNew ? (
                        <div>
                            <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Plan Duration</label>
                            <select
                                value={data.planDuration}
                                onChange={(e) => updateData({ planDuration: e.target.value })}
                                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors appearance-none font-bold"
                            >
                                <option value="1">1 Month</option>
                                <option value="3">3 Months</option>
                                <option value="6">6 Months</option>
                                <option value="12">1 Year</option>
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Expiry Date</label>
                            <input
                                type="date"
                                value={data.expiryDate}
                                onChange={(e) => updateData({ expiryDate: e.target.value })}
                                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Joining Date</label>
                        <input
                            type="date"
                            value={data.joiningDate}
                            onChange={(e) => updateData({ joiningDate: e.target.value })}
                            className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Total Fee</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0"
                                value={data.totalFee}
                                onChange={(e) => updateData({ totalFee: e.target.value.replace(/\D/g, '') })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-9 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Paid Amount</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0"
                                value={data.paidFee}
                                onChange={(e) => updateData({ paidFee: e.target.value.replace(/\D/g, '') })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-9 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Payment Method</label>
                    <select
                        value={data.paymentMethod}
                        onChange={(e) => updateData({ paymentMethod: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors appearance-none font-bold"
                    >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online / UPI</option>
                    </select>
                </div>
            </div>

            <StickyBottomBar>
                <button
                    onClick={onSubmit}
                    disabled={!isValid || isSubmitting}
                    className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${isValid && !isSubmitting ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        'Save Member'
                    )}
                </button>
            </StickyBottomBar>
        </div>
    );
};

export default Step3PlanPayment;
