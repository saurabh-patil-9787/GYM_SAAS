import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { Plus, Search, Filter, Phone, IndianRupee, Trash2, Edit, RefreshCw } from 'lucide-react';
import Input from '../../components/Input';

const MembersPage = () => {
    const [searchParams] = useSearchParams();
    const filterStatus = searchParams.get('status');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    // Renewal Modal State
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewData, setRenewData] = useState({ planDuration: '1', totalFee: '', paidFee: '' });

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState(null);

    // Add Member Form State
    const [newMember, setNewMember] = useState({
        memberType: 'new', // 'new' or 'existing'
        name: '', mobile: '', age: '', weight: '', height: '',
        city: '', planDuration: '1', totalFee: '', paidFee: '',
        joiningDate: new Date().toISOString().split('T')[0],
        expiryDate: '' // Manual expiry for existing members
    });

    const fetchMembers = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterStatus) params.append('status', filterStatus);

            const res = await api.get(`/members?${params.toString()}`);
            setMembers(res.data);
        } catch (error) {
            console.error("Failed to fetch members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchMembers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, filterStatus]);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/members', newMember);
            setShowAddModal(false);
            fetchMembers();
            setNewMember({
                memberType: 'new',
                name: '', mobile: '', age: '', weight: '', height: '',
                city: '', planDuration: '1', totalFee: '', paidFee: '',
                joiningDate: new Date().toISOString().split('T')[0],
                expiryDate: ''
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add member');
        }
    };

    const openPaymentModal = (member) => {
        setSelectedMember(member);
        setPaymentAmount(member.totalFee - member.paidFee); // Default to due amount
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/members/${selectedMember._id}/pay`, { amount: paymentAmount });
            setShowPaymentModal(false);
            fetchMembers(); // Refresh list
        } catch (error) {
            alert('Payment failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            try {
                await api.delete(`/members/${id}`);
                fetchMembers();
            } catch (error) {
                alert('Failed to delete member');
            }
        }
    };

    // Renewal Logic
    const openRenewModal = (member) => {
        setSelectedMember(member);
        setRenewData({ planDuration: '1', totalFee: '', paidFee: '' });
        setShowRenewModal(true);
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/members/${selectedMember._id}/renew`, renewData);
            setShowRenewModal(false);
            fetchMembers();
        } catch (error) {
            console.error("Renewal Error Frontend:", error);
            alert(error.response?.data?.message || 'Renewal failed');
        }
    };

    // Edit Logic
    const openEditModal = (member) => {
        setSelectedMember(member);
        setEditData(member);
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/members/${selectedMember._id}`, editData);
            setShowEditModal(false);
            fetchMembers();
        } catch (error) {
            alert('Update failed');
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-4 px-1">
                <h2 className="text-2xl font-bold text-white w-full text-center xl:text-left">Member Management</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 w-full xl:w-64">
                        <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap w-full sm:w-auto"
                    >
                        <Plus size={20} />
                        Add Member
                    </button>
                </div>
            </div>

            {/* Members List */}
            <div className="grid gap-4">
                {members.map((member) => (
                    <div key={member._id} className="bg-gray-800 p-4 md:p-5 rounded-xl border border-gray-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:border-gray-600 transition-all">
                        <div className="flex items-start gap-4 w-full lg:w-auto">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xl font-bold text-white">
                                {member.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{member.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-400 mt-1">
                                    <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">ID: {member.memberId}</span>
                                    <span className="flex items-center gap-1"><Phone size={12} /> {member.mobile}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-gray-700 pt-4 lg:pt-0">
                            <div className="flex w-full sm:w-auto justify-between gap-6 sm:gap-8 overflow-x-auto pb-1 sm:pb-0">
                                <div className="text-center sm:text-left lg:text-center min-w-[70px]">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider">Plan</p>
                                    <p className="text-white font-medium whitespace-nowrap">{member.planDuration} Month(s)</p>
                                </div>
                                <div className="text-center sm:text-left lg:text-center min-w-[90px]">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider">Expires</p>
                                    <p className={`font-medium whitespace-nowrap ${new Date(member.expiryDate) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                                        {new Date(member.expiryDate).toLocaleDateString('en-GB')}
                                    </p>
                                </div>
                                <div className="text-center sm:text-left lg:text-center min-w-[80px]">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider">Due</p>
                                    <p className={`font-medium whitespace-nowrap ${(member.totalFee - member.paidFee) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        ₹{member.totalFee - member.paidFee}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                {(member.totalFee - member.paidFee) > 0 && (
                                    <button
                                        onClick={() => openPaymentModal(member)}
                                        className="flex-1 sm:flex-none p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors flex justify-center items-center"
                                        title="Record Payment"
                                    >
                                        <IndianRupee size={20} />
                                    </button>
                                )}
                                <a
                                    href={`https://wa.me/91${member.mobile}?text=Hello ${member.name}, your gym fees is pending.`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 sm:flex-none p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors flex justify-center items-center"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                </a>
                                <button onClick={() => openRenewModal(member)} className="flex-1 sm:flex-none p-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors flex justify-center items-center" title="Renew Plan">
                                    <RefreshCw size={20} />
                                </button>
                                <button onClick={() => openEditModal(member)} className="flex-1 sm:flex-none p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20 transition-colors flex justify-center items-center" title="Edit Member">
                                    <Edit size={20} />
                                </button>
                                <button onClick={() => handleDelete(member._id)} className="flex-1 sm:flex-none p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors flex justify-center items-center" title="Delete Member">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {members.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                        No members found. Add your first member!
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedMember && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-bold text-white">Record Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="p-6">
                            <p className="text-gray-400 mb-4">Member: <span className="text-white font-semibold">{selectedMember.name}</span></p>
                            <Input label="Amount (₹)" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-bold text-white">Add New Member</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} required />
                                <Input label="Mobile" value={newMember.mobile} onChange={(e) => setNewMember({ ...newMember, mobile: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Age" type="number" value={newMember.age} onChange={(e) => setNewMember({ ...newMember, age: e.target.value })} />
                                <Input label="Weight (kg)" type="number" value={newMember.weight} onChange={(e) => setNewMember({ ...newMember, weight: e.target.value })} />
                                <Input label="Height (cm)" type="number" value={newMember.height} onChange={(e) => setNewMember({ ...newMember, height: e.target.value })} />
                            </div>
                            <Input label="City" value={newMember.city} onChange={(e) => setNewMember({ ...newMember, city: e.target.value })} />

                            {/* Member Type Toggle */}
                            <div className="col-span-1 md:col-span-2 bg-gray-700/30 p-4 rounded-xl border border-gray-700">
                                <label className="block text-gray-400 text-sm font-bold mb-3">Member Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="memberType"
                                            value="new"
                                            checked={newMember.memberType === 'new'}
                                            onChange={(e) => setNewMember({ ...newMember, memberType: e.target.value })}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 bg-gray-700 border-gray-600"
                                        />
                                        <span className="text-white">New Member</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="memberType"
                                            value="existing"
                                            checked={newMember.memberType === 'existing'}
                                            onChange={(e) => setNewMember({ ...newMember, memberType: e.target.value })}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 bg-gray-700 border-gray-600"
                                        />
                                        <span className="text-white">Existing Member (Manual Expiry)</span>
                                    </label>
                                </div>
                            </div>


                            <div className="grid grid-cols-2 gap-4">
                                {newMember.memberType === 'new' ? (
                                    <div>
                                        <label className="block text-gray-400 text-sm font-bold mb-2">Duration</label>
                                        <select
                                            value={newMember.planDuration}
                                            onChange={(e) => setNewMember({ ...newMember, planDuration: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500"
                                        >
                                            <option value="1">1 Month</option>
                                            <option value="3">3 Months</option>
                                            <option value="6">6 Months</option>
                                            <option value="12">1 Year</option>
                                        </select>
                                    </div>
                                ) : (
                                    <Input
                                        label="Next Expiry Date"
                                        type="date"
                                        value={newMember.expiryDate}
                                        onChange={(e) => setNewMember({ ...newMember, expiryDate: e.target.value })}
                                        required
                                    />
                                )}
                                <Input label="Joining Date" type="date" value={newMember.joiningDate} onChange={(e) => setNewMember({ ...newMember, joiningDate: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Total Fee" type="number" value={newMember.totalFee} onChange={(e) => setNewMember({ ...newMember, totalFee: e.target.value })} required />
                                <Input label="Paid Amount" type="number" value={newMember.paidFee} onChange={(e) => setNewMember({ ...newMember, paidFee: e.target.value })} required />
                            </div>

                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mt-4">
                                Save Member
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Renewal Modal */}
            {showRenewModal && selectedMember && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-bold text-white">Renew Membership</h3>
                            <button onClick={() => setShowRenewModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleRenewSubmit} className="p-6">
                            <p className="text-gray-400 mb-4">Renew for: <span className="text-white font-semibold">{selectedMember.name}</span></p>

                            <div className="mb-4">
                                <label className="block text-gray-400 text-sm font-bold mb-2">New Duration</label>
                                <select
                                    value={renewData.planDuration}
                                    onChange={(e) => setRenewData({ ...renewData, planDuration: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="1">1 Month</option>
                                    <option value="3">3 Months</option>
                                    <option value="6">6 Months</option>
                                    <option value="12">1 Year</option>
                                </select>
                            </div>

                            <Input label="Total Fee for Renewal" type="number" value={renewData.totalFee} onChange={(e) => setRenewData({ ...renewData, totalFee: e.target.value })} required />
                            <Input label="Paid Amount Now" type="number" value={renewData.paidFee} onChange={(e) => setRenewData({ ...renewData, paidFee: e.target.value })} required />

                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
                                Confirm Renewal
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editData && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-bold text-white">Edit Member</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Name" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} required />
                                <Input label="Mobile" value={editData.mobile} onChange={(e) => setEditData({ ...editData, mobile: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Joining Date (Read Only)</label>
                                <input
                                    type="text"
                                    value={new Date(editData.joiningDate).toLocaleDateString('en-GB')}
                                    disabled
                                    className="w-full bg-gray-700/50 border border-gray-600 text-gray-400 rounded-xl px-4 py-3 cursor-not-allowed"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Age" type="number" value={editData.age} onChange={(e) => setEditData({ ...editData, age: e.target.value })} />
                                <Input label="Weight (kg)" type="number" value={editData.weight} onChange={(e) => setEditData({ ...editData, weight: e.target.value })} />
                                <Input label="Height (cm)" type="number" value={editData.height} onChange={(e) => setEditData({ ...editData, height: e.target.value })} />
                            </div>
                            <Input label="City" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />

                            {/* Not allowing Date/Plan edits in simple edit, use Renew for plan changes usually, but let's allow basic corrections if needed. */}
                            {/* Simplified for standard edit: Personal details */}

                            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg mt-4">
                                Update Member
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersPage;
