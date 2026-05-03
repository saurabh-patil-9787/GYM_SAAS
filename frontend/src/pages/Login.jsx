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
        <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4 relative overflow-hidden">
            {/* Subtle decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="bg-white p-8 rounded-2xl w-full max-w-md border border-slate-200 shadow-lg relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-6 shadow-lg shadow-indigo-200">
                        <Dumbbell className="text-white" size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-500 mt-2 text-sm">Login to manage your gym</p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium">
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
                        <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Forgot Password?</Link>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-[0.98]">
                        Login Now <ArrowRight size={18} strokeWidth={2.5} />
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
                    Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold ml-1 transition-colors">Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
