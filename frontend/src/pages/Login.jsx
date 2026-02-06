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
        <div className="min-h-screen bg-gray-900 flex justify-center items-center px-4">
            <div className="bg-gray-800/50 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700/50 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-purple-600/20 rounded-full mb-4">
                        <Dumbbell className="text-purple-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="text-gray-400 mt-2">Login to manage your gym</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Mobile Number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Enter registered mobile"
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <div className="flex justify-end mb-4">
                        <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">Forgot Password?</Link>
                    </div>

                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
                        Login Now <ArrowRight size={20} />
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-400">
                    Don't have an account? <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold">Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
