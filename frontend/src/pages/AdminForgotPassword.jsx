import React, { useState } from 'react';
import api from '../api/axios';
import Input from '../components/Input';
import { ShieldAlert, ArrowRight, CheckCircle, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminForgotPassword = () => {
    // Form State
    const [currentUsername, setCurrentUsername] = useState('admin');
    const [newUsername, setNewUsername] = useState('admin');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');

    // UI State
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/auth/admin/reset-direct', {
                currentUsername,
                newUsername,
                newPassword,
                recoveryKey
            });
            setMessage('Credentials updated successfully. Please login.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex justify-center items-center px-4">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-yellow-600/20 rounded-full mb-4">
                        <ShieldAlert className="text-yellow-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Reset Credentials</h2>
                    <p className="text-gray-400 mt-2 text-sm">Directly reset Admin Username & Password</p>
                </div>

                {message && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
                        <CheckCircle size={18} />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-center text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <h3 className="text-gray-300 text-sm font-semibold mb-3">Identity Verification</h3>
                        <Input
                            label="Current Username"
                            value={currentUsername}
                            onChange={(e) => setCurrentUsername(e.target.value)}
                            placeholder="admin"
                            required
                            className="border-gray-700 bg-gray-900"
                        />
                        <Input
                            label="Secret Recovery Key"
                            type="password"
                            value={recoveryKey}
                            onChange={(e) => setRecoveryKey(e.target.value)}
                            placeholder="Enter the secret recovery key"
                            required
                            className="border-gray-700 bg-gray-900"
                        />
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-3">
                        <h3 className="text-gray-300 text-sm font-semibold mb-3">New Credentials</h3>
                        <Input
                            label="New Username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="New Username"
                            required
                            className="border-gray-700 bg-gray-900"
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            required
                            className="border-gray-700 bg-gray-900"
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            required
                            className="border-gray-700 bg-gray-900"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Updating...' : 'Update Credentials'} <ArrowRight size={20} />
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-500 text-sm">
                    <Link to="/admin/login" className="hover:text-yellow-400">Back to Admin Login</Link>
                </div>
            </div>
        </div>
    );
};

export default AdminForgotPassword;
