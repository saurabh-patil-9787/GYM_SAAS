import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Dumbbell, ArrowLeft, Building2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

const FindGym = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const navigate = useNavigate();

    // Debounced search
    const searchTimeoutRef = React.useRef(null);

    const handleSearch = useCallback((value) => {
        setQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.trim().length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/gyms/search?q=${encodeURIComponent(value.trim())}`);
                setResults(res.data);
                setSearched(true);
            } catch (err) {
                console.error('Search failed:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    }, []);

    const handleSelectGym = (gym) => {
        navigate('/member/login', { state: { selectedGym: gym } });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 mt-8 md:mt-16">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </button>

                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-5 shadow-lg shadow-indigo-200">
                        <Building2 className="text-white" size={30} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Find Your Gym</h1>
                    <p className="text-slate-500 mt-2 text-sm">Search by gym name to get started</p>
                </motion.div>

                {/* Search Box */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-6"
                >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={18} className={loading ? 'text-indigo-500 animate-pulse' : 'text-slate-400'} />
                    </div>
                    <input
                        id="gym-search-input"
                        type="text"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Type gym name to search..."
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all duration-200"
                        autoFocus
                    />
                </motion.div>

                {/* Results */}
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center py-8"
                        >
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                    )}

                    {!loading && searched && results.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-10"
                        >
                            <Dumbbell size={40} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-medium">No gyms found for "{query}"</p>
                            <p className="text-slate-400 text-xs mt-1">Try a different name</p>
                        </motion.div>
                    )}

                    {!loading && results.length > 0 && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider px-1 mb-3">
                                {results.length} {results.length === 1 ? 'gym' : 'gyms'} found
                            </p>
                            {results.map((gym, index) => (
                                <motion.div
                                    key={gym._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelectGym(gym)}
                                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all duration-200 group hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Gym Logo / Initials */}
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                                            {gym.logoUrl ? (
                                                <img src={gym.logoUrl} alt={gym.gymName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white font-bold text-lg">
                                                    {gym.gymName?.charAt(0)?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Gym Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                                {gym.gymName}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                                                <span className="text-xs text-slate-500 truncate">
                                                    {gym.city}{gym.pincode ? ` — ${gym.pincode}` : ''}
                                                </span>
                                            </div>
                                            {gym.contactNumber && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Phone size={11} className="text-slate-400 flex-shrink-0" />
                                                    <span className="text-xs text-slate-400 font-medium">{gym.contactNumber}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Select Arrow */}
                                        <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m9 18 6-6-6-6"/>
                                            </svg>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Instruction when no search */}
                {!searched && !loading && query.length < 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center py-10"
                    >
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-indigo-400" />
                        </div>
                        <p className="text-slate-500 text-sm">Enter at least 2 characters to search</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FindGym;
