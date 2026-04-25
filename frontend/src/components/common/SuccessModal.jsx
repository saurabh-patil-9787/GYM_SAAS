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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4 transition-all duration-300">
            <div className="bg-[#13131f] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-emerald-500/50 shadow-2xl overflow-hidden relative transition-all duration-300 border-b-0 sm:border-b">
                <div className="flex justify-center pt-3 pb-1 sm:hidden absolute top-0 w-full z-10">
                    <div className="w-10 h-1 rounded-full bg-white/[0.2]" />
                </div>
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 p-6 pt-8 border-b border-emerald-500/20 flex flex-col items-center justify-center relative">
                    {showCloseIcon && (
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.08] transition-all z-10">✕</button>
                    )}
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3 ring-4 ring-emerald-500/10">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">{title}</h3>
                    {subtitle && <p className="text-emerald-400 text-sm mt-1 text-center font-medium">{subtitle}</p>}
                </div>
                
                {/* Body Content */}
                <div className="p-5">
                    {data && data.length > 0 && (
                        <div className="bg-white/[0.03] rounded-xl p-4 mb-5 border border-white/[0.08]">
                            {data.map((item, idx) => (
                                <div key={idx} className={`flex justify-between items-center ${idx !== data.length - 1 ? 'mb-2 pb-2 border-b border-white/[0.05]' : 'pt-1'}`}>
                                    <span className="text-gray-400 text-sm font-medium">{item.label}</span>
                                    <span className={item.highlight ? 'text-emerald-400 font-bold' : 'text-white font-semibold'}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        {onAction && actionText && (
                            <button 
                                onClick={onAction} 
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
                            >
                                {actionText}
                            </button>
                        )}
                        {onSecondaryAction && secondaryActionText && (
                            <button 
                                onClick={onSecondaryAction} 
                                className={`w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                                    secondaryVariant === 'whatsapp' 
                                    ? 'bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30'
                                    : 'bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 hover:text-white border border-white/[0.09] hover:border-white/[0.15]'
                                }`}
                            >
                                {secondaryIcon}
                                {secondaryActionText}
                            </button>
                        )}
                        {showCloseButton && (
                            <button 
                                onClick={onClose} 
                                className="w-full px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 hover:text-white text-sm font-medium border border-white/[0.09] hover:border-white/[0.15] transition-all duration-200 active:scale-[0.98]"
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
