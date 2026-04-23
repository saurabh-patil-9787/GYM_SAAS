import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const VersionChecker = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        let interval;
        const checkVersion = async () => {
            // Only check in production or if not in dev mode to avoid false positives
            if (import.meta.env.DEV) return;
            
            try {
                const res = await fetch(`/?t=${Date.now()}`, { cache: 'no-store' });
                const text = await res.text();
                
                const currentScripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
                
                const newScriptsPattern = /<script[^>]+src=["']([^"']+)["']/g;
                let match;
                let foundNew = false;
                
                while ((match = newScriptsPattern.exec(text)) !== null) {
                    const newScriptSrc = match[1];
                    const isViteChunk = newScriptSrc.includes('assets/index-');
                    // Check if we don't have this exact script src loaded
                    if (isViteChunk && !currentScripts.some(src => src.endsWith(newScriptSrc))) {
                        foundNew = true;
                        break;
                    }
                }
                
                if (foundNew) {
                    setUpdateAvailable(true);
                }
            } catch (err) {
                // Ignore network errors
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkVersion();
            }
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also check every 30 minutes
        interval = setInterval(checkVersion, 1000 * 60 * 30);

        // Catch chunk load errors globally
        const handleChunkError = (e) => {
            if (e.message && e.message.toLowerCase().includes('failed to fetch dynamically imported module')) {
                setUpdateAvailable(true);
            }
        };
        window.addEventListener('unhandledrejection', handleChunkError);

        return () => {
            clearInterval(interval);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('unhandledrejection', handleChunkError);
        };
    }, []);

    if (!updateAvailable) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] bg-gray-900 border border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.4)] text-white px-5 py-3 rounded-full flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <span className="font-medium text-sm whitespace-nowrap">App Update Available ✨</span>
            <button 
                onClick={() => window.location.reload(true)} 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
                <RefreshCw size={14} />
                Update Now
            </button>
        </div>
    );
};

export default VersionChecker;
