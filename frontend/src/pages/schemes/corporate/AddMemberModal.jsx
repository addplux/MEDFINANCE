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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-8 flex items-center justify-between border-b border-slate-50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80">Membership Control</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Enroll <span className="text-slate-400 font-light">Member</span></h2>
                        <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Target: {schemeName}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Search Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Search Patient Repository</label>
                            {searching && <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />}
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                                placeholder="Search by Name, NRC or Patient ID..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-blue-400 transition-all"
                            />
                        </div>

                        {/* Results Dropdown */}
                        {results.length > 0 && !selected && (
                            <div className="border border-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-50">
                                {results.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => { setSelected(p); setPolicyNumber(p.patientNumber || ''); setQuery(`${p.firstName} ${p.lastName}`); }}
                                        className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{p.firstName} {p.lastName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.patientNumber} · {p.nrc || 'No NRC'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selected && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{selected.firstName} {selected.lastName}</p>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Selected for Enrollment</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelected(null); setQuery(''); }} className="p-2 text-emerald-400 hover:text-emerald-700 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Data Fields */}
                    {selected && (
                        <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Membership Number</label>
                                <input 
                                    type="text"
                                    value={policyNumber}
                                    onChange={e => setPolicyNumber(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-400 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assignment Rank</label>
                                <select 
                                    value={memberRank}
                                    onChange={e => setMemberRank(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-400 transition-all uppercase"
                                >
                                    <option value="principal">Principal</option>
                                    <option value="spouse">Spouse</option>
                                    <option value="child">Child</option>
                                    <option value="dependent">Dependent</option>
                                </select>
                            </div>
                            <div className="col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operational Credit Limit</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">ZR</span>
                                    <input 
                                        type="number"
                                        value={creditLimit}
                                        onChange={e => setCreditLimit(e.target.value)}
                                        placeholder="Default Limit Applied"
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-blue-400 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-8 border-t border-slate-50 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Abort</button>
                    <button 
                        onClick={handleEnroll}
                        disabled={!selected || saving}
                        className="h-14 px-8 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 disabled:opacity-40 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10"
                    >
                        {saving ? 'Synchronizing...' : <><UserPlus className="w-5 h-5" /> Finalize Enrollment</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
