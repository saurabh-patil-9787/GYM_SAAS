import React from 'react';
import StickyBottomBar from '../../ui/StickyBottomBar';
import DOBField from '../../DOBField';
import { Image as ImageIcon, MapPin } from 'lucide-react';

const Step2BodyDetails = ({ data, updateData, onNext, onPhotoChange, photoPreview, onRemovePhoto }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white">Body Details</h2>
                    <p className="text-gray-400 text-sm">Optional. Add photo and body metrics.</p>
                </div>

                <div className="flex flex-col items-center gap-3 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-900 overflow-hidden relative">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-gray-500" size={24} />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => document.getElementById('wizardPhotoInput').click()} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                            {photoPreview ? 'Change Photo' : 'Add Photo (Optional)'}
                        </button>
                        {photoPreview && (
                            <button type="button" onClick={onRemovePhoto} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg transition-colors font-medium">
                                Remove
                            </button>
                        )}
                        <input type="file" id="wizardPhotoInput" onChange={onPhotoChange} accept="image/jpeg, image/png, image/jpg" className="hidden" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Age</label>
                        <div className="relative">
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="Yrs"
                                value={data.age}
                                onChange={(e) => updateData({ age: e.target.value.replace(/\D/g, '').slice(0,2) })}
                                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Weight</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-xs font-bold">kg</span>
                            </div>
                            <input
                                type="tel"
                                inputMode="decimal"
                                placeholder="0.0"
                                value={data.weight}
                                onChange={(e) => updateData({ weight: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 text-white pl-4 pr-8 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Height</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-xs font-bold">cm</span>
                            </div>
                            <input
                                type="tel"
                                inputMode="decimal"
                                placeholder="0.0"
                                value={data.height}
                                onChange={(e) => updateData({ height: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 text-white pl-4 pr-8 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col justify-end">
                        <DOBField value={data.dob} onChange={(date) => updateData({ dob: date })} />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">City</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin size={16} className="text-gray-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter city"
                            value={data.city}
                            onChange={(e) => updateData({ city: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <StickyBottomBar>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onNext}
                        className="w-full font-bold py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-transform"
                    >
                        Next Step →
                    </button>
                    <button
                        onClick={onNext}
                        className="w-full text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </StickyBottomBar>
        </div>
    );
};

export default Step2BodyDetails;
