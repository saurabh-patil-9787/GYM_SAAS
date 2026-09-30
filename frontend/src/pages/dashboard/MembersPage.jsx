import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { getAccessToken } from '../../api/axios';
import { Plus, Search, Filter, Phone, IndianRupee, Trash2, Edit, RefreshCw, Upload, Image as ImageIcon, Download, History, X, Tag, FileText, Send } from 'lucide-react';

// Inline WhatsApp icon (no external dependency, works in html2canvas)
const WhatsAppIcon = ({ size = 20, color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} fill={color}>
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.824.738 5.477 2.031 7.785L0 32l8.469-2.219A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.25a13.21 13.21 0 0 1-6.725-1.833l-.482-.286-4.99 1.308 1.33-4.86-.315-.5A13.197 13.197 0 0 1 2.75 16C2.75 8.682 8.682 2.75 16 2.75S29.25 8.682 29.25 16 23.318 29.25 16 29.25zm7.243-9.87c-.397-.199-2.35-1.16-2.715-1.291-.365-.132-.63-.199-.896.199-.265.397-1.029 1.291-1.26 1.556-.232.265-.464.298-.861.1-.397-.2-1.677-.618-3.194-1.972-1.18-1.053-1.977-2.353-2.209-2.75-.232-.397-.025-.612.174-.81.178-.177.397-.464.596-.696.199-.232.265-.397.397-.662.132-.265.066-.497-.033-.696-.099-.199-.896-2.16-1.228-2.956-.324-.776-.65-.671-.896-.683l-.762-.013c-.265 0-.696.1-.1061.497-.364.397-1.392 1.36-1.392 3.316 0 1.956 1.425 3.848 1.623 4.113.199.265 2.805 4.282 6.797 6.004.95.41 1.691.655 2.269.838.954.303 1.822.26 2.509.158.765-.114 2.35-.962 2.681-1.89.33-.928.33-1.723.232-1.89-.099-.166-.364-.265-.762-.464z" />
    </svg>
);
import Input from '../../components/Input';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import ImageCropper from '../../components/ImageCropper';
import DOBField from '../../components/DOBField';
import { useImageUpload } from '../../hooks/useImageUpload';
import AddMemberWizard from '../../components/members/AddMemberWizard';
import SuccessModal from '../../components/common/SuccessModal';
import { useRealtimeEvent } from '../../context/RealtimeContext';
import MembershipShareCard from '../../components/members/MembershipShareCard';
import useWhatsAppCardShare from '../../hooks/useWhatsAppCardShare';
import { generateWhatsAppMessage, MESSAGE_TYPES, detectMessageType } from '../../utils/whatsappMessages';
import { normalizeWhatsAppNumber } from '../../services/whatsappService';

const MembersPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const filterStatus = searchParams.get('status');
    const navigate = useNavigate();


    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(30);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
    const [lastAddedMemberData, setLastAddedMemberData] = useState(null);

    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setShowAddModal(true);
            // Clean up the URL without triggering a React Router re-render
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    // Photo Viewer Modal State
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [shareMember, setShareMember] = useState(null);
    const [shareMessage, setShareMessage] = useState('');
    const [shareMessageType, setShareMessageType] = useState('renewal_reminder');
    const [shareLoading, setShareLoading] = useState(false);
    const [shareNotice, setShareNotice] = useState(null);
    // Card sharing remains available in the hook for a future official-media
    // flow. The owner WhatsApp UI currently sends text directly to the member.
    const { sendWhatsAppText } = useWhatsAppCardShare();

    const handlePhotoClick = (photoUrl) => {
        if (photoUrl) {
            setSelectedPhoto(photoUrl);
            setShowPhotoModal(true);
        }
    };

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [paymentDepositAmount, setPaymentDepositAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
    const [lastPaymentData, setLastPaymentData] = useState(null);

    // Renewal Modal State
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewData, setRenewData] = useState({
        planDuration: '1',
        planName: '',
        totalFee: '',
        paidFee: '',
        renewalType: '',
        planStartDate: '',
        paymentMethod: 'Cash'
    });

    // Gym Plans State (for renewal + add member plan selectors)
    const [gymPlans, setGymPlans] = useState([]);

    // Renewal Success State
    const [showRenewalSuccessModal, setShowRenewalSuccessModal] = useState(false);
    const [lastRenewalData, setLastRenewalData] = useState(null);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [editData, setEditData] = useState(null);
    const {
        showCropModal,
        cropImageFile,
        previewUrl: editPhotoPreview,
        finalFile: editPhotoFile,
        handleFileSelect: handleEditPhotoChange,
        handleCropComplete,
        closeCropModal: handleCropCancel,
        resetUpload,
        setInitialPreview
    } = useImageUpload();
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

    // Photo logic managed by useImageUpload hook

    const fetchMembers = useCallback(async (pageToFetch = currentPage) => {
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
    }, [currentPage, search, filterStatus, limit]);

    // Fetch gym plans once on mount for renewal modal
    useEffect(() => {
        api.get('/api/plans').then(res => setGymPlans(res.data || [])).catch(() => { });
    }, []);

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

    // Auto-refresh member list when a renewal request comes in from a member
    useRealtimeEvent('renewal_request', () => fetchMembers(currentPage));
    // â”€â”€ SSE P2: refresh when owner adds a member (wizard or quick-add) or updates profile â”€â”€
    useRealtimeEvent('member_added', () => fetchMembers(1));
    useRealtimeEvent('member_updated', () => fetchMembers(currentPage));

    const openPaymentModal = (member) => {
        const pendingAmount = member.totalFee - member.paidFee;
        if (pendingAmount <= 0) {
            alert('No pending amount for this member.');
            return;
        }
        setSelectedMember(member);
        setPaymentDepositAmount(''); // Clear previous input
        setPaymentMethod('Cash');
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        const depositAmountNum = Number(paymentDepositAmount);
        const oldPendingNum = selectedMember.totalFee - selectedMember.paidFee;

        if (depositAmountNum <= 0) {
            alert('Deposit amount must be greater than 0.');
            return;
        }

        if (depositAmountNum > oldPendingNum) {
            alert(`Deposit amount cannot exceed the pending amount (\u20B9${oldPendingNum}).`);
            return;
        }

        try {
            await api.put(`/api/members/${selectedMember._id}/pay`, { amount: depositAmountNum, type: paymentMethod });

            const newPendingNum = oldPendingNum - depositAmountNum;
            setLastPaymentData({
                name: selectedMember.name,
                oldPending: oldPendingNum,
                depositAmount: depositAmountNum,
                newPending: newPendingNum
            });

            setShowPaymentModal(false);
            setShowPaymentSuccessModal(true);
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
            planName: '',
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

    const openMembershipShare = (member, forceType) => {
        if (!normalizeWhatsAppNumber(member?.mobile)) {
            setShareNotice({ type: 'error', text: 'Member does not have a valid mobile number.' });
            return;
        }
        const type = forceType || detectMessageType(member);
        const gymName = user?.gymName || user?.gym?.name || 'Gym';
        setShareMessageType(type);
        setShareMessage(generateWhatsAppMessage(type, { member, gymName }));
        setShareMember(member);
    };

    const handleShareMessageTypeChange = (type) => {
        setShareMessageType(type);
        const gymName = user?.gymName || user?.gym?.name || 'Gym';
        setShareMessage(generateWhatsAppMessage(type, { member: shareMember, gymName }));
    };

    const shareMembershipCard = () => {
        if (!shareMember) return;
        if (!sendWhatsAppText(shareMember, shareMessage)) {
            setShareNotice({ type: 'error', text: 'Member does not have a valid mobile number.' });
            return;
        }
        setShareMember(null);
        setShareNotice({ type: 'success', text: 'WhatsApp opened for this member.' });
    };


    // Direct text-only WhatsApp welcome after adding a member.
    const sendWhatsAppWelcome = () => {
        if (!lastAddedMemberData || !lastAddedMemberData.mobile) return;
        const gymName = user?.gymName || user?.gym?.name || 'our gym';
        const memberForMessage = {
            ...lastAddedMemberData,
            name: lastAddedMemberData.name,
            mobile: lastAddedMemberData.mobile,
            planName: lastAddedMemberData.planName || '',
            planDuration: lastAddedMemberData.plan,
            totalFee: lastAddedMemberData.totalFee,
            paidFee: lastAddedMemberData.paidFee,
            expiryDate: lastAddedMemberData.expiryDate,
            joiningDate: lastAddedMemberData.joiningDate,
        };

        if (sendWhatsAppText(memberForMessage, generateWhatsAppMessage('welcome', { member: memberForMessage, gymName }))) {
            setShareNotice({ type: 'success', text: 'WhatsApp opened for this member.' });
        }
        setShowAddSuccessModal(false);
    };

    const sendWhatsAppConfirmation = () => {
        if (!lastRenewalData) return;
        const gymName = user?.gymName || user?.gym?.name || 'our gym';

        const memberForMessage = {
            name: lastRenewalData.memberName,
            mobile: lastRenewalData.mobile,
            planDuration: lastRenewalData.plan,
            totalFee: lastRenewalData.totalFee,
            paidFee: lastRenewalData.paidFee,
            expiryDate: lastRenewalData.expiryDate,
        };

        if (sendWhatsAppText(memberForMessage, generateWhatsAppMessage('renewal_confirmation', { member: memberForMessage, gymName }))) {
            setShareNotice({ type: 'success', text: 'WhatsApp opened for this member.' });
        }
        setShowRenewalSuccessModal(false);
    };


    // Edit Logic
    const openEditModal = (member) => {
        setSelectedMember(member);
        setEditData(null);
        resetUpload();
        if (member.photoUrl) {
            setInitialPreview(member.photoUrl);
        }
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
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    throw new Error(errorData.errors.join(', '));
                }
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

    const handleExportExcel = async () => {
        if (members.length === 0) {
            alert('No members available to export.');
            return;
        }

        // Dynamic import â€” xlsx (~200KB) only loads when user clicks Export
        const XLSX = await import('xlsx');

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
        <div className="relative min-h-screen bg-slate-50">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between animate-fade-in pt-1 sm:pt-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Members</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Manage your gym members</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-64 bg-white border border-slate-300 text-slate-800 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm placeholder-slate-400 shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all text-sm active:scale-[0.98] shadow-sm"
                        >
                            <Plus size={18} /> Add
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center justify-center px-3.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-300 transition-all active:scale-[0.98]"
                            title="Export members to Excel"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div className="members-grid pb-20">
                {loading && (
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 xl:col-span-4 py-12 flex justify-center">
                        <BicepCurlLoader text="Loading Members..." fullScreen={false} />
                    </div>
                )}

                {members.map((member) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const expDate = new Date(member.expiryDate);
                    expDate.setHours(0, 0, 0, 0);
                    const daysDiff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

                    const isExpired = daysDiff < 0;
                    const due = member.totalFee - member.paidFee;
                    const pendingDue = due > 0;
                    const dateStr = new Date(member.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

                    const getAvatarBg = (name) => {
                        if (!name) return '#0d9488';
                        const firstLetter = name.charAt(0).toUpperCase();
                        const colors = ['#0d9488', '#ea580c', '#2563eb', '#9333ea', '#be123c', '#ca8a04', '#4f46e5', '#059669'];
                        const index = firstLetter.charCodeAt(0) % colors.length;
                        return colors[index];
                    };
                    const avatarBg = getAvatarBg(member.name);

                    return (
                        <div key={member._id} className={`card ${isExpired ? 'expired' : 'active'}`}>
                            <div className="relative z-10 pl-1">
                                {/* TOP ROW: Avatar + Name + Status pill */}
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="avatar" style={{ backgroundColor: member.photoUrl ? 'transparent' : avatarBg }} onClick={() => handlePhotoClick(member.photoUrl)}>
                                        {member.photoUrl
                                            ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                            : (member.name ? member.name.charAt(0).toUpperCase() : '')
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="card-name truncate" title={member.name}>{member.name}</p>
                                            <span className={`status-badge ${isExpired ? 'expired' : 'active'}`}>
                                                {isExpired ? 'Expired' : pendingDue ? 'Due' : 'Active'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="card-subtext font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">#{member.memberId}</span>
                                            <span className="card-subtext flex items-center gap-1">
                                                <Phone size={10} /> {member.mobile}
                                            </span>
                                        </div>
                                        {member.planName && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Tag size={9} className="text-indigo-400 shrink-0" />
                                                <span className="text-[10px] text-indigo-300 font-medium truncate leading-tight" title={member.planName}>{member.planName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* MIDDLE ROW: Plan info + Due amount â€” horizontal scroll safe */}
                                <div className="card-divider flex items-center justify-between py-2 mb-2 overflow-x-auto no-scrollbar gap-3">
                                    <div className="flex-shrink-0">
                                        <p className="card-stat-label mb-1">Plan</p>
                                        <p className="card-stat-value">{member.planDuration || '1'}M</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <p className="card-stat-label mb-1">Expires</p>
                                        <p className={`card-stat-value ${isExpired ? 'expired-val' : ''}`}>
                                            {dateStr}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <p className="card-stat-label mb-1">Due</p>
                                        <p className={`card-stat-value ${pendingDue ? 'expired-val' : ''}`}>
                                            {'\u20B9'}{pendingDue ? due.toLocaleString('en-IN') : '0'}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <p className="card-stat-label mb-1">Days</p>
                                        <p className={`card-stat-value ${daysDiff < 0 ? 'expired-val' : 'active-val'}`}>
                                            {daysDiff < 0 ? `${Math.abs(daysDiff)}d ago` : `${daysDiff}d left`}
                                        </p>
                                    </div>
                                </div>

                                {/* BOTTOM ROW: Action buttons â€” equal width, touch-friendly */}
                                <div className="card-divider pt-2 flex gap-2">
                                    {pendingDue && (
                                        <button onClick={() => openPaymentModal(member)}
                                            className="flex-1 flex items-center justify-center gap-1.5 h-11 action-renew text-xs font-semibold" title="Pay">
                                            <IndianRupee size={13} /> Pay
                                        </button>
                                    )}
                                <button onClick={() => openMembershipShare(member)} disabled={shareLoading} className="w-11 flex items-center justify-center h-11 action-wa text-xs font-semibold disabled:opacity-60" aria-label="Send WhatsApp message" title="Send WhatsApp message">
                                    <WhatsAppIcon size={18} />
                                    </button>
                                    <button onClick={() => openRenewModal(member)}
                                        className="flex-1 flex items-center justify-center gap-1.5 h-11 action-renew text-xs font-semibold" title="Renew">
                                        <RefreshCw size={13} /> Renew
                                    </button>
                                    <button onClick={() => openHistoryModal(member._id)}
                                        className="w-11 h-11 flex items-center justify-center action-ghost shrink-0 cursor-pointer" title="History">
                                        <History size={15} />
                                    </button>
                                    <button onClick={() => openEditModal(member)}
                                        className="w-11 h-11 flex items-center justify-center action-ghost shrink-0 cursor-pointer" title="Edit">
                                        <Edit size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(member._id)}
                                        className="w-11 h-11 flex items-center justify-center action-ghost shrink-0 cursor-pointer" title="Delete">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {members.length === 0 && !loading && !isPageLoading && (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 col-span-1 sm:col-span-2 md:col-span-3 xl:col-span-4 mx-4 sm:mx-6 lg:mx-8">
                        <p className="mb-4">No members found.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Add Member
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
                <div className="flex justify-center items-center gap-4 py-6 mb-10 px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isPageLoading}
                        className="px-4 py-2 bg-white text-slate-700 rounded-xl disabled:opacity-50 hover:bg-slate-100 transition font-bold border border-slate-300"
                    >
                        Previous
                    </button>
                    <span className="text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isPageLoading}
                        className="px-4 py-2 bg-white text-slate-700 rounded-xl disabled:opacity-50 hover:bg-slate-100 transition font-bold border border-slate-300"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Global Loader for Deletion */}
            {isDeletingMember && <BicepCurlLoader text="Deleting Member..." />}

            {/* Payment Modal */}
            {showPaymentModal && selectedMember && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-all duration-300">
                    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-slate-200 border-b-0 sm:border-b transition-all duration-300 shadow-2xl">
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                        </div>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-800">Record Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">×</button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
                            <p className="text-slate-500 text-sm mb-3">Member: <span className="text-slate-800 font-semibold">{selectedMember.name}</span></p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Pending Amount</span>
                                    <span className="text-slate-800 font-bold text-lg">{'\u20B9'}{selectedMember.totalFee - selectedMember.paidFee}</span>
                                </div>
                            </div>
                            <Input label="Deposit Amount (₹)" type="number" value={paymentDepositAmount} onChange={(e) => setPaymentDepositAmount(e.target.value)} required min="1" max={selectedMember.totalFee - selectedMember.paidFee} />
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium border border-slate-200 transition-all duration-200 active:scale-[0.98]">Cancel</button>
                                <button type="submit" className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98]">
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 transition-all duration-300">
                    <div className="bg-white w-full sm:max-w-3xl lg:max-w-4xl sm:rounded-2xl rounded-t-3xl border border-slate-200 border-b-0 sm:border-b h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden relative transition-all duration-300">
                        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0 bg-white">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                        </div>
                        <AddMemberWizard
                            onClose={() => setShowAddModal(false)}
                            onSuccess={(newMemberData) => {
                                setShowAddModal(false);
                                setLastAddedMemberData({
                                    name: newMemberData?.name || 'New Member',
                                    mobile: newMemberData?.mobile || '',
                                    joiningDate: newMemberData?.joiningDate || new Date().toISOString(),
                                    expiryDate: newMemberData?.expiryDate || null,
                                    plan: newMemberData?.planDuration ? `${newMemberData.planDuration} Month(s)` : "Custom",
                                    planName: newMemberData?.planName || '',
                                    totalFee: newMemberData?.totalFee ?? '',
                                    paidFee: newMemberData?.paidFee ?? '',
                                    dueAmount: (Number(newMemberData?.totalFee) || 0) - (Number(newMemberData?.paidFee) || 0)
                                });
                                setShowAddSuccessModal(true);
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 transition-all duration-300">
                    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-rose-200 shadow-2xl relative overflow-hidden transition-all duration-300 border-b-0 sm:border-b">
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                        </div>
                        <div className="bg-rose-50 p-5 border-b border-rose-100 flex flex-col items-center">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                Duplicate Number Found
                            </h3>
                        </div>
                        <div className="p-5">
                            <p className="text-slate-600 text-sm mb-4">
                                A member with the number <span className="text-slate-800 font-bold">{duplicateMemberInfo.mobile}</span> already exists.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5">
                                <p className="text-sm text-slate-500 mb-1">Member ID: <span className="text-slate-800 font-bold">{duplicateMemberInfo.memberId}</span></p>
                                <p className="text-sm text-slate-500 mb-1">Name: <span className="text-slate-800 font-bold">{duplicateMemberInfo.name}</span></p>
                                <p className="text-sm text-slate-500 mb-1">Status: <span className={duplicateMemberInfo.status === 'Active' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{duplicateMemberInfo.status}</span></p>
                                <p className="text-sm text-slate-500">Expiry: <span className="text-slate-800">{duplicateMemberInfo.expiryDate ? new Date(duplicateMemberInfo.expiryDate).toLocaleDateString('en-GB') : 'N/A'}</span></p>
                            </div>

                            <div className="flex flex-col gap-2">
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
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]"
                                >
                                    View / Renew Existing Member
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAllowDuplicateMobile(true);
                                        setShowDuplicateModal(false);
                                    }}
                                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                                >
                                    Create New Profile Anyway
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDuplicateModal(false)}
                                    className="w-full px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium border border-slate-200 transition-all duration-200 active:scale-[0.98]"
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-all duration-300">
                    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-slate-200 border-b-0 sm:border-b transition-all duration-300 max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                        </div>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="text-base font-bold text-slate-800">Renew Membership</h3>
                            <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">×</button>
                        </div>
                        <div className="overflow-y-auto no-scrollbar">
                            <form onSubmit={handleRenewSubmit} className="p-5 space-y-4">
                                <p className="text-slate-500 text-sm mb-2">Renew for: <span className="text-slate-800 font-semibold">{selectedMember.name}</span></p>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Renewal Type</label>
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
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                                        required
                                    >
                                        <option value="" disabled>Select Renewal Type</option>
                                        <option value="Continue Plan">Continue Plan</option>
                                        <option value="Start Fresh">Start Fresh</option>
                                    </select>
                                    {renewData.renewalType && (
                                        <p className="text-xs text-indigo-600 mt-2 font-medium">
                                            {renewData.renewalType === 'Continue Plan'
                                                ? `Plan will start from previous expiry date: ${new Date(selectedMember.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                                                : `Plan will start from today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
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

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Plan</label>
                                    {gymPlans.length > 0 ? (
                                        <select
                                            value={renewData.planName}
                                            onChange={(e) => {
                                                const selected = gymPlans.find(p => p.planName === e.target.value);
                                                if (selected) {
                                                    setRenewData(prev => ({
                                                        ...prev,
                                                        planName: selected.planName,
                                                        planDuration: String(selected.duration),
                                                        totalFee: String(selected.price)
                                                    }));
                                                }
                                            }}
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="">Select Plan</option>
                                            {gymPlans.filter(p => p.status !== 'Inactive').map(p => (
                                                <option key={p._id} value={p.planName}>
                                                    {p.planName} ({p.duration}M) — {'\u20B9'}{p.price}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            value={renewData.planDuration}
                                            onChange={(e) => setRenewData({ ...renewData, planDuration: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="1">1 Month</option>
                                            <option value="3">3 Months</option>
                                            <option value="6">6 Months</option>
                                            <option value="12">1 Year</option>
                                        </select>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Total Fee" type="number" value={renewData.totalFee} onChange={(e) => setRenewData({ ...renewData, totalFee: e.target.value })} required />
                                    <Input label="Paid Now" type="number" value={renewData.paidFee} onChange={(e) => setRenewData({ ...renewData, paidFee: e.target.value })} required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Payment Method</label>
                                    <select
                                        value={renewData.paymentMethod}
                                        onChange={(e) => setRenewData({ ...renewData, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>

                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]">
                                        Confirm Renewal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modals using Reusable Component */}

            <SuccessModal
                isOpen={showAddSuccessModal}
                onClose={() => setShowAddSuccessModal(false)}
                title="Member Added!"
                subtitle={lastAddedMemberData ? `Welcome to the gym, ${lastAddedMemberData.name}!` : ''}
                data={lastAddedMemberData ? [
                    { label: "Name", value: lastAddedMemberData.name },
                    { label: "Plan", value: lastAddedMemberData.planName ? `${lastAddedMemberData.planName} \u00B7 ${lastAddedMemberData.plan}` : lastAddedMemberData.plan, highlight: true },
                    { label: "Total Fee", value: lastAddedMemberData.totalFee !== '' ? `\u20B9${lastAddedMemberData.totalFee}` : 'N/A' },
                    { label: "Paid", value: lastAddedMemberData.paidFee !== '' ? `\u20B9${lastAddedMemberData.paidFee}` : 'N/A' },
                    { label: "Due", value: lastAddedMemberData.dueAmount > 0 ? `\u20B9${lastAddedMemberData.dueAmount}` : '\u20B90 (Fully Paid)', highlight: lastAddedMemberData.dueAmount === 0 },
                    { label: "Valid Till", value: lastAddedMemberData.expiryDate ? new Date(lastAddedMemberData.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A' }
                ] : []}
                secondaryActionText="Send WhatsApp Welcome"
                onSecondaryAction={sendWhatsAppWelcome}
                secondaryVariant="whatsapp"
                secondaryIcon={
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                }
            />

            <SuccessModal
                isOpen={showPaymentSuccessModal}
                onClose={() => setShowPaymentSuccessModal(false)}
                title="Payment Recorded"
                subtitle={`Payment for ${lastPaymentData?.name}`}
                data={lastPaymentData ? [
                    { label: "Previous Pending", value: `\u20B9${lastPaymentData.oldPending}` },
                    { label: "Paid Now", value: `\u20B9${lastPaymentData.depositAmount}` },
                    { label: "Remaining Pending", value: lastPaymentData.newPending === 0 ? "\u20B90 (Fully Paid)" : `\u20B9${lastPaymentData.newPending}`, highlight: lastPaymentData.newPending === 0 }
                ] : []}
            />

            <SuccessModal
                isOpen={showRenewalSuccessModal}
                onClose={() => setShowRenewalSuccessModal(false)}
                title="Renewal Successful"
                subtitle={lastRenewalData ? `Membership extended for ${lastRenewalData.memberName}` : ''}
                data={lastRenewalData ? [
                    { label: "Plan Duration", value: `${lastRenewalData.plan} Month(s)` },
                    { label: "Amount Paid", value: `\u20B9${lastRenewalData.paidFee}` },
                    { label: "Total Pending Due", value: `\u20B9${lastRenewalData.dueAmount}`, highlight: lastRenewalData.dueAmount === 0 },
                    { label: "New Expiry", value: new Date(lastRenewalData.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
                ] : []}
                secondaryActionText="Send WhatsApp Renewal Confirmation"
                onSecondaryAction={sendWhatsAppConfirmation}
                secondaryVariant="whatsapp"
                secondaryIcon={
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                }
            />

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-all duration-300">
                    {isEditingMember && <BicepCurlLoader text="Updating Member..." />}
                    <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl border border-slate-200 border-b-0 sm:border-b transition-all duration-300 max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                        </div>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="text-base font-bold text-slate-800">Edit Member</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">×</button>
                        </div>
                        <div className="overflow-y-auto no-scrollbar p-5">
                            {!editData ? (
                                <div className="space-y-6 animate-pulse">
                                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                                        <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto md:mx-0"></div>
                                        <div className="flex-1 space-y-4">
                                            <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                                            <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                                        <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                                    </div>
                                    <div className="h-12 bg-slate-100 rounded-xl w-full mt-4"></div>
                                </div>
                            ) : (
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <p className="text-xs text-slate-400 mb-2">Maximum file size: 2MB. Images will be automatically optimized.</p>
                                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-20 h-20 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                                                {editPhotoPreview ? (
                                                    <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-slate-400" size={24} />
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => document.getElementById('editPhotoInput').click()} className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
                                                    Change
                                                </button>
                                                {editPhotoPreview && (
                                                    <button type="button" onClick={() => { resetUpload(); setEditRemovePhoto(true); document.getElementById('editPhotoInput').value = ''; }} className="text-[10px] uppercase tracking-wider font-bold bg-rose-50 hover:bg-rose-100 text-rose-500 px-3 py-1.5 rounded-lg transition-colors border border-rose-200">
                                                        Remove
                                                    </button>
                                                )}
                                                <input type="file" id="editPhotoInput" onChange={(e) => { handleEditPhotoChange(e.target.files[0]); e.target.value = ''; }} accept="image/jpeg, image/png, image/jpg" className="hidden" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-1 gap-3">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Joining Date (Read Only)</label>
                                            <input
                                                type="text"
                                                value={new Date(editData.joiningDate).toLocaleDateString('en-GB')}
                                                disabled
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-4 py-3 cursor-not-allowed text-sm"
                                            />
                                        </div>
                                        <DOBField value={editData.dob} onChange={(date) => setEditData({ ...editData, dob: date })} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <Input label="Age" type="number" value={editData.age} onChange={(e) => setEditData({ ...editData, age: e.target.value })} min={10} max={80} />
                                        <Input label="Weight (kg)" type="number" value={editData.weight} onChange={(e) => setEditData({ ...editData, weight: e.target.value })} min={20} max={300} />
                                        <Input label="Height (cm)" type="number" value={editData.height} onChange={(e) => setEditData({ ...editData, height: e.target.value })} min={50} max={250} />
                                    </div>
                                    <Input label="City" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} maxLength={50} />

                                    <div className="pt-2">
                                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]">
                                            Update Member
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Photo Viewer Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex justify-center items-center z-[70] p-4 transition-all duration-300" onClick={() => setShowPhotoModal(false)}>
                    <div className="relative max-w-full max-h-full">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowPhotoModal(false); }}
                            className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors p-2 font-bold bg-white/[0.05] hover:bg-white/[0.1] rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-sm border border-white/[0.05]"
                        >
                            ×
                        </button>
                        <img
                            src={selectedPhoto}
                            alt="Enlarged profile"
                            className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl border border-white/[0.1] shadow-2xl"
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-all duration-300" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-slate-200 border-b-0 sm:border-b transition-all duration-300 max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                            <div className="w-10 h-1 rounded-full bg-slate-200" />
                        </div>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <History className="text-indigo-600" size={18} />
                                Payment History
                            </h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">×</button>
                        </div>
                        <div className="p-5 overflow-y-auto grow no-scrollbar">
                            {isHistoryLoading ? (
                                <div className="flex justify-center items-center py-10">
                                    <BicepCurlLoader text="Loading History..." />
                                </div>
                            ) : historyData ? (
                                <>
                                    <div className="text-center mb-6">
                                        <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">Member</p>
                                        <p className="text-slate-800 text-lg font-black">{historyData.name}</p>
                                    </div>

                                    {historyData.history.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            No transactions yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {historyData.history.map((txn, index) => {
                                                const type = txn.transactionType || "unknown";

                                                let theme = 'bg-slate-50 border-slate-200';
                                                let badge = 'bg-slate-100 text-slate-600';
                                                let typeText = "Other";

                                                if (type === 'registration') {
                                                    theme = 'bg-indigo-50 border-indigo-200';
                                                    badge = 'bg-indigo-100 text-indigo-600';
                                                    typeText = 'Registration';
                                                } else if (type === 'renewal') {
                                                    theme = 'bg-emerald-50 border-emerald-200';
                                                    badge = 'bg-emerald-100 text-emerald-600';
                                                    typeText = 'Renewal';
                                                } else if (type === 'due') {
                                                    theme = 'bg-amber-50 border-amber-200';
                                                    badge = 'bg-amber-100 text-amber-600';
                                                    typeText = 'Due Payment';
                                                }

                                                const dateStr = new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + new Date(txn.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                                                return (
                                                    <div key={txn._id || index} className={`relative p-4 rounded-2xl border ${theme} shadow-sm transition-all duration-200`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge}`}>
                                                                {typeText}
                                                            </span>
                                                            <span className="text-slate-400 text-[10px] font-medium">{dateStr}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xs font-semibold text-slate-400">Paid:</span>
                                                                <span className="text-xl font-black text-slate-800 ml-1">{'\u20B9'}{txn.amount}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-100 pt-2.5">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-400 font-medium">Plan:</span>
                                                                    <span className="text-slate-700 font-semibold">{txn.plan || "-"}</span>
                                                                </div>
                                                                {txn.remainingDue !== undefined && txn.remainingDue > 0 && (
                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="text-slate-400 font-medium">Remaining Due:</span>
                                                                        <span className="text-rose-500 font-bold">{'\u20B9'}{txn.remainingDue}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Generate Invoice shortcut */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowHistoryModal(false);
                                                                    navigate(`/dashboard/billing/generate?memberId=${historyData._id}`);
                                                                }}
                                                                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold border border-indigo-200 transition-all active:scale-[0.98]"
                                                            >
                                                                <FileText size={12} />
                                                                Generate Invoice
                                                            </button>
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
            {shareMember && (
                <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
                    <div className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
                            <div>
                                <p className="text-base font-extrabold text-slate-800">Send WhatsApp message</p>
                                <p className="text-xs text-slate-500">To {shareMember.name} · +91 {shareMember.mobile}</p>
                            </div>
                            <button onClick={() => setShareMember(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5">
                            {/* Message Type Selector */}
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Message type</label>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {MESSAGE_TYPES.map(t => (
                                    <button
                                        key={t.key}
                                        onClick={() => handleShareMessageTypeChange(t.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${shareMessageType === t.key
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-100 shadow-sm'
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                                            }`}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Message Editor */}
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">WhatsApp message</label>
                            <textarea
                                value={shareMessage}
                                onChange={(e) => setShareMessage(e.target.value)}
                                rows={6}
                                className="w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 border-t border-slate-100 p-4 shrink-0">
                            <button onClick={() => setShareMember(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600">Cancel</button>
                            <button
                                onClick={shareMembershipCard}
                                disabled={false}
                                className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-[#1ebe5d] disabled:opacity-60"
                            >
                                <WhatsAppIcon size={18} color="#fff" />Send on WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {shareNotice && (
                <div className={`fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${shareNotice.type === 'error' ? 'bg-rose-600 text-white' : shareNotice.type === 'info' ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <span>{shareNotice.text}</span>
                        <button onClick={() => setShareNotice(null)} aria-label="Dismiss message" className="text-lg leading-none opacity-80 hover:opacity-100">×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersPage;
