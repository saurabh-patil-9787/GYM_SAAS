import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Power, PowerOff, Search, Activity, Users, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' or 'expired'

    const [showRenewModal, setShowRenewModal] = useState(false);
    const [selectedGym, setSelectedGym] = useState(null);
    const [renewDuration, setRenewDuration] = useState('1'); // 1, 3, 6, 12
    const [renewalType, setRenewalType] = useState('Continue Plan');
    const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [gymToDelete, setGymToDelete] = useState(null);

    const fetchGyms = async () => {
        try {
            const res = await api.get('/api/gym/all');
            setGyms(res.data);
        } catch (error) {
            console.error("Failed to fetch gyms");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGyms();
    }, []);

    const handleToggleStatus = async (id) => {
        try {
            await api.put(`/api/gym/${id}/toggle`);
            setGyms(gyms.map(gym =>
                gym._id === id ? { ...gym, isActive: !gym.isActive } : gym
            ));
        } catch (error) {
            console.error("Failed to update status");
            alert('Failed to update status');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    // Calculate Expiry Date Helper (Fallback if backend doesn't have it)
    const getExpiryDate = (gym) => {
        if (gym.expiryDate) return new Date(gym.expiryDate);

        const date = new Date(gym.joiningDate);
        date.setDate(date.getDate() + 30);
        return date;
    };

    const isExpired = (gym) => {
        return getExpiryDate(gym) < new Date();
    };

    const openRenewModal = (gym) => {
        setSelectedGym(gym);
        setRenewDuration('1');
        setRenewalType('Continue Plan');
        setPlanStartDate(new Date().toISOString().split('T')[0]);
        setShowRenewModal(true);
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/api/gym/renew/${selectedGym._id}`, { 
                duration: renewDuration,
                renewalType,
                planStartDate 
            });
            // Update local state
            setGyms(gyms.map(gym =>
                gym._id === selectedGym._id ? { ...gym, expiryDate: res.data.expiryDate, isActive: true } : gym
            ));
            setShowRenewModal(false);
            alert(`Plan renewed successfully!`);
        } catch (error) {
            console.error("Renewal failed", error);
            alert('Failed to renew plan');
        }
    };

    const confirmDelete = (gym) => {
        setGymToDelete(gym);
        setShowDeleteModal(true);
    };

    const handleDeleteSubmit = async () => {
        try {
            await api.delete(`/api/gym/${gymToDelete._id}`);
            setGyms(gyms.filter(g => g._id !== gymToDelete._id));
            setShowDeleteModal(false);
            setGymToDelete(null);
            alert('Gym and all associated data deleted successfully!');
        } catch (error) {
            console.error("Delete failed", error);
            alert('Failed to delete gym');
        }
    };

    const handleExportMembers = async (gym) => {
        try {
            const res = await api.get(`/api/members/gym/${gym._id}`);
            const members = res.data;

            if (members.length === 0) {
                alert('No members found for this gym.');
                return;
            }

            const dataToExport = members.map(m => ({
                'Member ID': m.memberId,
                'Name': m.name,
                'Mobile': m.mobile,
                'City': m.city || 'N/A',
                'Status': m.status,
                'Plan Duration (Months)': m.planDuration,
                'Joining Date': new Date(m.joiningDate).toLocaleDateString(),
                'Expiry Date': new Date(m.expiryDate).toLocaleDateString(),
                'Total Fee': m.totalFee,
                'Paid Fee': m.paidFee,
                'Pending Amount': m.pendingAmount,
                'Expired': m.isPlanExpired ? 'Yes' : 'No'
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Members");

            // Generate filename based on gym name and date
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `${gym.gymName.replace(/[^a-z0-9]/gi, '_')}_Members_${dateStr}.xlsx`;

            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Export failed", error);
            alert('Failed to export members');
        }
    };

    const filteredGyms = gyms.filter(gym => {
        const matchesSearch = gym.gymName.toLowerCase().includes(search.toLowerCase()) ||
            gym.owner?.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
            gym.owner?.mobile?.includes(search);

        const gymIsExpired = isExpired(gym);

        if (filter === 'expired') {
            return matchesSearch && gymIsExpired;
        }
        return matchesSearch;
    });

    const expiredCount = gyms.filter(g => isExpired(g)).length;

    if (loading) return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600/20 p-2 rounded-lg">
                            <Activity className="text-purple-500" size={24} />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Admin Control
                        </h1>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                {/* Stats & Filter */}
                <div className="flex flex-col xl:flex-row justify-between items-center gap-6 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto">
                        <div
                            onClick={() => setFilter('all')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${filter === 'all' ? 'bg-gray-800 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                        >
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-bold text-white">{gyms.length}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Active</p>
                            <p className="text-2xl font-bold text-green-400">{gyms.filter(g => g.isActive).length}</p>
                        </div>
                        <div
                            onClick={() => setFilter(filter === 'expired' ? 'all' : 'expired')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${filter === 'expired' ? 'bg-red-900/20 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-gray-800 border-gray-700 hover:border-red-500/50'}`}
                        >
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Expired</p>
                            <p className="text-2xl font-bold text-red-400">{expiredCount}</p>
                        </div>
                    </div>

                    <div className="relative w-full xl:w-96">
                        <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search Gyms..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* Gym List */}
                <div className="grid gap-4">
                    {filteredGyms.map((gym) => {
                        const expired = isExpired(gym);
                        return (
                            <div key={gym._id} className={`bg-gray-800 p-4 md:p-6 rounded-xl border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-all ${expired ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-gray-700 hover:border-gray-600'}`}>

                                <div className="flex items-start gap-4 w-full lg:w-auto">
                                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold text-white ${gym.isActive ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
                                        {gym.gymName.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-lg flex flex-wrap items-center gap-2">
                                            {gym.gymName}
                                            {!gym.isActive && <span className="bg-red-500/20 text-red-500 text-xs px-2 py-0.5 rounded-full">Inactive</span>}
                                            {expired && <span className="bg-orange-500/20 text-orange-500 text-xs px-2 py-0.5 rounded-full border border-orange-500/30">Expired</span>}
                                        </h3>
                                        <div className="text-sm text-gray-400 mt-2 space-y-1">
                                            <p className="flex items-center gap-2"><Users size={14} /> <span className="text-gray-300">{gym.owner?.ownerName}</span></p>
                                            <p className="text-xs">{gym.owner?.mobile} • {gym.city}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 border-gray-700 pt-4 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">
                                    <div className="flex flex-row sm:flex-col justify-between w-full sm:w-auto gap-4 sm:gap-0 sm:text-right mr-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Joined</p>
                                            <p className="text-sm text-gray-300 mb-1">{new Date(gym.joiningDate).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Expires</p>
                                            <p className={`text-sm font-semibold ${expired ? 'text-red-400' : 'text-green-400'}`}>
                                                {getExpiryDate(gym).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleExportMembers(gym)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all text-sm"
                                            title="Export Members"
                                        >
                                            <Download size={18} /> <span className="sm:hidden lg:inline">Export</span>
                                        </button>

                                        <button
                                            onClick={() => openRenewModal(gym)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all"
                                            title="Renew Plan"
                                        >
                                            <span className="text-lg">↻</span> <span className="sm:hidden lg:inline">Renew</span>
                                        </button>

                                        <button
                                            onClick={() => confirmDelete(gym)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-red-800/20 text-red-500 hover:bg-red-800/40 transition-all text-sm"
                                            title="Delete Gym"
                                        >
                                            <Trash2 size={18} /> <span className="sm:hidden">Delete</span>
                                        </button>

                                        <button
                                            onClick={() => handleToggleStatus(gym._id)}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${gym.isActive
                                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                }`}
                                        >
                                            {gym.isActive ? (
                                                <>
                                                    <PowerOff size={18} /> <span className="sm:hidden">Stop</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Power size={18} /> <span className="sm:hidden">Start</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredGyms.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                            No gyms found matching your criteria.
                        </div>
                    )}
                </div>

                {/* Renew Modal */}
                {showRenewModal && selectedGym && (
                    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
                            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                                <h3 className="text-xl font-bold text-white">Renew Gym Plan</h3>
                                <button onClick={() => setShowRenewModal(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>
                            <form onSubmit={handleRenewSubmit} className="p-6">
                                <p className="text-gray-400 mb-4">Renew plan for: <span className="text-white font-semibold">{selectedGym.gymName}</span></p>
                                <p className="text-sm text-gray-500 mb-4">Current Expiry: {getExpiryDate(selectedGym).toLocaleDateString('en-GB')}</p>

                                <div className="mb-6">
                                    <label className="block text-gray-400 text-sm font-bold mb-2">Select Duration</label>
                                    <select
                                        value={renewDuration}
                                        onChange={(e) => setRenewDuration(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-purple-500 mb-4"
                                    >
                                        <option value="1">1 Month (30 Days)</option>
                                        <option value="3">3 Months (90 Days)</option>
                                        <option value="6">6 Months (180 Days)</option>
                                        <option value="12">1 Year (365 Days)</option>
                                    </select>

                                    <label className="block text-gray-400 text-sm font-bold mb-2">Renewal Type</label>
                                    <select
                                        value={renewalType}
                                        onChange={(e) => setRenewalType(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="Continue Plan">Continue Plan (From Expiry)</option>
                                        <option value="Start Fresh">Start Fresh (From Specific Date)</option>
                                    </select>
                                </div>

                                {renewalType === 'Start Fresh' && (
                                    <div className="mb-6">
                                        <label className="block text-gray-400 text-sm font-bold mb-2">Select Start Date</label>
                                        <input
                                            type="date"
                                            value={planStartDate}
                                            onChange={(e) => setPlanStartDate(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-purple-500 [&::-webkit-calendar-picker-indicator]:filter-invert"
                                        />
                                    </div>
                                )}


                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                                    Confirm Renewal
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            {/* Delete Modal */}
            {showDeleteModal && gymToDelete && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-red-500/50">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-red-900/20">
                            <h3 className="text-xl font-bold text-red-500 flex items-center gap-2"><Trash2 size={20} /> Delete Gym</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-300 mb-2">Are you sure you want to completely delete <span className="text-white font-bold">{gymToDelete.gymName}</span>?</p>
                            <p className="text-red-400 text-sm font-bold mb-6">WARNING: This will permanently delete the gym, the gym owner's account, all members, and all payment history associated with this gym. This cannot be undone.</p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteSubmit}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    Delete Gym
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            </main>
        </div>
    );
};

export default AdminDashboard;
