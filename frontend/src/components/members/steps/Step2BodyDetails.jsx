import React from 'react';
import StickyBottomBar from '../../ui/StickyBottomBar';
import DOBField from '../../DOBField';
import { Image as ImageIcon } from 'lucide-react';

const Field = ({ label, children }) => <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">{label}{children}</label>;

export default function Step2BodyDetails({ data, updateData, onNext, onPhotoChange, photoPreview, onRemovePhoto }) {
    return <div className="flex h-full flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-5 pb-7 sm:p-7 sm:pb-8">
            <div className="mb-6"><h2 className="text-2xl font-black text-slate-800">Body Details</h2><p className="mt-1 text-sm text-slate-500">Optional information that helps personalize the member profile.</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-indigo-200 bg-white shadow-sm">{photoPreview ? <img src={photoPreview} alt="Member preview" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-indigo-300"><ImageIcon size={25} /></span>}</div>
                    <div className="min-w-0"><p className="font-bold text-slate-700">Member photo</p><p className="mt-0.5 text-xs leading-5 text-slate-500">Use a clear face photo for easy recognition in the member list.</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => document.getElementById('wizardPhotoInput').click()} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-indigo-600 ring-1 ring-slate-200 hover:bg-indigo-50">{photoPreview ? 'Change photo' : 'Upload photo'}</button>{photoPreview && <button type="button" onClick={onRemovePhoto} className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Remove</button>}</div></div>
                    <input type="file" id="wizardPhotoInput" onChange={(event) => { onPhotoChange(event); event.target.value = ''; }} accept="image/jpeg,image/png,image/jpg" className="hidden" />
                </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Age"><input type="tel" inputMode="numeric" placeholder="Years" value={data.age} onChange={(e) => updateData({ age: e.target.value.replace(/\D/g, '').slice(0, 2) })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></Field>
                <Field label="Weight"><input type="tel" inputMode="decimal" placeholder="kg" value={data.weight} onChange={(e) => updateData({ weight: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></Field>
                <Field label="Height"><input type="tel" inputMode="decimal" placeholder="cm" value={data.height} onChange={(e) => updateData({ height: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></Field>
                <div className="min-w-0"><DOBField value={data.dob} onChange={(date) => updateData({ dob: date })} /></div>
            </div>
        </div>
        <StickyBottomBar><div className="mx-auto w-full max-w-3xl"><button onClick={onNext} className="w-full rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-sm transition hover:bg-indigo-700">Continue to plan & payment</button><button onClick={onNext} className="mt-2 w-full py-1.5 text-sm font-semibold text-slate-400 hover:text-slate-700">Skip optional details</button></div></StickyBottomBar>
    </div>;
}
