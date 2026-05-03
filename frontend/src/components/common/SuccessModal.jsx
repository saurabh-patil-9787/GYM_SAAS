import React from 'react';

const SuccessModal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    data = [],
    actionText,
    onAction,
    secondaryActionText,
    onSecondaryAction,
    secondaryIcon,
    secondaryVariant = 'default', // 'whatsapp', 'default'
    showCloseIcon = true,
    showCloseButton = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4 transition-all duration-300">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-emerald-200 shadow-2xl overflow-hidden relative transition-all duration-300 border-b-0 sm:border-b">
                <div className="flex justify-center pt-3 pb-1 sm:hidden absolute top-0 w-full z-10">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>
                
                {/* Header Banner */}
                <div className="bg-emerald-50 p-6 pt-8 border-b border-emerald-100 flex flex-col items-center justify-center relative">
                    {showCloseIcon && (
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all z-10">✕</button>
                    )}
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 ring-4 ring-emerald-50">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 text-center">{title}</h3>
                    {subtitle && <p className="text-emerald-600 text-sm mt-1 text-center font-medium">{subtitle}</p>}
                </div>
                
                {/* Body Content */}
                <div className="p-5">
                    {data && data.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                            {data.map((item, idx) => (
                                <div key={idx} className={`flex justify-between items-center ${idx !== data.length - 1 ? 'mb-2 pb-2 border-b border-slate-100' : 'pt-1'}`}>
                                    <span className="text-slate-500 text-sm font-medium">{item.label}</span>
                                    <span className={item.highlight ? 'text-emerald-600 font-bold' : 'text-slate-800 font-semibold'}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        {onAction && actionText && (
                            <button 
                                onClick={onAction} 
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-[0.98]"
                            >
                                {actionText}
                            </button>
                        )}
                        {onSecondaryAction && secondaryActionText && (
                            <button 
                                onClick={onSecondaryAction} 
                                className={`w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                                    secondaryVariant === 'whatsapp' 
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                }`}
                            >
                                {secondaryIcon}
                                {secondaryActionText}
                            </button>
                        )}
                        {showCloseButton && (
                            <button 
                                onClick={onClose} 
                                className="w-full px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium border border-slate-200 transition-all duration-200 active:scale-[0.98]"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
