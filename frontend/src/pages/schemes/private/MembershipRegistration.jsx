import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, receivablesAPI } from '../../../services/apiService';
import {
    Users, Plus, Search, Battery, RefreshCw, Eye, Edit,
    PlusCircle, X, CheckCircle, AlertCircle, CreditCard, Calendar, Upload
} from 'lucide-react';

const MEMBER_RANKS = ['principal', 'spouse', 'child', 'dependant', 'other'];

const emptyForm = {
    // Patient details
    firstName: '', lastName: '', dateOfBirth: '', gender: '',
    phone: '', email: '', nrc: '', address: '',
    // Membership details
    schemeId: '', policyNumber: '', memberRank: 'principal',
    balance: '', memberSuffix: '',
    memberStatus: 'active',
    // Fixed
    paymentMethod: 'private_prepaid',
    patientType: 'opd',
    costCategory: 'standard',
};

const MembershipRegistration = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadSchemeId, setUploadSchemeId] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [topupAmount, setTopupAmount] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        loadSchemes();
    }, []);

    useEffect(() => {
        loadMembers();
    }, [searchTerm, selectedScheme]);

    const loadSchemes = async () => {
        try {
            const res = await receivablesAPI.schemes.getAll({ status: 'active' });
            setSchemes(res.data?.data || res.data || []);
        } catch {
            setSchemes([]);
        }
    };

    const loadMembers = async () => {
        try {
            setLoading(true);
            const params = { paymentMethod: 'private_prepaid', search: searchTerm || undefined, limit: 50 };
            if (selectedScheme) params.schemeId = selectedScheme;
            const res = await patientAPI.getAll(params);
            setMembers(res.data?.data || []);
        } catch {
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Auto-set policyNumber prefix from scheme if blank
        if (name === 'schemeId' && !form.policyNumber) {
            const s = schemes.find(sc => String(sc.id) === value);
            if (s) setForm(prev => ({ ...prev, schemeId: value, policyNumber: s.schemeCode + '-' }));
            return;
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.gender) {
            showAlert('error', 'First name, last name, date of birth, and gender are required.');
            return;
        }
        if (!form.balance || isNaN(Number(form.balance))) {
            showAlert('error', 'Please enter a valid initial balance amount.');
            return;
        }
        try {
            setSaving(true);
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
            // Also store the initial payment as prepaidCredit so the balance updater knows total credits
            fd.set('prepaidCredit', form.balance);
            await patientAPI.create(fd);
            showAlert('success', 'Member registered successfully!');
            setShowModal(false);
            setForm(emptyForm);
            loadMembers();
        } catch (err) {
            showAlert('error', err?.response?.data?.error || 'Failed to register member.');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadLedger = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            showAlert('error', 'Please select an Excel or CSV file first.');
            return;
        }

        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('file', uploadFile);
            if (uploadSchemeId) {
                fd.append('schemeId', uploadSchemeId);
            }

            const res = await patientAPI.uploadPrepaidLedger(fd);
            showAlert('success', res.data.message || 'Ledger uploaded successfully!');
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadSchemeId('');
            loadMembers();
        } catch (err) {
            showAlert('error', err?.response?.data?.error || 'Failed to upload ledger.');
        } finally {
            setSaving(false);
        }
    };

    const handleTopup = async (e) => {
        e.preventDefault();
        if (!topupAmount || isNaN(Number(topupAmount)) || Number(topupAmount) <= 0) {
            showAlert('error', 'Enter a valid top-up amount.');
            return;
        }
        try {
            setSaving(true);
            // Use the dedicated topup endpoint which increments prepaidCredit and recalculates balance
            await patientAPI.topup(selectedMember.id, Number(topupAmount));
            showAlert('success', `Balance topped up by ZK ${Number(topupAmount).toLocaleString()} successfully!`);
            setShowTopupModal(false);
            setTopupAmount('');
            loadMembers();
        } catch (err) {
            showAlert('error', err?.response?.data?.error || 'Failed to top up balance.');
        } finally {
            setSaving(false);
        }
    };

    const openTopup = (member) => {
        setSelectedMember(member);
        setTopupAmount('');
        setShowTopupModal(true);
    };

    const balanceColor = (bal) => {
        const n = Number(bal);
        if (n <= 0) return 'text-red-500';
        if (n < 500) return 'text-yellow-500';
        return 'text-green-500';
    };

    const balanceBg = (bal) => {
        const n = Number(bal);
        if (n <= 0) return 'bg-red-50 border-red-200';
        if (n < 500) return 'bg-yellow-50 border-yellow-200';
        return 'bg-green-50 border-green-200';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Alert */}
            {alert && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {alert.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span>{alert.message}</span>
                    <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-white">Membership Registration</h1>
                    <p className="text-white/50 mt-1 text-sm">Register and manage Private Prepaid Scheme members</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowUploadModal(true)} className="btn btn-secondary bg-white/10 hover:bg-white/20 border-white/10 text-white">
                        <Upload className="w-4 h-4" /> Upload Ledger
                    </button>
                    <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="btn btn-primary">
                        <Plus className="w-4 h-4" /> Register Member
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{members.length}</div>
                        <div className="text-xs text-white/50">Total Members</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Battery className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">
                            ZK {members.reduce((s, m) => s + Number(m.balance || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-white/50">Total Balance</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">
                            {members.filter(m => Number(m.balance || 0) <= 0).length}
                        </div>
                        <div className="text-xs text-white/50">Zero/Negative Balance</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-48">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search member…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="form-input pl-8 py-1.5 text-sm w-full"
                    />
                </div>
                <select
                    value={selectedScheme}
                    onChange={e => setSelectedScheme(e.target.value)}
                    className="form-select py-1.5 text-sm min-w-48"
                >
                    <option value="">All Prepaid Schemes</option>
                    {schemes.map(s => <option key={s.id} value={s.id}>{s.schemeName}</option>)}
                </select>
                <button onClick={loadMembers} className="btn btn-secondary p-2" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Members Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs font-bold text-white/40 uppercase bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">Member</th>
                                <th className="px-4 py-3">Policy #</th>
                                <th className="px-4 py-3">Rank</th>
                                <th className="px-4 py-3">Scheme Type</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Balance</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-16 text-center">
                                        <div className="flex flex-col items-center text-gray-400 gap-2">
                                            <Users className="w-10 h-10" />
                                            <p className="text-sm">No members registered yet.</p>
                                            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-2">
                                                <Plus className="w-4 h-4" /> Register First Member
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : members.map(m => (
                                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                                                {m.firstName?.[0]}{m.lastName?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">{m.firstName} {m.lastName}</div>
                                                <div className="text-xs text-white/40">{m.patientNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono text-white/60">{m.policyNumber || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">{m.memberRank || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${m.costCategory === 'high_cost' ? 'bg-purple-100 text-purple-700' :
                                            m.costCategory === 'low_cost' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {m.costCategory ? m.costCategory.replace('_', ' ') : 'Standard'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-white/60">{m.phone || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.memberStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {m.memberStatus || 'active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${balanceBg(m.balance)}`}>
                                            <Battery className={`w-3.5 h-3.5 ${balanceColor(m.balance)}`} />
                                            <span className={balanceColor(m.balance)}>ZK {Number(m.balance || 0).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openTopup(m)} className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded transition-colors" title="Top Up Balance">
                                                <PlusCircle className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => navigate(`/app/patients/${m.id}`)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors" title="View Profile">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => navigate(`/app/patients/${m.id}/edit`)} className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded transition-colors" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Register Member Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Register New Member</h2>
                                <p className="text-xs text-gray-500">Enrol a patient into a Private Prepaid Scheme</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleRegister} className="p-6 space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" /> Personal Information
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="form-label">First Name *</label>
                                        <input name="firstName" value={form.firstName} onChange={handleFormChange} className="form-input" required />
                                    </div>
                                    <div>
                                        <label className="form-label">Last Name *</label>
                                        <input name="lastName" value={form.lastName} onChange={handleFormChange} className="form-input" required />
                                    </div>
                                    <div>
                                        <label className="form-label">Date of Birth *</label>
                                        <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleFormChange} className="form-input" required />
                                    </div>
                                    <div>
                                        <label className="form-label">Gender *</label>
                                        <select name="gender" value={form.gender} onChange={handleFormChange} className="form-select" required>
                                            <option value="">Select…</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Phone</label>
                                        <input name="phone" value={form.phone} onChange={handleFormChange} className="form-input" />
                                    </div>
                                    <div>
                                        <label className="form-label">NRC</label>
                                        <input name="nrc" value={form.nrc} onChange={handleFormChange} className="form-input" placeholder="012345/67/1" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="form-label">Email</label>
                                        <input type="email" name="email" value={form.email} onChange={handleFormChange} className="form-input" />
                                    </div>
                                </div>
                            </div>

                            {/* Membership Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-indigo-500" /> Membership Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="form-label">Prepaid Scheme</label>
                                        <select name="schemeId" value={form.schemeId} onChange={handleFormChange} className="form-select">
                                            <option value="">Select Scheme (Optional)</option>
                                            {schemes.map(s => <option key={s.id} value={s.id}>{s.schemeName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Policy Number</label>
                                        <input name="policyNumber" value={form.policyNumber} onChange={handleFormChange} className="form-input" placeholder="e.g. PPP-001" />
                                    </div>
                                    <div>
                                        <label className="form-label">Member Suffix</label>
                                        <input type="number" min="1" name="memberSuffix" value={form.memberSuffix} onChange={handleFormChange} className="form-input" placeholder="1=Principal, 2=Spouse…" />
                                    </div>
                                    <div>
                                        <label className="form-label">Member Rank</label>
                                        <select name="memberRank" value={form.memberRank} onChange={handleFormChange} className="form-select">
                                            {MEMBER_RANKS.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Scheme Type</label>
                                        <select name="costCategory" value={form.costCategory} onChange={handleFormChange} className="form-select">
                                            <option value="standard">Standard</option>
                                            <option value="high_cost">High Cost</option>
                                            <option value="low_cost">Low Cost</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Member Status</label>
                                        <select name="memberStatus" value={form.memberStatus} onChange={handleFormChange} className="form-select">
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Initial Balance */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Battery className="w-4 h-4 text-green-500" /> Initial Prepaid Balance
                                </h3>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">ZK</span>
                                    <input
                                        type="number" min="0" step="0.01"
                                        name="balance" value={form.balance} onChange={handleFormChange}
                                        className="form-input pl-10"
                                        placeholder="5000.00"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Amount paid upfront by the patient for this prepaid scheme.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {saving ? 'Registering…' : 'Register Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Ledger Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Upload Prepaid Ledger</h2>
                                <p className="text-xs text-gray-500">Bulk upload members and opening balances from Excel</p>
                            </div>
                            <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleUploadLedger} className="p-6 space-y-6">
                            <div>
                                <label className="form-label">Link to Scheme (Optional)</label>
                                <select value={uploadSchemeId} onChange={e => setUploadSchemeId(e.target.value)} className="form-select w-full">
                                    <option value="">Do not link to a specific scheme</option>
                                    {schemes.map(s => <option key={s.id} value={s.id}>{s.schemeName}</option>)}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">If selected, all uploaded members will belong to this scheme.</p>
                            </div>

                            <div>
                                <label className="form-label">Ledger File (Excel or CSV)</label>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border rounded-lg p-2"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-2">File must match the exported visual format containing "SCH.NO." and "BALANCE" rows.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {saving ? 'Uploading…' : 'Upload Ledger'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Top Up Modal */}
            {showTopupModal && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Top Up Balance</h2>
                                <p className="text-xs text-gray-500">Add credit for {selectedMember.firstName} {selectedMember.lastName}</p>
                            </div>
                            <button onClick={() => setShowTopupModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleTopup} className="p-6 space-y-4">
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${balanceBg(selectedMember.balance)}`}>
                                <Battery className={`w-6 h-6 ${balanceColor(selectedMember.balance)}`} />
                                <div>
                                    <div className="text-xs text-gray-500">Current Balance</div>
                                    <div className={`text-xl font-bold ${balanceColor(selectedMember.balance)}`}>
                                        ZK {Number(selectedMember.balance || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Top-Up Amount (ZK)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">ZK</span>
                                    <input
                                        type="number" min="1" step="0.01"
                                        value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                                        className="form-input pl-10"
                                        placeholder="1000.00"
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>
                            {topupAmount && !isNaN(Number(topupAmount)) && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                                    New balance will be: <strong>ZK {(Number(selectedMember.balance || 0) + Number(topupAmount)).toLocaleString()}</strong>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowTopupModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                                    {saving ? 'Processing…' : 'Add Credit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipRegistration;
