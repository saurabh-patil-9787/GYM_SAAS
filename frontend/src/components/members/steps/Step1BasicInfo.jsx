import React, { useEffect, useRef, useState } from 'react';
import StickyBottomBar from '../../ui/StickyBottomBar';
import { User, Phone, AlertTriangle, MapPin } from 'lucide-react';
import api from '../../../api/axios';

const Step1BasicInfo = ({ data, updateData, onNext }) => {
    const nameInputRef = useRef(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateMemberInfo, setDuplicateMemberInfo] = useState(null);

    useEffect(() => {
        // Auto-focus the name field on load for speed
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, []);

    const isValid = data.name.trim().length > 0 && data.mobile.length === 10;

    const handleNextStep = async () => {
        if (!isValid) return;
        
        // If user already allowed duplicate, skip check
        if (data.allowDuplicateMobile) {
            onNext();
            return;
        }

        setIsChecking(true);
        try {
            const res = await api.get(`/api/members/check-duplicate?mobile=${data.mobile}`);
            if (res.data && res.data.isDuplicate) {
                setDuplicateMemberInfo(res.data.existingMember);
                setShowDuplicateModal(true);
            } else {
                onNext();
            }
        } catch (error) {
            console.error("Duplicate check failed", error);
            // On error, proceed anyway so we don't block
            onNext();
        } finally {
            setIsChecking(false);
        }
    };

    const handleContinueAnyway = () => {
        updateData({ allowDuplicateMobile: true });
        setShowDuplicateModal(false);
        onNext();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800">Basic Info</h2>
                    <p className="text-slate-500 text-sm">Let's start with the essentials.</p>
                </div>
                
                <div className="space-y-5">
                    <div className="relative">
                        <label className="block text-slate-600 text-sm font-bold mb-2">Full Name <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User size={18} className="text-slate-400" />
                            </div>
                            <input
                                ref={nameInputRef}
                                type="text"
                                placeholder="Enter member's full name"
                                value={data.name}
                                onChange={(e) => updateData({ name: e.target.value })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-slate-600 text-sm font-bold mb-2">Mobile Number <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 font-medium text-sm">+91</span>
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="10-digit mobile number"
                                value={data.mobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    updateData({ mobile: val, allowDuplicateMobile: false });
                                }}
                                className={`w-full bg-white border text-slate-800 pl-12 pr-4 py-3.5 rounded-xl focus:outline-none transition-colors ${data.mobile.length > 0 && data.mobile.length < 10 ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}
                            />
                        </div>
                        {data.mobile.length > 0 && data.mobile.length < 10 && (
                            <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                                <Phone size={12} /> Mobile must be 10 digits
                            </p>
                        )}
                    </div>

                    <div className="relative">
                        <label className="block text-slate-600 text-sm font-bold mb-2">City</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MapPin size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter city"
                                value={data.city}
                                onChange={(e) => updateData({ city: e.target.value })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <StickyBottomBar>
                <button
                    onClick={handleNextStep}
                    disabled={!isValid || isChecking}
                    className={`w-full font-bold py-3.5 rounded-xl transition-all ${isValid && !isChecking ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                    {isChecking ? 'Checking...' : 'Next Step →'}
                </button>
            </StickyBottomBar>

            {/* Duplicate Member Modal inside Step 1 */}
            {showDuplicateModal && duplicateMemberInfo && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[70] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm border border-rose-200 shadow-2xl relative overflow-hidden">
                        <div className="bg-rose-50 p-5 border-b border-rose-100 flex flex-col items-center">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" size={20} />
                                Duplicate Found
                            </h3>
                        </div>
                        <div className="p-5">
                            <p className="text-slate-600 text-sm mb-4">
                                A member with the number <span className="text-slate-800 font-bold">{duplicateMemberInfo.mobile}</span> already exists.
                            </p>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5">
                                <p className="text-slate-800 font-bold text-lg mb-1">{duplicateMemberInfo.name}</p>
                                <p className="text-slate-400 text-xs mb-1">ID: {duplicateMemberInfo.memberId}</p>
                                <p className={`text-xs font-bold ${duplicateMemberInfo.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    Status: {duplicateMemberInfo.status}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDuplicateModal(false)}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleContinueAnyway}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
                                >
                                    Continue Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step1BasicInfo;
