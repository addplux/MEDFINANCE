import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ledgerAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft, Save, BookOpen, AlertCircle,
    Hash, Info, CheckCircle, Smartphone, Activity
} from 'lucide-react';

const AccountForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
    const [parentAccounts, setParentAccounts] = useState([]);

    const [formData, setFormData] = useState({
        accountCode: '',
        accountName: '',
        accountType: 'asset',
        parentId: '',
        description: '',
        isActive: true
    });

    useEffect(() => {
        const initData = async () => {
            try {
                const acctsResponse = await ledgerAPI.accounts.getAll();
                // Filter out self if editing to prevent circular hierarchy
                const accounts = (acctsResponse.data || [])
                    .filter(a => !isEditing || String(a.id) !== String(id));
                setParentAccounts(accounts);
            } catch (error) {
                console.error("Failed to load parent accounts:", error);
            }

            if (isEditing) {
                try {
                    const response = await ledgerAPI.accounts.getById(id);
                    const d = response.data;
                    setFormData({
                        accountCode: d.accountCode || '',
                        accountName: d.accountName || '',
                        accountType: d.accountType || 'asset',
                        parentId: d.parentId || '',
                        description: d.description || '',
                        isActive: d.isActive !== undefined ? d.isActive : true
                    });
                } catch (error) {
                    console.error("Failed to fetch account:", error);
                    addToast('error', 'Failed to load account details.');
                    navigate('/app/ledger/accounts');
                } finally {
                    setFetching(false);
                }
            }
        };
        initData();
    }, [id, isEditing, navigate, addToast]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            parentId: formData.parentId ? parseInt(formData.parentId) : null
        };

        try {
            if (isEditing) {
                await ledgerAPI.accounts.update(id, payload);
                addToast('success', 'Account updated successfully');
            } else {
                await ledgerAPI.accounts.create(payload);
                addToast('success', 'Account created successfully');
            }
            navigate('/app/ledger/accounts');
        } catch (error) {
            console.error('Save account error:', error);
            addToast('error', error.response?.data?.error || 'Failed to save account');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest text-text-secondary">Loading Account Data...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/ledger/accounts')}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            {isEditing ? 'Modify Account' : 'Initialize Account'}
                        </h1>
                        <p className="text-sm text-text-secondary mt-1">
                            {isEditing ? `Updating ${formData.accountName}` : 'Defining a new entry in the Hospital Chart of Accounts'}
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
                    <Smartphone size={14} className="text-accent" />
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">Real-time Sync</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-8 border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BookOpen size={64} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="form-group space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                    <Hash size={12} className="text-accent" /> Account Code
                                </label>
                                <input
                                    type="text"
                                    name="accountCode"
                                    value={formData.accountCode}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. 1001"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-white/20"
                                />
                                <p className="text-[9px] text-text-secondary italic">Unique numerical identifier within the COA.</p>
                            </div>

                            <div className="form-group space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                    <Activity size={12} className="text-accent" /> Account Name
                                </label>
                                <input
                                    type="text"
                                    name="accountName"
                                    value={formData.accountName}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Petty Cash"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-white/20"
                                />
                                <p className="text-[9px] text-text-secondary italic">Human-readable description for reports.</p>
                            </div>

                            <div className="md:col-span-2 form-group space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                    <Info size={12} className="text-accent" /> Description & Purpose
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="What will this account track? (e.g., Records all daily cash collections from OPD)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-white/20 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 glass-card border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-xl">
                                <AlertCircle className="text-amber-400" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Double-Check Accuracy</p>
                                <p className="text-[10px] text-text-secondary uppercase tracking-widest">Post-creation adjustments require journal corrections.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/app/ledger/accounts')}
                                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all text-text-secondary hover:text-white"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                {loading ? 'Saving...' : (isEditing ? 'Commit Changes' : 'Initialize Account')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Classification & Logistics */}
                <div className="space-y-6">
                    <div className="glass-card p-6 border-white/10 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Classification Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, accountType: type }))}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${formData.accountType === type ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5' : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/20'}`}
                                    >
                                        {type}
                                        {formData.accountType === type && <CheckCircle size={14} className="animate-in fade-in zoom-in duration-300" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Parent Structure</label>
                            <select
                                name="parentId"
                                value={formData.parentId}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-white appearance-none"
                            >
                                <option value="" className="bg-slate-900 border-none">Root (No Parent)</option>
                                {parentAccounts.map((acct) => (
                                    <option key={acct.id} value={acct.id} className="bg-slate-900 border-none">
                                        {acct.accountCode} — {acct.accountName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isEditing && (
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Operational Status</label>
                                <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer group hover:border-white/20 transition-all">
                                    <span className="text-xs font-bold text-text-secondary group-hover:text-white transition-colors">Mark as Active</span>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/20 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:after:bg-white"></div>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-6 border-white/10 bg-accent/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Hierarchy Logic</h4>
                        <p className="text-[10px] text-text-secondary leading-relaxed">
                            Assigning a parent account will nest this entry under that specific branch in the Chart of Accounts view. Children inherit the classification type of the parent if required by hospital policy.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AccountForm;
