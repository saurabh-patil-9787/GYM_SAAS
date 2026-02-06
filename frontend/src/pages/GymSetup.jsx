import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import { Building2, CheckCircle } from 'lucide-react';

const GymSetup = () => {
    const [gymName, setGymName] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/gym', { gymName, city, pincode, joiningDate });
            // Update context to reflect gym ownership
            updateUser({ hasGym: true, gymId: res.data._id });
            navigate('/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to setup gym');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex justify-center items-center px-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-700">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-green-600/20 rounded-full mb-4">
                        <Building2 className="text-green-500" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Setup Your Gym</h2>
                    <p className="text-gray-400 mt-2">Tell us about your fitness center</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input label="Gym Name" value={gymName} onChange={(e) => setGymName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
                        <Input label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                    </div>
                    <Input label="Established Date" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />

                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
                        Complete Setup <CheckCircle size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GymSetup;
