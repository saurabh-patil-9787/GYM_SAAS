import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Input from '../../components/Input';
import { Save } from 'lucide-react';

const GymSettingsPage = () => {
    const [gymData, setGymData] = useState({
        gymName: '',
        city: '',
        pincode: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGym = async () => {
            try {
                const res = await api.get('/api/gym/me');
                setGymData({
                    gymName: res.data.gymName,
                    city: res.data.city,
                    pincode: res.data.pincode
                });
            } catch (error) {
                console.error("Failed to fetch gym");
            } finally {
                setLoading(false);
            }
        };

        fetchGym();
    }, []);

    const handleChange = (e) => {
        setGymData({ ...gymData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/api/gym/me', gymData);
            alert('Gym details updated successfully!');
        } catch (error) {
            alert('Failed to update gym details');
        }
    };

    if (loading) return <div>Loading Settings...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Gym Settings</h2>

            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Gym Name"
                        name="gymName"
                        value={gymData.gymName}
                        onChange={handleChange}
                        required
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <Input
                            label="City"
                            name="city"
                            value={gymData.city}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Pincode"
                            name="pincode"
                            value={gymData.pincode}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4"
                    >
                        <Save size={20} />
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GymSettingsPage;
