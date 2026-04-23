import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { getAccessToken } from '../../api/axios';
import { Plus, Search, Filter, Phone, IndianRupee, Trash2, Edit, RefreshCw, Upload, Image as ImageIcon, Download, History, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import Input from '../../components/Input';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import ImageCropper from '../../components/ImageCropper';
import DOBField from '../../components/DOBField';
import { compressImage } from '../../utils/compressImage';
import AddMemberWizard from '../../components/members/AddMemberWizard';

const MembersPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const filterStatus = searchParams.get('status');

    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setShowAddModal(true);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('add');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(30);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Photo Viewer Modal State
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const handlePhotoClick = (photoUrl) => {
        if (photoUrl) {
            setSelectedPhoto(photoUrl);
            setShowPhotoModal(true);
        }
    };

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    // Renewal Modal State
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewData, setRenewData] = useState({ 
        planDuration: '1', 
        totalFee: '', 
        paidFee: '',
        renewalType: '',
        planStartDate: '',
        paymentMethod: 'Cash'
    });

    // Renewal Success State
    const [showRenewalSuccessModal, setShowRenewalSuccessModal] = useState(false);
    const [lastRenewalData, setLastRenewalData] = useState(null);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [editData, setEditData] = useState(null);
    const [editPhotoFile, setEditPhotoFile] = useState(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState(null);
    const [editRemovePhoto, setEditRemovePhoto] = useState(false);

    // Delete Member State
    const [isDeletingMember, setIsDeletingMember] = useState(false);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState(null);

    const openHistoryModal = async (memberId) => {
        setHistoryData(null);
        setShowHistoryModal(true);
        setIsHistoryLoading(true);
        try {
            const token = getAccessToken();
            const res = await api.get(`/api/members/${memberId}/history`);
            if (res.data?.success) {
                setHistoryData(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    // Close on escape for modals
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setShowHistoryModal(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Add Member Form State
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMember, setNewMember] = useState({
        memberType: 'new', // 'new' or 'existing'
        name: '', mobile: '', age: '', weight: '', height: '',
        city: '', planDuration: '1', totalFee: '', paidFee: '', dob: '',
        joiningDate: new Date().toISOString().split('T')[0],
        expiryDate: '', // Manual expiry for existing members
        paymentMethod: 'Cash'
    });
    const [addPhotoFile, setAddPhotoFile] = useState(null);
    const [addPhotoPreview, setAddPhotoPreview] = useState(null);

    // Duplicate Prevention State
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateMemberInfo, setDuplicateMemberInfo] = useState(null);
    const [allowDuplicateMobile, setAllowDuplicateMobile] = useState(false);
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

    const handleMobileBlur = async (mobileVal) => {
        const cleanMobile = mobileVal.replace(/\D/g, '');
        if (cleanMobile.length !== 10) return;
        
        setIsCheckingDuplicate(true);
        try {
            const token = getAccessToken();
            const res = await api.get(`/api/members/check-duplicate?mobile=${cleanMobile}`);
            if (res.data && res.data.isDuplicate) {
                setDuplicateMemberInfo(res.data.existingMember);
                setShowDuplicateModal(true);
            }
        } catch (error) {
            console.error("Duplicate check failed, proceeding anyway", error);
        } finally {
            setIsCheckingDuplicate(false);
        }
    };

    // Cropper State
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropImageFile, setCropImageFile] = useState(null);
    const [cropType, setCropType] = useState(null); // 'add' or 'edit'

    const handleAddPhotoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedFile = await compressImage(file);
                if (compressedFile.size > 2 * 1024 * 1024) return alert('File size remains > 2MB after compression. Please choose a smaller file.');
                setCropType('add');
                setCropImageFile(compressedFile);
                setShowCropModal(true);
            } catch (error) {
                alert(error.message || 'Failed to process image');
            } finally {
                // Allow re-selection
                e.target.value = '';
            }
        }
    };

    const handleEditPhotoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedFile = await compressImage(file);
                if (compressedFile.size > 2 * 1024 * 1024) return alert('File size remains > 2MB after compression. Please choose a smaller file.');
                setCropType('edit');
                setCropImageFile(compressedFile);
                setShowCropModal(true);
            } catch (error) {
                alert(error.message || 'Failed to process image');
            } finally {
                // Allow re-selection
                e.target.value = '';
            }
        }
    };

    const handleCropComplete = (croppedFile) => {
        if (cropType === 'add') {
            setAddPhotoFile(croppedFile);
            setAddPhotoPreview(URL.createObjectURL(croppedFile));
        } else if (cropType === 'edit') {
            setEditPhotoFile(croppedFile);
            setEditPhotoPreview(URL.createObjectURL(croppedFile));
            setEditRemovePhoto(false);
        }
        setShowCropModal(false);
        setCropImageFile(null);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setCropImageFile(null);
    };

    const fetchMembers = async (pageToFetch = currentPage) => {
        setIsPageLoading(true);
        try {
            const params = new URLSearchParams();
            if (search && search.trim().length > 0) {
                if (search.trim().length < 3) {
                    setIsPageLoading(false);
                    setLoading(false);
                    return;
                }
                params.append('search', search.trim());
            }
            if (filterStatus) params.append('status', filterStatus);
            params.append('page', pageToFetch);
            params.append('limit', limit);

            const res = await api.get(`/api/members?${params.toString()}`);
            setMembers(res.data.data || res.data || []);
            if (res.data.pages) setTotalPages(res.data.pages);
        } catch (error) {
            console.error("Failed to fetch members");
        } finally {
            setLoading(false);
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchMembers(1);
            }
        }, 400); // 400ms explicit debounce
        return () => clearTimeout(timeout);
    }, [search, filterStatus]);

    useEffect(() => {
        if (currentPage !== 1) {
            fetchMembers(currentPage);
        }
    }, [currentPage]);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsAddingMember(true);
        try {
            const formData = new FormData();
            Object.keys(newMember).forEach(key => {
                if (newMember[key] !== undefined && newMember[key] !== '') {
                    formData.append(key, newMember[key]);
                }
            });
            if (addPhotoFile) formData.append('photo', addPhotoFile);
            formData.append('allowDuplicateMobile', allowDuplicateMobile);

            const token = getAccessToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 409 && errorData.isDuplicate) {
                    setDuplicateMemberInfo(errorData.existingMember);
                    setShowDuplicateModal(true);
                    setIsAddingMember(false);
                    return; 
                }
                throw new Error(errorData.message || 'Failed to add member');
            }

            setShowAddModal(false);
            setAllowDuplicateMobile(false);
            fetchMembers();
            setNewMember({
                memberType: 'new',
                name: '', mobile: '', age: '', weight: '', height: '',
                city: '', planDuration: '1', totalFee: '', paidFee: '', dob: '',
                joiningDate: new Date().toISOString().split('T')[0],
                expiryDate: '',
                paymentMethod: 'Cash'
            });
            setAddPhotoFile(null);
            setAddPhotoPreview(null);
        } catch (error) {
            alert(error.message || error.response?.data?.message || 'Failed to add member');
        } finally {
            setIsAddingMember(false);
        }
    };

    const openPaymentModal = (member) => {
        setSelectedMember(member);
        setPaymentAmount(member.totalFee - member.paidFee); // Default to due amount
        setPaymentMethod('Cash');
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/members/${selectedMember._id}/pay`, { amount: paymentAmount, type: paymentMethod });
            setShowPaymentModal(false);
            fetchMembers(); // Refresh list
        } catch (error) {
            alert('Payment failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            setIsDeletingMember(true);
            try {
                await api.delete(`/api/members/${id}`);
                // Re-fetch members after delete
                fetchMembers();
            } catch (error) {
                alert('Failed to delete member');
            } finally {
                setIsDeletingMember(false);
            }
        }
    };

    // Renewal Logic
    const openRenewModal = (member) => {
        setSelectedMember(member);
        
        setRenewData({ 
            planDuration: '1', 
            totalFee: '', 
            paidFee: '',
            renewalType: '',
            planStartDate: '',
            paymentMethod: 'Cash'
        });
        setShowRenewModal(true);
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/api/members/${selectedMember._id}/renew`, renewData);
            
            // Build the context data for the success message payload
            setLastRenewalData({
                memberName: selectedMember.name,
                mobile: selectedMember.mobile,
                plan: renewData.planDuration,
                totalFee: renewData.totalFee,
                paidFee: renewData.paidFee,
                dueAmount: (Number(res.data.totalFee) || 0) - (Number(res.data.paidFee) || 0),
                expiryDate: res.data.expiryDate
            });

            setShowRenewModal(false);
            setShowRenewalSuccessModal(true);
            
            fetchMembers();
        } catch (error) {
            console.error("Renewal Error Frontend:", error);
            alert(error.response?.data?.message || 'Renewal failed');
        }
    };

    // WhatsApp Message Generator
    const { user } = useAuth();
    
    const sendWhatsAppConfirmation = () => {
        if (!lastRenewalData) return;

        const gymName = user?.gymName || user?.gym?.name || "our"; // Fallback if name is unavailable

        const formattedDate = new Date(lastRenewalData.expiryDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        // Ensure mobile is numeric and standard length
        // We pad with 91 only if length is 10 as standard fallback, 
        // using the regex to strip any formatting from the stored number.
        const cleanMobile = lastRenewalData.mobile.replace(/\D/g, '');
        const targetMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

        const text = `Hello ${lastRenewalData.memberName},

Your membership at ${gymName} Gym has been successfully renewed.

Plan: ${lastRenewalData.plan} Month(s)

Total Fee: ₹${lastRenewalData.totalFee}
Paid Amount: ₹${lastRenewalData.paidFee}
Due Amount: ₹${lastRenewalData.dueAmount}

Next Expiry Date: ${formattedDate}

Thank you!

Stay Strong. Stay Consistent. 💪`;

        const encodedMessage = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/${targetMobile}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
        // UX Improvement: Auto-close after opening
        setShowRenewalSuccessModal(false);
    };

    // Edit Logic
    const openEditModal = (member) => {
        setSelectedMember(member);
        setEditData(null);
        setEditPhotoFile(null);
        setEditPhotoPreview(member.photoUrl || null);
        setEditRemovePhoto(false);
        setShowEditModal(true);
    };

    useEffect(() => {
        if (selectedMember && showEditModal) {
            const timer = setTimeout(() => {
                setEditData({
                    ...selectedMember,
                    name: selectedMember.name || '',
                    mobile: selectedMember.mobile || '',
                    age: selectedMember.age || '',
                    weight: selectedMember.weight || '',
                    height: selectedMember.height || '',
                    city: selectedMember.city || '',
                    dob: selectedMember.dob ? new Date(selectedMember.dob).toISOString().split('T')[0] : ''
                });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [selectedMember, showEditModal]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsEditingMember(true);
        try {
            const formData = new FormData();
            const fieldsToUpdate = ['name', 'mobile', 'age', 'weight', 'height', 'city', 'dob'];
            fieldsToUpdate.forEach(field => {
                if (editData[field] !== undefined) {
                    formData.append(field, editData[field]);
                }
            });

            if (editPhotoFile) {
                formData.append('photo', editPhotoFile);
            }
            if (editRemovePhoto) {
                formData.append('removePhoto', 'true');
            }

            const token = getAccessToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/members/${selectedMember._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Update failed');
            }

            setShowEditModal(false);
            fetchMembers();
        } catch (error) {
            alert(error.message || error.response?.data?.message || 'Update failed');
        } finally {
            setIsEditingMember(false);
        }
    };

    const handleExportExcel = () => {
        if (members.length === 0) {
            alert('No members available to export.');
            return;
        }

        const dataToExport = members.map(m => ({
            'Member ID': m.memberId || m._id.slice(-6),
            'Name': m.name,
            'Mobile': m.mobile,
            'City': m.city || 'N/A',
            'Status': m.status.charAt(0).toUpperCase() + m.status.slice(1),
            'Plan Duration (Months)': m.planDuration,
            'Joining Date': new Date(m.joiningDate).toLocaleDateString('en-GB'),
            'Expiry Date': new Date(m.expiryDate).toLocaleDateString('en-GB'),
            'Total Fee': m.totalFee,
            'Paid Fee': m.paidFee,
            'Pending Amount': m.totalFee - m.paidFee,
            'Expired': m.status === 'expired' ? 'Yes' : 'No'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Members");

        const gymNameStr = user?.gymName || user?.gym?.name || "Our_Gym";
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `${gymNameStr.replace(/[^a-z0-9]/gi, '_')}_Members_${dateStr}.xlsx`;

        XLSX.writeFile(wb, fileName);
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
                            placeholder="Search by name, mobile, or Member ID..."
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
                    <button
                        onClick={handleExportExcel}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap w-full sm:w-auto"
                        title="Export members to Excel"
                    >
                        <Download size={20} />
                        Export Members
                    </button>
                </div>
            </div>

            {/* Members List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 pb-10">
                {members.map((member) => {
                    const isExpired = new Date(member.expiryDate) < new Date();
                    const pendingDue = (member.totalFee - member.paidFee) > 0;
                    
                    let statusBorder = 'border-blue-500/30';
                    let statusShadow = 'shadow-[0_0_15px_rgba(59,130,246,0.1)]';
                    let statusGradient = 'from-blue-500/10 hover:from-blue-500/20';

                    if (isExpired) {
                        statusBorder = 'border-red-500/50';
                        statusShadow = 'shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                        statusGradient = 'from-red-500/10 hover:from-red-500/20';
                    } else if (pendingDue) {
                        statusBorder = 'border-orange-500/50';
                        statusShadow = 'shadow-[0_0_15px_rgba(249,115,22,0.15)]';
                        statusGradient = 'from-orange-500/10 hover:from-orange-500/20';
                    } else {
                        statusBorder = 'border-green-500/40';
                        statusShadow = 'shadow-[0_0_15px_rgba(34,197,94,0.15)]';
                        statusGradient = 'from-green-500/10 hover:from-green-500/20';
                    }

                    return (
                    <div key={member._id} className={`bg-gray-800/80 p-4 rounded-2xl md:rounded-3xl border ${statusBorder} ${statusShadow} flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group h-full`}>
                        <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-b ${statusGradient} to-transparent pointer-events-none transition-colors duration-300`}></div>
                        
                        {/* Avatar & Info */}
                        <div className="flex flex-col items-center text-center relative z-10 w-full mt-2">
                            <div 
                                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl font-black text-white border-[3px] shadow-lg mb-3 ${statusBorder} ${member.photoUrl ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                onClick={() => handlePhotoClick(member.photoUrl)}
                            >
                                {member.photoUrl ? (
                                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    member.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <h3 className="font-bold text-gray-100 text-lg sm:text-[19px] px-2 w-full truncate" title={member.name}>{member.name}</h3>
                            <div className="flex flex-col items-center gap-1.5 text-sm text-gray-400 mt-1">
                                <span className="bg-gray-900 px-2.5 py-0.5 rounded-lg border border-gray-700 text-xs font-bold text-gray-300 shadow-inner">Member ID: {member.memberId}</span>
                                <span className="flex items-center gap-1.5 font-medium"><Phone size={14} className="text-gray-500"/> {member.mobile}</span>
                            </div>
                        </div>

                        {/* Mid Section: Stats Box */}
                        <div className="grid grid-cols-3 gap-1 w-full bg-gray-900/60 p-2 rounded-xl border border-gray-700/50 relative z-10 mt-auto">
                            <div className="text-center">
                                <p className="text-gray-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-1">Plan</p>
                                <p className="text-white font-black text-xs sm:text-sm whitespace-nowrap">{member.planDuration} <span className="text-[10px] text-gray-400 font-medium">Mon</span></p>
                            </div>
                            <div className="text-center border-x border-gray-700/50 px-1 flex flex-col items-center justify-center">
                                <p className="text-gray-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-1">Expires</p>
                                <p className={`font-black text-xs sm:text-sm whitespace-nowrap leading-[1.1] ${new Date(member.expiryDate) < new Date() ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-green-400'}`}>
                                    {new Date(member.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year:'2-digit'})}
                                </p>
                                {(() => {
                                    const diff = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <p className={`text-[9px] sm:text-[10px] font-bold mt-1 tracking-wider leading-none ${diff > 0 ? 'text-yellow-500/90' : 'text-red-500/90'}`}>
                                            {diff > 0 ? `${diff}d Left` : `${Math.abs(diff)}d Expired`}
                                        </p>
                                    );
                                })()}
                            </div>
                            <div className="text-center">
                                <p className="text-gray-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-1">Due</p>
                                <p className={`font-black text-xs sm:text-sm whitespace-nowrap ${(member.totalFee - member.paidFee) > 0 ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]' : 'text-green-400'}`}>
                                    ₹{member.totalFee - member.paidFee}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex flex-wrap justify-center gap-1.5 w-full mt-1 relative z-10">
                            {(member.totalFee - member.paidFee) > 0 && (
                                <button
                                    onClick={() => openPaymentModal(member)}
                                    className="flex-1 min-w-[35px] p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white border border-blue-500/30 transition-all flex justify-center items-center shadow-lg"
                                    title="Record Payment"
                                >
                                    <IndianRupee size={16} />
                                </button>
                            )}
                            <a
                                href={`https://wa.me/91${member.mobile}?text=${encodeURIComponent(
                                    (() => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const expDate = new Date(member.expiryDate);
                                        expDate.setHours(0, 0, 0, 0);

                                        const daysDiff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                                        const pending = member.totalFee - member.paidFee;

                                        const dateStr = new Date(member.expiryDate).toLocaleDateString('en-GB');

                                        if (pending > 0) {
                                            if (daysDiff === 1) {
                                                return `Hello ${member.name},\nYour gym plan will expire in 1 day on ${dateStr}.\nPending amount: ₹${pending}.\nPlease clear your dues to continue your membership.\n\nPush harder than yesterday if you want a different tomorrow! 💪`;
                                            }
                                            return `Hello ${member.name},\nYour gym plan ${daysDiff < 0 ? 'expired' : 'will expire'} on ${dateStr}.\nPending amount: ₹${pending}.\nPlease clear your dues to continue your membership.\n\nStay strong. Stay consistent 💪`;
                                        } else {
                                            if (daysDiff === 1) {
                                                return `Hello ${member.name},\nYour gym plan will expire in 1 day on ${dateStr}.\nPlease renew your membership as soon as possible.\n\nPush harder than yesterday if you want a different tomorrow! 💪`;
                                            } else if (daysDiff < 0) {
                                                return `Hello ${member.name},\nYour gym plan expired on ${dateStr}.\nPlease renew your membership as soon as possible.\n\nStay strong. Stay consistent 💪`;
                                            } else {
                                                return `Hello ${member.name},\nYour gym plan will expire on ${dateStr}.\nPlease submit your fee on time to continue your fitness journey.\n\nStay strong. Stay consistent 💪`;
                                            }
                                        }
                                    })()
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 min-w-[35px] p-2 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500 hover:text-white border border-green-500/30 transition-all flex justify-center items-center shadow-lg"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[16px]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </a>
                            <button onClick={() => openHistoryModal(member._id)} className="flex-1 min-w-[35px] p-2 bg-slate-500/10 text-slate-400 rounded-xl hover:bg-slate-500 hover:text-white border border-slate-500/30 transition-all flex justify-center items-center shadow-lg" title="View History">
                                <History size={16} />
                            </button>
                            <button onClick={() => openRenewModal(member)} className="flex-1 min-w-[35px] p-2 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-500 hover:text-white border border-purple-500/30 transition-all flex justify-center items-center shadow-lg" title="Renew Plan">
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={() => openEditModal(member)} className="flex-1 min-w-[35px] p-2 bg-yellow-500/10 text-yellow-400 rounded-xl hover:bg-yellow-500 hover:text-white border border-yellow-500/30 transition-all flex justify-center items-center shadow-lg" title="Edit Member">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(member._id)} className="flex-1 min-w-[35px] p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white border border-red-500/30 transition-all flex justify-center items-center shadow-lg" title="Delete Member">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                );
                })}

                {members.length === 0 && !loading && !isPageLoading && (
                    <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed col-span-1 sm:col-span-2 md:col-span-3 xl:col-span-4">
                        <p className="mb-4">No members found.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Add Member
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
                <div className="flex justify-center items-center gap-4 py-6 mb-10">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isPageLoading}
                        className="px-4 py-2 bg-gray-800 text-white rounded-xl disabled:opacity-50 hover:bg-gray-700 transition font-bold"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400 font-medium">Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isPageLoading}
                        className="px-4 py-2 bg-gray-800 text-white rounded-xl disabled:opacity-50 hover:bg-gray-700 transition font-bold"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Global Loader for Deletion */}
            {isDeletingMember && <BicepCurlLoader text="Deleting Member..." />}

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
                            <div className="mt-4">
                                <label className="block text-gray-400 text-sm font-bold mb-2">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>
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
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[60] p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 h-[85vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                        <AddMemberWizard
                            onClose={() => setShowAddModal(false)}
                            onSuccess={() => {
                                setShowAddModal(false);
                                fetchMembers();
                            }}
                            onDuplicateFound={(existingMember) => {
                                setDuplicateMemberInfo(existingMember);
                                setShowDuplicateModal(true);
                                setShowAddModal(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Duplicate Member Modal */}
            {showDuplicateModal && duplicateMemberInfo && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[60] p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-red-500/50 shadow-2xl relative overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 p-6 border-b border-red-500/20 flex flex-col items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                ⚠️ Duplicate Number Found
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-300 text-sm mb-4">
                                A member with the number <span className="text-white font-bold">{duplicateMemberInfo.mobile}</span> already exists.
                            </p>
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 mb-6">
                                <p className="text-sm text-gray-400 mb-1">Member ID: <span className="text-white font-bold">{duplicateMemberInfo.memberId}</span></p>
                                <p className="text-sm text-gray-400 mb-1">Name: <span className="text-white font-bold">{duplicateMemberInfo.name}</span></p>
                                <p className="text-sm text-gray-400 mb-1">Status: <span className={duplicateMemberInfo.status === 'Active' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{duplicateMemberInfo.status}</span></p>
                                <p className="text-sm text-gray-400">Expiry: <span className="text-white">{duplicateMemberInfo.expiryDate ? new Date(duplicateMemberInfo.expiryDate).toLocaleDateString('en-GB') : 'N/A'}</span></p>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDuplicateModal(false);
                                        setShowAddModal(false);
                                        if (duplicateMemberInfo.status === 'Expired') {
                                            openRenewModal(duplicateMemberInfo);
                                        } else {
                                            openEditModal(duplicateMemberInfo);
                                        }
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    View / Renew Existing Member
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAllowDuplicateMobile(true);
                                        setShowDuplicateModal(false);
                                    }}
                                    className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Create New Profile Anyway
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDuplicateModal(false)}
                                    className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
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
                                <label className="block text-gray-400 text-sm font-bold mb-2">Renewal Type</label>
                                <select
                                    value={renewData.renewalType}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        const defaultStartDate = type === 'Start Fresh' 
                                            ? new Date().toISOString().split('T')[0] 
                                            : new Date(selectedMember.expiryDate).toISOString().split('T')[0];
                                            
                                        setRenewData({
                                            ...renewData,
                                            renewalType: type,
                                            planStartDate: defaultStartDate
                                        });
                                    }}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500"
                                    required
                                >
                                    <option value="" disabled>Select Renewal Type</option>
                                    <option value="Continue Plan">Continue Plan</option>
                                    <option value="Start Fresh">Start Fresh</option>
                                </select>
                                {renewData.renewalType && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        {renewData.renewalType === 'Continue Plan' 
                                            ? `Plan will start from previous expiry date: ${new Date(selectedMember.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` 
                                            : `Plan will start from today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`}
                                    </p>
                                )}
                            </div>

                            {renewData.renewalType && (
                                <Input 
                                    label="Plan Start Date" 
                                    type="date" 
                                    value={renewData.planStartDate} 
                                    onChange={(e) => setRenewData({ ...renewData, planStartDate: e.target.value })} 
                                    required 
                                />
                            )}

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

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <Input label="Total Fee for Renewal" type="number" value={renewData.totalFee} onChange={(e) => setRenewData({ ...renewData, totalFee: e.target.value })} required />
                                <Input label="Paid Amount Now" type="number" value={renewData.paidFee} onChange={(e) => setRenewData({ ...renewData, paidFee: e.target.value })} required />
                            </div>

                            <div className="mb-4 mt-4">
                                <label className="block text-gray-400 text-sm font-bold mb-2">Payment Method</label>
                                <select
                                    value={renewData.paymentMethod}
                                    onChange={(e) => setRenewData({ ...renewData, paymentMethod: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
                                Confirm Renewal
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Renewal Success Modal */}
            {showRenewalSuccessModal && lastRenewalData && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-green-500/50 shadow-2xl overflow-hidden relative">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-green-600/20 to-green-500/10 p-6 border-b border-green-500/20 flex flex-col items-center justify-center relative">
                            <button onClick={() => setShowRenewalSuccessModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">✕</button>
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white text-center">Renewal Successful</h3>
                            <p className="text-green-400 text-sm mt-1 text-center">Membership extended for {lastRenewalData.memberName}</p>
                        </div>
                        
                        {/* Transaction Receipt */}
                        <div className="p-6">
                            <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700/50">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-700/50">
                                    <span className="text-gray-400 text-sm">Plan Duration</span>
                                    <span className="text-white font-medium">{lastRenewalData.plan} Month(s)</span>
                                </div>
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-700/50">
                                    <span className="text-gray-400 text-sm">Amount Paid</span>
                                    <span className="text-white font-medium">₹{lastRenewalData.paidFee}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-700/50">
                                    <span className="text-gray-400 text-sm">Total Pending Due</span>
                                    <span className={`font-medium ${lastRenewalData.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        ₹{lastRenewalData.dueAmount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-gray-400 text-sm">New Expiry</span>
                                    <span className="text-white font-semibold flex items-center gap-1">
                                        {new Date(lastRenewalData.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button 
                                    onClick={sendWhatsAppConfirmation} 
                                    className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors relative"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    Send WhatsApp Confirmation 💬
                                </button>
                                <button 
                                    onClick={() => setShowRenewalSuccessModal(false)} 
                                    className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-white font-medium py-3 rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
                    {isEditingMember && <BicepCurlLoader text="Updating Member..." />}
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-bold text-white">Edit Member</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        {!editData ? (
                            <div className="p-6 space-y-6 animate-pulse">
                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto md:mx-0"></div>
                                    <div className="flex-1 space-y-4">
                                        <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                        <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                    <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                    <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                    <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                </div>
                                <div className="h-12 bg-gray-700 rounded-lg w-full"></div>
                                <button type="button" disabled className="w-full bg-yellow-600/50 text-white/50 font-bold py-3 rounded-lg mt-4 cursor-not-allowed">
                                    Loading...
                                </button>
                            </div>
                        ) : (
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-400 mb-2">Maximum file size: 2MB. Images will be automatically optimized for faster upload.</p>
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-900 overflow-hidden relative">
                                        {editPhotoPreview ? (
                                            <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="text-gray-500" size={32} />
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => document.getElementById('editPhotoInput').click()} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                                            Change
                                        </button>
                                        {editPhotoPreview && (
                                            <button type="button" onClick={() => { setEditPhotoFile(null); setEditPhotoPreview(null); setEditRemovePhoto(true); document.getElementById('editPhotoInput').value = ''; }} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg transition-colors">
                                                Remove
                                            </button>
                                        )}
                                        <input type="file" id="editPhotoInput" onChange={handleEditPhotoChange} accept="image/jpeg, image/png, image/jpg" className="hidden" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input label="Name" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} maxLength={50} required />
                                        <Input
                                            label="Mobile"
                                            value={editData.mobile}
                                            onChange={(e) => setEditData({ ...editData, mobile: e.target.value.replace(/\D/g, '') })}
                                            pattern="^[0-9]{10}$"
                                            minLength={10}
                                            maxLength={10}
                                            title="Mobile number must be exactly 10 digits"
                                            error={editData.mobile.length > 0 && editData.mobile.length < 10 ? "Mobile number must be exactly 10 digits" : ""}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Joining Date (Read Only)</label>
                                    <input
                                        type="text"
                                        value={new Date(editData.joiningDate).toLocaleDateString('en-GB')}
                                        disabled
                                        className="w-full bg-gray-700/50 border border-gray-600 text-gray-400 rounded-xl px-4 py-3 cursor-not-allowed"
                                    />
                                </div>
                                <DOBField value={editData.dob} onChange={(date) => setEditData({ ...editData, dob: date })} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Input label="Age" type="number" value={editData.age} onChange={(e) => setEditData({ ...editData, age: e.target.value })} min={10} max={80} />
                                <Input label="Weight (kg)" type="number" value={editData.weight} onChange={(e) => setEditData({ ...editData, weight: e.target.value })} min={20} max={300} />
                                <Input label="Height (cm)" type="number" value={editData.height} onChange={(e) => setEditData({ ...editData, height: e.target.value })} min={50} max={250} />
                            </div>
                            <Input label="City" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} maxLength={50} />

                            {/* Not allowing Date/Plan edits in simple edit, use Renew for plan changes usually, but let's allow basic corrections if needed. */}
                            {/* Simplified for standard edit: Personal details */}

                            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg mt-4">
                                Update Member
                            </button>
                        </form>
                        )}
                    </div>
                </div>
            )}
            {/* Photo Viewer Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4" onClick={() => setShowPhotoModal(false)}>
                    <div className="relative max-w-full max-h-full">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowPhotoModal(false); }} 
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors p-2 font-bold"
                        >
                            ✕ Close
                        </button>
                        <img 
                            src={selectedPhoto} 
                            alt="Enlarged profile" 
                            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg border border-gray-700 shadow-2xl" 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                </div>
            )}

            {/* Cropper Modal */}
            {showCropModal && cropImageFile && (
                <ImageCropper
                    imageFile={cropImageFile}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 transition-opacity duration-300" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 transform transition-all duration-300 scale-100 flex flex-col" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-2xl shrink-0">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <History className="text-blue-400" size={24} /> 
                                Payment History
                            </h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto grow">
                            {isHistoryLoading ? (
                                <div className="flex justify-center items-center py-10">
                                    <BicepCurlLoader text="Loading History..." />
                                </div>
                            ) : historyData ? (
                                <>
                                    <div className="text-center mb-6">
                                        <p className="text-gray-400 uppercase text-xs font-bold tracking-wider">Member</p>
                                        <p className="text-white text-xl font-black">{historyData.name}</p>
                                    </div>

                                    {historyData.history.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-900/40 rounded-xl border border-gray-700 border-dashed">
                                            No transactions yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {historyData.history.map((txn, index) => {
                                                const type = txn.transactionType || "unknown";
                                                
                                                let theme = 'bg-gray-700/30 border-gray-600 text-gray-400';
                                                let badge = 'bg-gray-600 text-white';
                                                let typeText = "Other";

                                                if (type === 'registration') {
                                                    theme = 'bg-blue-900/20 border-blue-500/30 text-blue-400';
                                                    badge = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
                                                    typeText = 'Registration';
                                                } else if (type === 'renewal') {
                                                    theme = 'bg-green-900/20 border-green-500/30 text-green-400';
                                                    badge = 'bg-green-500/20 text-green-400 border border-green-500/30';
                                                    typeText = 'Renewal';
                                                } else if (type === 'due') {
                                                    theme = 'bg-orange-900/20 border-orange-500/30 text-orange-500';
                                                    badge = 'bg-orange-500/20 text-orange-500 border border-orange-500/30';
                                                    typeText = 'Due Payment';
                                                }

                                                const dateStr = new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + new Date(txn.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                                                return (
                                                    <div key={txn._id || index} className={`relative p-5 rounded-xl border ${theme} shadow-sm`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${badge}`}>
                                                                {typeText}
                                                            </span>
                                                            <span className="text-gray-400 text-[10px] sm:text-xs font-medium">{dateStr}</span>
                                                        </div>
                                                        <div className="mt-3 relative z-10 flex flex-col gap-1">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-sm font-semibold opacity-80">Paid:</span>
                                                                <span className="text-2xl font-black text-white ml-1 tracking-tight">₹{txn.amount}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1 mt-1 border-t border-gray-700/50 pt-2">
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-400 font-medium">Plan:</span>
                                                                    <span className="text-gray-200 font-bold">{txn.plan || "-"}</span>
                                                                </div>
                                                                {txn.remainingDue !== undefined && txn.remainingDue > 0 && (
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-gray-400 font-medium">Remaining Due:</span>
                                                                        <span className="text-orange-400 font-bold drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]">₹{txn.remainingDue}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersPage;
