import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import { Dumbbell, UserPlus } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        ownerName: '',
        mobile: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(formData);
            navigate('/gym-setup'); // New users always go to setup
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex justify-center items-center px-4">
            <div className="bg-gray-800/50 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700/50 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-purple-600/20 rounded-full mb-4">
                        <Dumbbell className="text-purple-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Join TrackON</h2>
                    <p className="text-gray-400 mt-2">Start managing your gym digitally</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Full Name"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        maxLength={50}
                        required
                    />
                    <Input
                        label="Mobile Number"
                        name="mobile"
                        value={formData.mobile}
                        onChange={(e) => handleChange({ target: { name: 'mobile', value: e.target.value.replace(/\D/g, '') } })}
                        placeholder="10-digit mobile number"
                        pattern="^[0-9]{10}$"
                        minLength={10}
                        maxLength={10}
                        title="Mobile number must be exactly 10 digits"
                        error={formData.mobile.length > 0 && formData.mobile.length < 10 ? "Mobile number must be exactly 10 digits" : ""}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        minLength={8}
                        title="Password must be at least 8 characters long"
                        required
                    />

                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
                        Create Account <UserPlus size={20} />
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">Login here</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
