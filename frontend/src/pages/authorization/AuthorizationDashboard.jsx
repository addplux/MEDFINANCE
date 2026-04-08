import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, XCircle, Clock, Search,
    User, RefreshCw, CheckCircle2, AlertTriangle,
    ChevronRight, Hash
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthorizationDashboard = () => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [rejectModal, setRejectModal] = useState(null); // { visitId, patientName }
    const [rejectReason, setRejectReason] = useState('');
    const [toast, setToast] = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const params = search ? { search } : {};
            const res = await axios.get(`${API_BASE}/authorization`, { headers, params });
            setVisits(res.data.visits || []);
        } catch (err) {
            console.error('Failed to load authorization queue:', err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchPending();
        // Auto-refresh every 30s
        const interval = setInterval(fetchPending, 30_000);
        return () => clearInterval(interval);
    }, [fetchPending]);

    const handleApprove = async (visitId, patientName) => {
        if (!window.confirm(`Approve authorization for ${patientName}? They will be sent to the Cashier queue.`)) return;
        setProcessingId(visitId);
        try {
            await axios.put(`${API_BASE}/authorization/${visitId}/approve`, {}, { headers });
            showToast(`${patientName} approved — moved to Cashier queue.`, 'success');
            fetchPending();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to approve', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectModal) return;
        setProcessingId(rejectModal.visitId);
        try {
            await axios.put(`${API_BASE}/authorization/${rejectModal.visitId}/reject`, { reason: rejectReason }, { headers });
            showToast(`${rejectModal.patientName} returned to Records.`, 'warning');
            setRejectModal(null);
            setRejectReason('');
            fetchPending();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to reject', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMin = Math.floor((now - d) / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const h = Math.floor(diffMin / 60);
        return `${h}h ${diffMin % 60}m ago`;
    };

    const getWaitColor = (dateStr) => {
        const diffMin = Math.floor((new Date() - new Date(dateStr)) / 60000);
        if (diffMin < 15) return 'text-emerald-400';
        if (diffMin < 30) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-in slide-in-from-top duration-300
                    ${toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.message}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="card p-8 max-w-md w-full mx-4 space-y-5 border-red-500/20 bg-[#0f0f17]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/10">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Reject Authorization</h3>
                                <p className="text-xs text-white/40">{rejectModal.patientName}</p>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">
                                Reason for Rejection (Optional)
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                rows={3}
                                className="form-input bg-white/[0.02] border-white/10 text-white rounded-xl w-full resize-none"
                                placeholder="E.g., Invalid referral document..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 text-xs font-black uppercase hover:text-white hover:border-white/20 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={!!processingId}
                                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all"
                            >
                                {processingId ? 'Processing...' : 'Reject & Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        Authorization Queue
                        <span className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full uppercase tracking-widest font-black border border-purple-500/20">
                            REFERRALS
                        </span>
                    </h1>
                    <p className="text-sm text-white/40 font-medium mt-1">
                        Review and approve referral patients before they proceed to the Cashier
                    </p>
                </div>
                <button
                    onClick={fetchPending}
                    className="p-2.5 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"
                    title="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 border-white/5">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-2xl font-black text-white">{visits.length}</p>
                </div>
                <div className="card p-4 border-white/5">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Longest Wait</p>
                    <p className={`text-2xl font-black ${visits.length > 0 ? getWaitColor(visits[0]?.createdAt) : 'text-white'}`}>
                        {visits.length > 0 ? formatTime(visits[0]?.createdAt) : '—'}
                    </p>
                </div>
                <div className="card p-4 border-white/5">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Flow</p>
                    <p className="text-xs font-black text-white/60 flex items-center gap-1">
                        Records <ChevronRight className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400">Auth</span>
                        <ChevronRight className="w-3 h-3 text-purple-400" />
                        Cashier
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, NRC, or Man Number..."
                    className="form-input w-full pl-11 bg-white/[0.02] border-white/10 text-white rounded-xl py-3"
                />
            </div>

            {/* Queue List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : visits.length === 0 ? (
                <div className="card p-16 border-white/5 text-center space-y-3">
                    <ShieldCheck className="w-12 h-12 text-emerald-400/30 mx-auto" />
                    <p className="text-white/50 font-black uppercase tracking-wider text-sm">No Pending Authorizations</p>
                    <p className="text-white/20 text-xs">All referral patients have been processed.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visits.map((visit, idx) => {
                        const p = visit.patient;
                        const fullName = p ? `${p.firstName} ${p.lastName}` : 'Unknown';
                        const isProcessing = processingId === visit.id;

                        return (
                            <div
                                key={visit.id}
                                className="card p-5 border-white/5 hover:border-purple-500/20 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Queue number */}
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-black text-purple-400">#{idx + 1}</span>
                                    </div>

                                    {/* Patient info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-black text-white">{fullName}</span>
                                            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-black uppercase border border-purple-500/20">
                                                Referral
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                                            {p?.nrc && (
                                                <span className="text-[10px] text-white/30 font-medium">
                                                    NRC: <span className="text-white/60">{p.nrc}</span>
                                                </span>
                                            )}
                                            {p?.manNumber && (
                                                <span className="text-[10px] text-white/30 font-medium flex items-center gap-1">
                                                    <Hash className="w-2.5 h-2.5" />
                                                    Man No: <span className="text-white/60">{p.manNumber}</span>
                                                </span>
                                            )}
                                            {p?.patientNumber && (
                                                <span className="text-[10px] text-white/30 font-medium">
                                                    ID: <span className="text-white/60">{p.patientNumber}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Wait time */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Clock className={`w-3.5 h-3.5 ${getWaitColor(visit.createdAt)}`} />
                                        <span className={`text-xs font-black ${getWaitColor(visit.createdAt)}`}>
                                            {formatTime(visit.createdAt)}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            id={`reject-btn-${visit.id}`}
                                            onClick={() => setRejectModal({ visitId: visit.id, patientName: fullName })}
                                            disabled={isProcessing}
                                            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                                        >
                                            <XCircle className="w-3.5 h-3.5 inline mr-1" />
                                            Reject
                                        </button>
                                        <button
                                            id={`approve-btn-${visit.id}`}
                                            onClick={() => handleApprove(visit.id, fullName)}
                                            disabled={isProcessing}
                                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                                        >
                                            {isProcessing ? (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Processing
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Approve → Cashier
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AuthorizationDashboard;
