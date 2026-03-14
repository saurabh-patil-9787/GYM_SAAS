import React, { useState } from 'react';
import api from '../api/axios';
import Input from '../components/Input';
//import { KeyRound, ArrowRight, CheckCircle, phone } from 'lucide-react';
import { KeyRound, ArrowRight, CheckCircle, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await api.post('/api/auth/forgotpassword', { email });
            setMessage(res.data.message || 'If an account with that email exists, a password reset link has been sent.');
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex justify-center items-center px-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-600/20 rounded-full mb-4">
                        <KeyRound className="text-blue-500" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
                    <p className="text-gray-400 mt-2">Enter your registered email to receive a reset link</p>
                </div>

                {message && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <CheckCircle size={20} />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                            Email Address
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-600 rounded-md py-2 bg-gray-700 text-white placeholder-gray-400"
                                placeholder="Enter registered email"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={20} />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
