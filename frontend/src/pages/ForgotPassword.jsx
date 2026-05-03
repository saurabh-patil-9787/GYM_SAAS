import React, { useState } from 'react';
import api from '../api/axios';
import Input from '../components/Input';
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
        setIsLoading(true); setMessage(''); setError('');
        try {
            const res = await api.post('/api/auth/forgotpassword', { email });
            setMessage(res.data.message || 'If an account with that email exists, a password reset link has been sent.');
            setEmail('');
        } catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center items-center px-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-indigo-50 rounded-full mb-4 border border-indigo-100">
                        <KeyRound className="text-indigo-600" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Forgot Password</h2>
                    <p className="text-slate-500 mt-2">Enter your registered email to receive a reset link</p>
                </div>
                {message && (<div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"><CheckCircle size={20} />{message}</div>)}
                {error && (<div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg mb-6 text-center">{error}</div>)}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email Address</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-slate-400" /></div>
                            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2.5 bg-white text-slate-800 placeholder-slate-400 border" placeholder="Enter registered email" />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={20} />
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
