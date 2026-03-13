import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, User, CheckCircle } from 'lucide-react';
import { patientAPI, receivablesAPI } from '../../../services/apiService';
import { useToast } from '../../../context/ToastContext';

const AddMemberModal = ({ schemeId, schemeName, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [policyNumber, setPolicyNumber] = useState('');
    const [memberRank, setMemberRank] = useState('principal');
    const [creditLimit, setCreditLimit] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await patientAPI.getAll({ search: query, limit: 10 });
                setResults(res.data?.patients || res.data || []);
            } catch { setResults([]); }
            finally { setSearching(false); }
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    const handleEnroll = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await receivablesAPI.schemes.addMember(schemeId, {
                patientId: selected.id,
                schemeId,
                policyNumber: policyNumber || selected.patientNumber,
                memberRank,
                creditLimit: creditLimit ? Number(creditLimit) : undefined
            });
            addToast('success', `${selected.firstName} enrolled successfully.`);
            onSuccess?.();
            onClose();
        } catch (err) {
            addToast('error', err.response?.data?.error || 'Failed to enroll member.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-bg-secondary rounded-[2.5rem] shadow-2xl shadow-black/20 border border-border-color overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-8 flex items-center justify-between border-b border-border-color/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80">Membership Control</span>
                        </div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight uppercase">Enroll <span className="text-text-tertiary font-light">Member</span></h2>
                        <p className="text-xs font-bold text-text-tertiary mt-0.5 uppercase tracking-tighter">Target: {schemeName}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-bg-tertiary text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary/80 rounded-2xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Search Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Search Patient Repository</label>
                            {searching && <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />}
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <input 
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                                placeholder="Search by Name, NRC or Patient ID..."
                                className="w-full pl-12 pr-4 py-4 bg-bg-tertiary/50 border border-border-color rounded-2xl text-sm font-bold text-text-primary placeholder:text-text-tertiary/40 focus:outline-none focus:bg-bg-tertiary focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        {/* Results Dropdown */}
                        {results.length > 0 && !selected && (
                            <div className="border border-border-color rounded-3xl overflow-hidden divide-y divide-border-color/30">
                                {results.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => { setSelected(p); setPolicyNumber(p.patientNumber || ''); setQuery(`${p.firstName} ${p.lastName}`); }}
                                        className="w-full flex items-center justify-between p-4 hover:bg-blue-500/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-bg-tertiary rounded-xl flex items-center justify-center text-text-tertiary group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-text-primary text-sm uppercase tracking-tight">{p.firstName} {p.lastName}</p>
                                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-tighter">{p.patientNumber} · {p.nrc || 'No NRC'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selected && (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-text-primary text-sm uppercase tracking-tight">{selected.firstName} {selected.lastName}</p>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Selected for Enrollment</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelected(null); setQuery(''); }} className="p-2 text-text-tertiary hover:text-emerald-500 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Data Fields */}
                    {selected && (
                        <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Membership Number</label>
                                <input 
                                    type="text"
                                    value={policyNumber}
                                    onChange={e => setPolicyNumber(e.target.value)}
                                    className="w-full px-5 py-4 bg-bg-tertiary/50 border border-border-color rounded-2xl text-sm font-bold text-text-primary focus:outline-none focus:bg-bg-tertiary focus:border-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Assignment Rank</label>
                                <select 
                                    value={memberRank}
                                    onChange={e => setMemberRank(e.target.value)}
                                    className="w-full px-5 py-4 bg-bg-tertiary/50 border border-border-color rounded-2xl text-sm font-bold text-text-primary focus:outline-none focus:bg-bg-tertiary focus:border-blue-500/50 transition-all uppercase"
                                >
                                    <option value="principal" className="bg-bg-secondary">Principal</option>
                                    <option value="spouse" className="bg-bg-secondary">Spouse</option>
                                    <option value="child" className="bg-bg-secondary">Child</option>
                                    <option value="dependent" className="bg-bg-secondary">Dependent</option>
                                </select>
                            </div>
                            <div className="col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Operational Credit Limit</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-text-tertiary/30 text-sm">ZR</span>
                                    <input 
                                        type="number"
                                        value={creditLimit}
                                        onChange={e => setCreditLimit(e.target.value)}
                                        placeholder="Default Limit Applied"
                                        className="w-full pl-12 pr-5 py-4 bg-bg-tertiary/50 border border-border-color rounded-2xl text-sm font-bold text-text-primary placeholder:text-text-tertiary/40 focus:outline-none focus:bg-bg-tertiary focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-8 border-t border-border-color/50 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-4 text-xs font-black text-text-tertiary uppercase tracking-widest hover:text-text-primary transition-colors">Abort</button>
                    <button 
                        onClick={handleEnroll}
                        disabled={!selected || saving}
                        className="h-14 px-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-3 shadow-xl shadow-black/10"
                    >
                        {saving ? 'Synchronizing...' : <><UserPlus className="w-5 h-5" /> Finalize Enrollment</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
