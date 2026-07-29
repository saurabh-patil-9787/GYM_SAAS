import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { RefreshCw, CheckCircle, XCircle, KeyRound, MessageCircle, Clock, ShieldAlert } from 'lucide-react';

const PasswordResetRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/members/password-reset-requests');
            // Filter out completed, rejected, and expired requests so they don't clutter the active view
            const activeRequests = res.data.filter(req => 
                req.status === 'PENDING' || req.status === 'APPROVED'
            );
            setRequests(activeRequests);
        } catch (err) {
            setError('Failed to fetch password reset requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
        try {
            const res = await api.post(`/api/members/password-reset-requests/${id}/${action}`);
            
            // Re-fetch to get updated state
            await fetchRequests();
            
            if (res.data.temporaryPassword) {
                alert(`Temporary Password Generated: ${res.data.temporaryPassword}\n\nPlease share this with the member.`);
            }
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} request`);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
            case 'APPROVED':
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle size={12} /> Approved</span>;
            case 'REJECTED':
                return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-200 flex items-center gap-1 w-fit"><XCircle size={12} /> Rejected</span>;
            case 'EXPIRED':
            case 'COMPLETED':
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1 w-fit"><CheckCircle size={12} /> {status}</span>;
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold w-fit">{status}</span>;
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Password Resets</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage member password reset requests</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {requests.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-sm">
                    <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Reset Requests</h3>
                    <p className="text-slate-500 text-sm mt-1">You don't have any password reset requests from members right now.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <div key={request._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-indigo-100 hover:shadow-md">
                            <div className="flex items-center gap-4">
                                {request.member?.photoUrl ? (
                                    <img src={request.member.photoUrl} alt="Member" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                        {request.member?.name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-slate-800">{request.member?.name || 'Unknown Member'}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{request.member?.mobile || 'No Mobile'} • Requested {new Date(request.requestedAt).toLocaleDateString()}</p>
                                    <div className="mt-2">
                                        {getStatusBadge(request.status)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                {request.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(request._id, 'approve')}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(request._id, 'reject')}
                                            className="px-4 py-2 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                
                                {request.status === 'APPROVED' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(request._id, 'regenerate')}
                                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                                        >
                                            <KeyRound size={14} /> Regenerate
                                        </button>
                                        <a
                                            href={`https://wa.me/91${request.member?.mobile}?text=${encodeURIComponent(`Hi ${request.member?.name},\n\nYour password reset request has been approved. Please use this temporary password to create a new password:\n\n*Temporary Password will be provided manually*\n\nGo to the Member app and click 'Check Request Status'.`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                                        >
                                            <MessageCircle size={14} /> Notify via WhatsApp
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PasswordResetRequests;
