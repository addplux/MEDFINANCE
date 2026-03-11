import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { patientAPI, receivablesAPI } from '../../../services/apiService';
import { useToast } from '../../../context/ToastContext';

/**
 * AddMemberModal — search for an existing patient and enroll them in a corporate scheme.
 * Props:
 *   schemeId  — the corporate scheme to enroll into
 *   schemeName — display name
 *   onClose   — callback to close modal
 *   onSuccess — callback after successful enrollment
 */
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
            addToast('success', `${selected.firstName} ${selected.lastName} enrolled successfully.`);
            onSuccess?.();
            onClose();
        } catch (err) {
            addToast('error', err.response?.data?.error || 'Failed to enroll member.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <UserPlus className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Add Member Manually</h2>
                            <p className="text-xs text-white/40 mt-0.5">Enroll into: <span className="text-white/70">{schemeName}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Patient search */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Search Patient</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                                placeholder="Name, patient number or NRC..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        {searching && <p className="text-xs text-white/30 mt-2">Searching...</p>}
                        {results.length > 0 && !selected && (
                            <div className="mt-2 border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                {results.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelected(p); setPolicyNumber(p.patientNumber || ''); setQuery(`${p.firstName} ${p.lastName}`); setResults([]); }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-white">{p.firstName} {p.lastName}</div>
                                            <div className="text-xs text-white/40 font-mono">{p.patientNumber} · {p.nrc || 'No NRC'}</div>
                                        </div>
                                        <span className="text-xs text-blue-400">Select</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selected && (
                            <div className="mt-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-white">{selected.firstName} {selected.lastName}</div>
                                    <div className="text-xs text-blue-400 font-mono">{selected.patientNumber}</div>
                                </div>
                                <button onClick={() => { setSelected(null); setQuery(''); }} className="text-white/30 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Enrollment fields */}
                    {selected && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Policy / Emp Number</label>
                                <input
                                    type="text"
                                    value={policyNumber}
                                    onChange={e => setPolicyNumber(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Member Rank</label>
                                <select
                                    value={memberRank}
                                    onChange={e => setMemberRank(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="principal">Principal</option>
                                    <option value="spouse">Spouse</option>
                                    <option value="child">Child</option>
                                    <option value="dependent">Dependent</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Credit Limit (Optional)</label>
                                <input
                                    type="number"
                                    value={creditLimit}
                                    onChange={e => setCreditLimit(e.target.value)}
                                    placeholder="Leave blank to use scheme default"
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleEnroll}
                        disabled={!selected || saving}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                    >
                        {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enrolling...</> : <><UserPlus className="w-4 h-4" /> Enroll Member</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
