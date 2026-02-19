import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/apiService';
import {
    UserCheck, UserX, Clock, Mail, Building,
    Calendar, Shield, AlertCircle, CheckCircle,
    Search, RefreshCw
} from 'lucide-react';

const ROLE_OPTIONS = [
    { value: 'billing_staff', label: 'Billing Staff' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'viewer', label: 'Viewer (Read Only)' },
    { value: 'admin', label: 'Administrator' }
];

const PendingApprovals = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(null);
    // Per-card state for role selection and rejection reason
    const [roleMap, setRoleMap] = useState({});
    const [reasonMap, setReasonMap] = useState({});
    const [rejectOpenId, setRejectOpenId] = useState(null);
    const [actionResult, setActionResult] = useState(null);

    const fetchPending = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.getPendingUsers();
            setUsers(res.data);
        } catch {
            setError('Failed to load pending registrations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const setResult = (msg, type) => {
        setActionResult({ msg, type });
        setTimeout(() => setActionResult(null), 4000);
    };

    const handleApprove = async (userId) => {
        setProcessing(userId + '-approve');
        try {
            const role = roleMap[userId] || 'viewer';
            await authAPI.approveUser(userId, { role });
            setUsers(prev => prev.filter(u => u.id !== userId));
            setResult('Account approved successfully!', 'success');
        } catch {
            setResult('Failed to approve account', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (userId) => {
        setProcessing(userId + '-reject');
        try {
            const reason = reasonMap[userId] || 'Registration declined by administrator';
            await authAPI.rejectUser(userId, { reason });
            setUsers(prev => prev.filter(u => u.id !== userId));
            setRejectOpenId(null);
            setResult('Account rejected.', 'info');
        } catch {
            setResult('Failed to reject account', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const filtered = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.department || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary-400" />
                        Pending Approvals
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Review and approve staff registration requests</p>
                </div>
                <button onClick={fetchPending} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Toast */}
            {actionResult && (
                <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-3 text-sm border ${actionResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : actionResult.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                    {actionResult.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {actionResult.msg}
                </div>
            )}

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Pending', value: users.length, color: 'amber' },
                    { label: 'Reviewed Today', value: 0, color: 'emerald' },
                    { label: 'Total Requests', value: users.length, color: 'primary' }
                ].map(s => (
                    <div key={s.label} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold text-${s.color === 'primary' ? 'primary' : s.color}-400`}>{s.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, email or department..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 text-red-300 text-sm py-8 justify-center">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-white font-medium">
                        {users.length === 0 ? 'No pending registrations' : 'No results match your search'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        {users.length === 0 ? 'All registration requests have been reviewed.' : 'Try a different search term.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(u => (
                        <div key={u.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-white font-semibold">{u.firstName} {u.lastName}</h3>
                                        <span className="bg-amber-500/15 text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
                                            <Clock className="w-3 h-3" />
                                            Pending
                                        </span>
                                    </div>

                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{u.email}</span>
                                        {u.department && <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{u.department}</span>}
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(u.createdAt)}</span>
                                    </div>

                                    {/* Role selector + actions */}
                                    <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-500 whitespace-nowrap">Assign role:</label>
                                            <select
                                                value={roleMap[u.id] || 'viewer'}
                                                onChange={e => setRoleMap(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-primary-500 appearance-none pr-7 cursor-pointer"
                                            >
                                                {ROLE_OPTIONS.map(r => (
                                                    <option key={r.value} value={r.value} className="bg-gray-900">{r.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-2 ml-auto">
                                            <button
                                                onClick={() => setRejectOpenId(rejectOpenId === u.id ? null : u.id)}
                                                disabled={!!processing}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50"
                                            >
                                                <UserX className="w-3.5 h-3.5" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(u.id)}
                                                disabled={!!processing}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-50"
                                            >
                                                {processing === u.id + '-approve' ? (
                                                    <span className="flex items-center gap-1"><span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> Approving...</span>
                                                ) : (
                                                    <><UserCheck className="w-3.5 h-3.5" /> Approve</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reject reason input */}
                                    {rejectOpenId === u.id && (
                                        <div className="mt-3 flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={reasonMap[u.id] || ''}
                                                onChange={e => setReasonMap(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                placeholder="Reason for rejection (optional)"
                                                className="flex-1 bg-black/60 border border-red-500/20 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-red-500"
                                            />
                                            <button
                                                onClick={() => handleReject(u.id)}
                                                disabled={processing === u.id + '-reject'}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 whitespace-nowrap"
                                            >
                                                {processing === u.id + '-reject' ? 'Rejecting...' : 'Confirm Reject'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingApprovals;
