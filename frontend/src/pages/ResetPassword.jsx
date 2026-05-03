import React, { useState } from 'react';
import api from '../api/axios';
import Input from '../components/Input';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const res = await api.put(`/api/auth/resetpassword/${token}`, { password });
            setMessage('Password reset successful. Please login with your new password.');
            setTimeout(() => { navigate('/login'); }, 2000);
        } catch (err) { setError(err.response?.data?.message || 'Failed to reset password'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center items-center px-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-indigo-50 rounded-full mb-4 border border-indigo-100">
                        <Lock className="text-indigo-600" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Reset Password</h2>
                    <p className="text-slate-500 mt-2">Enter your new password below</p>
                </div>
                {message && (<div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"><CheckCircle size={20} />{message}</div>)}
                {error && (<div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg mb-6 text-center">{error}</div>)}
                <form onSubmit={handleSubmit}>
                    <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                    <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                    <button type="submit" disabled={loading} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {loading ? 'Reseting...' : 'Reset Password'} <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
