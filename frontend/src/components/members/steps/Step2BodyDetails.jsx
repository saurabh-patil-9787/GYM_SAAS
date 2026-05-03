import React from 'react';
import StickyBottomBar from '../../ui/StickyBottomBar';
import DOBField from '../../DOBField';
import { Image as ImageIcon } from 'lucide-react';

const Step2BodyDetails = ({ data, updateData, onNext, onPhotoChange, photoPreview, onRemovePhoto }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800">Body Details</h2>
                    <p className="text-slate-500 text-sm">Optional. Add photo and body metrics.</p>
                </div>

                <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden relative">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-slate-400" size={24} />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => document.getElementById('wizardPhotoInput').click()} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium border border-slate-200">
                            {photoPreview ? 'Change Photo' : 'Add Photo (Optional)'}
                        </button>
                        {photoPreview && (
                            <button type="button" onClick={onRemovePhoto} className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-500 px-3 py-2 rounded-lg transition-colors font-medium border border-rose-200">
                                Remove
                            </button>
                        )}
                        <input type="file" id="wizardPhotoInput" onChange={(e) => { onPhotoChange(e); e.target.value = ''; }} accept="image/jpeg, image/png, image/jpg" className="hidden" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Age</label>
                        <div className="relative">
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="Yrs"
                                value={data.age}
                                onChange={(e) => updateData({ age: e.target.value.replace(/\D/g, '').slice(0,2) })}
                                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Weight</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-xs font-bold">kg</span>
                            </div>
                            <input
                                type="tel"
                                inputMode="decimal"
                                placeholder="0.0"
                                value={data.weight}
                                onChange={(e) => updateData({ weight: e.target.value })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-4 pr-8 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Height</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-xs font-bold">cm</span>
                            </div>
                            <input
                                type="tel"
                                inputMode="decimal"
                                placeholder="0.0"
                                value={data.height}
                                onChange={(e) => updateData({ height: e.target.value })}
                                className="w-full bg-white border border-slate-300 text-slate-800 pl-4 pr-8 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col justify-end">
                        <DOBField value={data.dob} onChange={(date) => updateData({ dob: date })} />
                    </div>
                </div>
            </div>

            <StickyBottomBar>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onNext}
                        className="w-full font-bold py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                    >
                        Next Step →
                    </button>
                    <button
                        onClick={onNext}
                        className="w-full text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </StickyBottomBar>
        </div>
    );
};

export default Step2BodyDetails;
