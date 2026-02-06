import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 z-0"></div>

            <div className="z-10 text-center px-4">
                <div className="mb-8 flex justify-center">
                    <div className="p-4 bg-purple-600 rounded-full shadow-lg shadow-purple-500/50 animate-pulse">
                        <Dumbbell size={64} className="text-white" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    GymTrack
                </h1>
                <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                    The ultimate solution for modern gym owners. Manage members, payments, and plans with style and ease.
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-md mx-auto">
                    <Link to="/login" className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-purple-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                        <Dumbbell className="group-hover:rotate-12 transition-transform" />
                        My Gym Login
                    </Link>

                    {/* <Link to="/admin/login" className="group flex items-center justify-center gap-3 px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all hover:text-white transform hover:-translate-y-1">
                        <ShieldCheck className="group-hover:scale-110 transition-transform" />
                        Admin Access
                    </Link> */}
                </div>
            </div>

            <div className="absolute bottom-10 right-10 opacity-20 hidden md:block">
                <Dumbbell size={300} />
            </div>
        </div>
    );
};

export default LandingPage;
