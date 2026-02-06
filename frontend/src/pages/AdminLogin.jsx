import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import { ShieldAlert, Lock } from 'lucide-react';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { adminLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await adminLogin(username, password);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-black flex justify-center items-center px-4">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-red-600/20 rounded-full mb-4">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Admin Portal</h2>
                    <p className="text-gray-400 mt-2">Restricted Access</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Admin Username"
                        required
                        className="border-gray-800 bg-gray-950"
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="border-gray-800 bg-gray-950"
                    />

                    <div className="flex justify-end mt-2">
                        <Link to="/admin/forgot-password" className="text-sm text-red-500 hover:text-red-400">Forgot Password?</Link>
                    </div>

                    <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
                        Access Dashboard <Lock size={20} />
                    </button>
                </form>
                <div className="mt-6 text-center text-gray-500 text-sm">
                    <Link to="/" className="hover:text-gray-300">Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
