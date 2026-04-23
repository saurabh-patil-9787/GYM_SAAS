import React from 'react';

const StickyBottomBar = ({ children }) => {
    return (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-700 shadow-[0_-20px_30px_rgba(0,0,0,0.5)] z-50 rounded-b-2xl">
            {children}
        </div>
    );
};

export default StickyBottomBar;
