import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Power, PowerOff, Search, Activity, Users, Download, Trash2, Settings, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BicepCurlLoader from '../components/BicepCurlLoader';

import AdminSubscriptionSettings from '../components/AdminSubscriptionSettings';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' or 'expired'
    const [activeTab, setActiveTab] = useState('gyms');
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

            // Dynamic import — xlsx (~200KB) only loads when admin clicks Export
            const XLSX = await import('xlsx');

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

    if (loading) return <BicepCurlLoader text="Loading Admin Panel..." fullScreen={true} />;

    return (
        <div className="flex bg-[#0f0f1a] text-gray-100 font-sans min-h-screen overflow-hidden">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 bg-[#13131f] border-r border-white/[0.05] w-64 flex flex-col z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/[0.08] p-2 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <Activity className="text-purple-400" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            TrackON <span className="text-purple-400">Admin</span>
                        </h1>
                    </div>
                    <button className="md:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => { setActiveTab('gyms'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${activeTab === 'gyms' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent'}`}>
                        <Users size={18} /> Gym Management
                    </button>
                    <button onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${activeTab === 'settings' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent'}`}>
                        <Settings size={18} /> Subscription Control
                    </button>
                </div>

                <div className="p-4 border-t border-white/[0.05] bg-white/[0.01]">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 px-4 py-3.5 rounded-xl hover:bg-red-500/20 border border-red-500/20 transition-all font-semibold active:scale-[0.98]">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Decorative blob */}
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

                <header className="bg-[#13131f]/80 backdrop-blur-xl border-b border-white/[0.05] p-4 shrink-0 flex items-center justify-between sticky top-0 z-10 md:hidden">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-300 hover:text-white bg-white/[0.05] p-2 rounded-lg border border-white/[0.05]">
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-bold text-white tracking-tight capitalize">{activeTab === 'gyms' ? 'Gym Management' : 'Global Settings'}</h2>
                    </div>
                </header>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
                    {activeTab === 'settings' ? (
                        <AdminSubscriptionSettings />
                    ) : (
                        <div className="max-w-7xl mx-auto">
                            {/* Stats & Filter */}
                            <div className="flex flex-col xl:flex-row justify-between items-center gap-6 mb-8">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto">
                                    <div
                                        onClick={() => setFilter('all')}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden ${filter === 'all' ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]' : 'bg-[#13131f] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.02]'}`}
                                    >
                                        {filter === 'all' && <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />}
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total</p>
                                        <p className="text-3xl font-black text-white">{gyms.length}</p>
                                    </div>
                                    <div className="bg-[#13131f] p-5 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Active</p>
                                        <p className="text-3xl font-black text-emerald-400">{gyms.filter(g => g.isActive).length}</p>
                                    </div>
                                    <div
                                        onClick={() => setFilter(filter === 'expired' ? 'all' : 'expired')}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden ${filter === 'expired' ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] scale-[1.02]' : 'bg-[#13131f] border-white/[0.08] hover:border-red-500/30 hover:bg-red-500/5'}`}
                                    >
                                        {filter === 'expired' && <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />}
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Expired</p>
                                        <p className="text-3xl font-black text-red-400">{expiredCount}</p>
                                    </div>
                                </div>

                                <div className="relative w-full xl:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search Gyms..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-[#13131f] border border-white/[0.08] text-white pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-gray-500 text-sm shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Gym List */}
                            <div className="grid gap-4">
                                {filteredGyms.map((gym) => {
                                    const expired = isExpired(gym);
                                    return (
                                        <div key={gym._id} className={`bg-[#13131f] p-5 rounded-2xl border flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 transition-all duration-300 ${expired ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'}`}>

                                            <div className="flex items-start gap-4 w-full xl:w-auto">
                                                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-black text-white shadow-lg ${gym.isActive ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-400/30' : 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600'}`}>
                                                    {gym.gymName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <h3 className="font-bold text-white text-lg tracking-tight flex flex-wrap items-center gap-2">
                                                        {gym.gymName}
                                                        {!gym.isActive && <span className="bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-red-500/20">Inactive</span>}
                                                        {expired && <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-orange-500/20">Expired</span>}
                                                    </h3>
                                                    <div className="text-sm text-gray-400 mt-1.5 space-y-1">
                                                        <p className="flex items-center gap-1.5 font-medium"><Users size={14} className="text-gray-500" /> <span className="text-gray-300">{gym.owner?.ownerName}</span></p>
                                                        <p className="text-xs">{gym.owner?.mobile} <span className="text-gray-600 mx-1">•</span> {gym.city}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t xl:border-t-0 border-white/[0.05] pt-4 xl:pt-0 w-full xl:w-auto justify-between xl:justify-end">
                                                <div className="flex flex-row sm:flex-col justify-between w-full sm:w-auto gap-4 sm:gap-0 sm:text-right mr-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Joined</p>
                                                        <p className="text-sm font-medium text-gray-300 mb-1">{new Date(gym.joiningDate).toLocaleDateString('en-GB')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Expires</p>
                                                        <p className={`text-sm font-bold ${expired ? 'text-red-400' : 'text-emerald-400'}`}>
                                                            {getExpiryDate(gym).toLocaleDateString('en-GB')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handleExportMembers(gym)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-xs border border-blue-500/20 active:scale-[0.98]"
                                                        title="Export Members"
                                                    >
                                                        <Download size={16} /> <span className="sm:hidden xl:inline">Export</span>
                                                    </button>

                                                    <button
                                                        onClick={() => openRenewModal(gym)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all text-xs border border-purple-500/20 active:scale-[0.98]"
                                                        title="Renew Plan"
                                                    >
                                                        <span className="text-base leading-none">↻</span> <span className="sm:hidden xl:inline">Renew</span>
                                                    </button>

                                                    <button
                                                        onClick={() => confirmDelete(gym)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs border border-red-500/20 active:scale-[0.98]"
                                                        title="Delete Gym"
                                                    >
                                                        <Trash2 size={16} /> <span className="sm:hidden">Delete</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleStatus(gym._id)}
                                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-xs active:scale-[0.98] ${gym.isActive
                                                            ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                                            }`}
                                                    >
                                                        {gym.isActive ? (
                                                            <>
                                                                <PowerOff size={16} /> <span className="sm:hidden">Stop</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Power size={16} /> <span className="sm:hidden">Start</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredGyms.length === 0 && (
                                    <div className="text-center py-12 text-gray-500 bg-[#13131f] rounded-2xl border border-white/[0.05] border-dashed">
                                        No gyms found matching your criteria.
                                    </div>
                                )}
                            </div>

                            {/* Renew Modal */}
                            {showRenewModal && selectedGym && (
                                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-all duration-300">
                                    <div className="bg-[#13131f] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-white/[0.08] border-b-0 sm:border-b transition-all duration-300">
                                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                            <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
                                        </div>
                                        <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02]">
                                            <h3 className="text-base font-bold text-white">Renew Gym Plan</h3>
                                            <button onClick={() => setShowRenewModal(false)} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.08] transition-all">✕</button>
                                        </div>
                                        <form onSubmit={handleRenewSubmit} className="p-5">
                                            <p className="text-gray-400 text-sm mb-2">Renew plan for: <span className="text-white font-semibold">{selectedGym.gymName}</span></p>
                                            <p className="text-xs text-gray-500 mb-5 font-medium">Current Expiry: <span className="text-white">{getExpiryDate(selectedGym).toLocaleDateString('en-GB')}</span></p>

                                            <div className="space-y-4 mb-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Select Duration</label>
                                                    <select
                                                        value={renewDuration}
                                                        onChange={(e) => setRenewDuration(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all cursor-pointer appearance-none"
                                                    >
                                                        <option value="1" className="bg-[#13131f]">1 Month (30 Days)</option>
                                                        <option value="3" className="bg-[#13131f]">3 Months (90 Days)</option>
                                                        <option value="6" className="bg-[#13131f]">6 Months (180 Days)</option>
                                                        <option value="12" className="bg-[#13131f]">1 Year (365 Days)</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Renewal Type</label>
                                                    <select
                                                        value={renewalType}
                                                        onChange={(e) => setRenewalType(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all cursor-pointer appearance-none"
                                                    >
                                                        <option value="Continue Plan" className="bg-[#13131f]">Continue Plan (From Expiry)</option>
                                                        <option value="Start Fresh" className="bg-[#13131f]">Start Fresh (From Specific Date)</option>
                                                    </select>
                                                </div>

                                                {renewalType === 'Start Fresh' && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Select Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={planStartDate}
                                                            onChange={(e) => setPlanStartDate(e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all [&::-webkit-calendar-picker-indicator]:filter-invert"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => setShowRenewModal(false)} className="flex-1 px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 hover:text-white text-sm font-semibold border border-white/[0.09] hover:border-white/[0.15] transition-all duration-200 active:scale-[0.98]">Cancel</button>
                                                <button type="submit" className="flex-[2] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30 active:scale-[0.98]">
                                                    Confirm Renewal
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                            
                            {/* Delete Modal */}
                            {showDeleteModal && gymToDelete && (
                                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 transition-all duration-300">
                                    <div className="bg-[#13131f] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-red-500/50 shadow-2xl relative overflow-hidden transition-all duration-300 border-b-0 sm:border-b">
                                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                            <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
                                        </div>
                                        <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 p-5 border-b border-red-500/20 flex justify-between items-center">
                                            <h3 className="text-base font-bold text-red-400 flex items-center gap-2"><Trash2 size={18} /> Delete Gym</h3>
                                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.08] transition-all">✕</button>
                                        </div>
                                        <div className="p-5">
                                            <p className="text-gray-300 text-sm mb-3">Are you sure you want to completely delete <span className="text-white font-bold">{gymToDelete.gymName}</span>?</p>
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                                                <p className="text-red-400 text-xs font-bold leading-relaxed uppercase tracking-wider">WARNING: This will permanently delete the gym, the gym owner's account, all members, and all payment history associated with this gym. This cannot be undone.</p>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button 
                                                    onClick={() => setShowDeleteModal(false)}
                                                    className="w-full px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 hover:text-white text-sm font-semibold border border-white/[0.09] hover:border-white/[0.15] transition-all duration-200 active:scale-[0.98]"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleDeleteSubmit}
                                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-red-900/30 active:scale-[0.98]"
                                                >
                                                    Delete Gym
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
