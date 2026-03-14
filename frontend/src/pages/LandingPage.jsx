import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center relative overflow-hidden">
            {/* Animated Background Gradient */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/30 z-0"
                animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
            />

            <div className="z-10 text-center px-4 w-full flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                    className="mb-8 flex justify-center"
                >
                    <div className="p-4 bg-purple-600 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.6)] animate-pulse">
                        <Dumbbell size={64} className="text-white" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400"
                >
                    TalimTrack
                </motion.h1>

                <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                    className="text-2xl md:text-3xl font-medium text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed"
                >
                    मॅन्युअल रजिस्टरला करा गुडबाय  मेंबर, फी आणि एक्सपायरी ट्रॅकिंग आता एका <span className="text-purple-400 font-bold">Smart App मध्ये</span>
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-sm mx-auto"
                >
                    <Link to="/login" className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-white text-purple-900 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transform hover:-translate-y-1 w-full">
                        <Dumbbell className="group-hover:rotate-12 transition-transform" />
                        My Gym Login
                    </Link>

                    {/*<Link to="/admin/login" className="group flex items-center justify-center gap-3 px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all hover:text-white transform hover:-translate-y-1">
                        <ShieldCheck className="group-hover:scale-110 transition-transform" />
                        Admin Access
                    </Link>*/}
                </motion.div>
            </div>

            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-10 right-10 opacity-10 hidden md:block pointer-events-none"
            >
                <Dumbbell size={350} />
            </motion.div>
        </div>
    );
};

export default LandingPage;
