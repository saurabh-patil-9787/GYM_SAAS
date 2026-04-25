import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import { Dumbbell, UserPlus } from 'lucide-react';
import SuccessModal from '../components/common/SuccessModal';

const Register = () => {
    const [formData, setFormData] = useState({
        ownerName: '',
        mobile: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await register(formData);
            setShowSuccessModal(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f1a] flex justify-center items-center p-4 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="bg-[#13131f]/80 p-8 rounded-3xl w-full max-w-md border border-white/[0.05] backdrop-blur-xl shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                        <Dumbbell className="text-blue-400" size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Join TrackON</h2>
                    <p className="text-gray-400 mt-2 text-sm">Start managing your gym digitally</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6 ${
                            isLoading 
                            ? 'bg-gray-600 cursor-not-allowed opacity-70' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] active:scale-[0.98]'
                        }`}
                    >
                        {isLoading ? 'Creating Account...' : (
                            <>
                                Create Account <UserPlus size={18} strokeWidth={2.5} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400 border-t border-white/[0.05] pt-6">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors">Login here</Link>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => {}} // Empty function, prevent closing by clicking X if we hide it
                showCloseIcon={false}
                showCloseButton={false}
                title="Account Created Successfully"
                subtitle="Welcome to TrackON 🚀"
                actionText="Login with your number and password to setup your gym"
                onAction={() => navigate('/login')}
            />
        </div>
    );
};

export default Register;
