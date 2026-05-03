import React from 'react';

const StickyBottomBar = ({ children }) => {
    return (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50 rounded-b-2xl">
            {children}
        </div>
    );
};

export default StickyBottomBar;
