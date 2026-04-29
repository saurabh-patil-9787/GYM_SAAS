import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import { Dumbbell, ArrowRight } from 'lucide-react';

const Login = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login(mobile, password);
            if (data.role === 'owner') {
                // Prefetch critical dashboard chunks in background for instant navigation
                import('../layouts/DashboardLayout');
                import('../pages/dashboard/DashboardStats');
                import('../pages/dashboard/MembersPage');

                if (data.hasGym) {
                    navigate('/dashboard');
                } else {
                    navigate('/gym-setup');
                }
            } else {
                setError('An unexpected error occurred. Please contact support.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f1a] flex justify-center items-center p-4 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="bg-[#13131f]/80 p-8 rounded-3xl w-full max-w-md border border-white/[0.05] backdrop-blur-xl shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/[0.08] mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                        <Dumbbell className="text-purple-400" size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-gray-400 mt-2 text-sm">Login to manage your gym</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Mobile Number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter registered mobile"
                        pattern="^[0-9]{10}$"
                        minLength={10}
                        maxLength={10}
                        title="Mobile number must be exactly 10 digits"
                        error={mobile.length > 0 && mobile.length < 10 ? "Mobile number must be exactly 10 digits" : ""}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={8}
                        title="Password must be at least 8 characters long"
                        required
                    />

                    <div className="flex justify-end pt-1 pb-4">
                        <Link to="/forgot-password" className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">Forgot Password?</Link>
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] active:scale-[0.98]">
                        Login Now <ArrowRight size={18} strokeWidth={2.5} />
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400 border-t border-white/[0.05] pt-6">
                    Don't have an account? <Link to="/register" className="text-purple-400 hover:text-purple-300 font-bold ml-1 transition-colors">Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
