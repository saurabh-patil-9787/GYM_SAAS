import React from 'react';

const BicepCurlLoader = ({ text = "Processing...", fullScreen = true }) => {
    return (
        <div className={`${fullScreen ? 'fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm' : 'w-full py-12 min-h-[50vh]'} flex flex-col justify-center items-center`}>
            <div className="relative w-40 h-40 flex justify-center items-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    {/* Head */}
                    <circle cx="45" cy="20" r="10" fill="currentColor" />
                    
                    {/* Body */}
                    <path d="M 45 30 Q 55 50 45 75" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    
                    {/* Legs */}
                    <line x1="45" y1="75" x2="35" y2="95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    <line x1="45" y1="75" x2="65" y2="95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    
                    {/* Left Arm (back) */}
                    <line x1="45" y1="35" x2="35" y2="55" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                    
                    {/* Right Arm (front) */}
                    {/* Upper Arm */}
                    <line x1="45" y1="35" x2="60" y2="50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    
                    {/* Forearm and Dumbbell - Animating part */}
                    <g className="animate-curl" style={{ transformOrigin: '60px 50px' }}>
                        {/* Forearm */}
                        <line x1="60" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                        
                        {/* Hand */}
                        <circle cx="80" cy="50" r="3" fill="currentColor" />
                        
                        {/* Dumbbell */}
                        {/* Handle */}
                        <line x1="80" y1="42" x2="80" y2="58" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                        {/* Inner Weights */}
                        <rect x="76" y="37" width="8" height="8" fill="#94a3b8" rx="2" />
                        <rect x="76" y="55" width="8" height="8" fill="#94a3b8" rx="2" />
                        {/* Outer Weights */}
                        <rect x="73" y="33" width="14" height="5" fill="#64748b" rx="1" />
                        <rect x="73" y="62" width="14" height="5" fill="#64748b" rx="1" />
                    </g>
                </svg>

                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes curl {
                        0% { transform: rotate(10deg); }
                        50% { transform: rotate(-110deg); }
                        100% { transform: rotate(10deg); }
                    }
                    .animate-curl {
                        animation: curl 1.2s ease-in-out infinite;
                        will-change: transform;
                    }
                `}} />
            </div>
            <div className="mt-8 flex flex-col items-center">
                <p className="text-white text-xl font-bold tracking-wide animate-pulse bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
                    {text}
                </p>
                <p className="mt-2 text-gray-400 font-medium tracking-widest uppercase text-sm">
                    Stay Strong! 💪
                </p>
            </div>
        </div>
    );
};

export default BicepCurlLoader;
