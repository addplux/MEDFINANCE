import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ledgerAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft, Save, Plus, Trash2, AlertCircle,
    BookOpen, Hash, Calculator, CheckCircle,
    Calendar, FileText, Info, Smartphone
} from 'lucide-react';

const JournalEntryForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { addToast } = useToast();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
    const [accounts, setAccounts] = useState([]);

    const [formData, setFormData] = useState({
        entryDate: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
            { id: Date.now(), accountId: '', debit: '', credit: '', description: '' },
            { id: Date.now() + 1, accountId: '', debit: '', credit: '', description: '' }
        ]
    });

    useEffect(() => {
        fetchAccounts();
        if (isEditing) fetchEntry();
    }, [id]);

    const fetchAccounts = async () => {
        try {
            const response = await ledgerAPI.accounts.getAll();
            setAccounts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            addToast('error', 'Failed to load chart of accounts.');
        }
    };

    const fetchEntry = async () => {
        try {
            const response = await ledgerAPI.journals.getById(id);
            const d = response.data;
            setFormData({
                entryDate: d.entryDate ? d.entryDate.split('T')[0] : new Date().toISOString().split('T')[0],
                description: d.description || '',
                reference: d.reference || '',
                lines: d.lines.map(l => ({
                    id: l.id,
                    accountId: l.accountId,
                    debit: l.debit || '',
                    credit: l.credit || '',
                    description: l.description || ''
                }))
            });
        } catch (error) {
            console.error('Failed to fetch entry:', error);
            addToast('error', 'Failed to load journal entry details.');
            navigate('/app/ledger/journal-entries');
        } finally {
            setFetching(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLineChange = (lineId, field, value) => {
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.map(line =>
                line.id === lineId ? { ...line, [field]: value } : line
            )
        }));
    };

    const addLine = () => {
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { id: Date.now(), accountId: '', debit: '', credit: '', description: '' }]
        }));
    };

    const removeLine = (lineId) => {
        if (formData.lines.length <= 2) {
            addToast('error', 'Journal entries must have at least 2 lines.');
            return;
        }
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.id !== lineId)
        }));
    };

    const totals = useMemo(() => {
        const debit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
        const credit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
        const diff = Math.abs(debit - credit);
        return { debit, credit, diff, isBalanced: diff < 0.01 };
    }, [formData.lines]);

    const handleAddBalancingLine = () => {
        const diff = totals.debit - totals.credit;
        if (Math.abs(diff) < 0.01) return;

        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, {
                id: Date.now(),
                accountId: '',
                debit: diff < 0 ? Math.abs(diff).toFixed(2) : '',
                credit: diff > 0 ? Math.abs(diff).toFixed(2) : '',
                description: 'Balancing Line'
            }]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!totals.isBalanced) {
            addToast('error', 'Total debits must equal total credits.');
            return;
        }

        const validLines = formData.lines.every(line =>
            line.accountId && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0)
        );

        if (!validLines) {
            addToast('error', 'Each line must have an account and a debit or credit amount.');
            return;
        }

        const payload = {
            entryDate: formData.entryDate,
            description: formData.description,
            reference: formData.reference,
            lines: formData.lines.map(l => ({
                accountId: parseInt(l.accountId),
                debit: parseFloat(l.debit) || 0,
                credit: parseFloat(l.credit) || 0,
                description: l.description
            }))
        };

        setLoading(true);
        try {
            if (isEditing) {
                await ledgerAPI.journals.update(id, payload);
                addToast('success', 'Journal entry updated successfully.');
            } else {
                await ledgerAPI.journals.create(payload);
                addToast('success', 'Journal entry created successfully as Draft.');
            }
            navigate('/app/ledger/journal-entries');
        } catch (error) {
            console.error('Submission error:', error);
            addToast('error', error.response?.data?.error || 'Failed to save journal entry.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest text-text-secondary">Loading Ledger Data...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in text-text-primary">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/ledger/journal-entries')}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            {isEditing ? 'Modify Entry' : 'Manual Entry'}
                        </h1>
                        <p className="text-sm text-text-secondary mt-1">
                            {isEditing ? `Editing ${formData.reference || 'Journal Entry'}` : 'Recording a new double-entry transaction record'}
                        </p>
                    </div>
                </div>
                {!totals.isBalanced && (totals.debit > 0 || totals.credit > 0) && (
                    <div className="hidden md:flex items-center gap-2 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20 animate-pulse">
                        <AlertCircle size={14} className="text-rose-400" />
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Out of Balance: K {totals.diff.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass-card p-8 border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText size={64} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="form-group space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                    <Calendar size={12} className="text-accent" /> Posting Date
                                </label>
                                <input
                                    type="date"
                                    name="entryDate"
                                    value={formData.entryDate}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
                                />
                            </div>
                            <div className="form-group space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                    <Hash size={12} className="text-accent" /> Reference / Invoice
                                </label>
                                <input
                                    type="text"
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleFormChange}
                                    placeholder="e.g. PETTY-001"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-white/20"
                                />
                            </div>
                            <div className="md:col-span-2 form-group space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                    <Info size={12} className="text-accent" /> Transaction Summary
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    required
                                    rows="1"
                                    placeholder="Main description for this ledger entry..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-white/20 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 border-white/10 bg-accent/5 flex flex-col justify-center items-center text-center space-y-4">
                        <div className={`p-4 rounded-3xl transition-all duration-500 ${totals.isBalanced ? 'bg-emerald-500/20 text-emerald-400 rotate-12 scale-110' : 'bg-rose-500/20 text-rose-400'}`}>
                            {totals.isBalanced ? <CheckCircle size={40} /> : <Calculator size={40} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Balance Status</p>
                            <h3 className={`text-2xl font-black ${totals.isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {totals.isBalanced ? 'Balanced' : 'Unbalanced'}
                            </h3>
                            {totals.diff > 0 && (
                                <p className="text-[10px] font-bold text-rose-400/80 mt-1">Variance: K {totals.diff.toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Entry Lines */}
                <div className="glass-card border-white/10 overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen size={18} className="text-accent" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">Entry Line Items</h2>
                        </div>
                        <button
                            type="button"
                            onClick={addLine}
                            className="px-4 py-2 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> Add Line
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] text-[9px] font-black uppercase tracking-widest text-text-secondary border-b border-white/5">
                                    <th className="py-3 px-6 w-[35%]">Account Segment</th>
                                    <th className="py-3 px-3 w-[25%]">Line memo</th>
                                    <th className="py-3 px-3 text-right w-[15%]">Debit (K)</th>
                                    <th className="py-3 px-3 text-right w-[15%]">Credit (K)</th>
                                    <th className="py-3 px-6 w-[10%] text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {formData.lines.map((line) => (
                                    <tr key={line.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="py-4 px-6">
                                            <select
                                                value={line.accountId}
                                                onChange={(e) => handleLineChange(line.id, 'accountId', e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-white"
                                            >
                                                <option value="" className="bg-slate-900">Select Account...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id} className="bg-slate-900">
                                                        {acc.accountCode} — {acc.accountName}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-4 px-3">
                                            <input
                                                type="text"
                                                value={line.description}
                                                onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                                                placeholder="Secondary memo..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-white placeholder:text-white/10"
                                            />
                                        </td>
                                        <td className="py-4 px-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.debit}
                                                onChange={(e) => {
                                                    handleLineChange(line.id, 'debit', e.target.value);
                                                    if (e.target.value) handleLineChange(line.id, 'credit', '');
                                                }}
                                                placeholder="0.00"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-right font-mono focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all text-emerald-400 placeholder:text-emerald-400/10"
                                            />
                                        </td>
                                        <td className="py-4 px-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.credit}
                                                onChange={(e) => {
                                                    handleLineChange(line.id, 'credit', e.target.value);
                                                    if (e.target.value) handleLineChange(line.id, 'debit', '');
                                                }}
                                                placeholder="0.00"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-right font-mono focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all text-rose-400 placeholder:text-rose-400/10"
                                            />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(line.id)}
                                                className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-white/5 font-black border-t border-white/10">
                                <tr className="text-xs">
                                    <td colSpan="2" className="py-6 px-6 text-right text-text-secondary uppercase tracking-widest text-[9px]">Calculated Totals:</td>
                                    <td className="py-6 px-3 text-right text-emerald-400 font-mono">
                                        K {totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-6 px-3 text-right text-rose-400 font-mono">
                                        K {totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-6 px-6"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {!totals.isBalanced && (
                            <button
                                type="button"
                                onClick={handleAddBalancingLine}
                                className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent transition-all"
                            >
                                <Plus size={14} /> Add Balancing Line
                            </button>
                        )}
                        <div className="hidden md:flex items-center gap-2 text-[10px] text-text-secondary uppercase tracking-widest font-black">
                            <CheckCircle size={14} className="text-accent" /> Draft auto-save active
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate('/app/ledger/journal-entries')}
                            className="flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all text-text-secondary hover:text-white"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !totals.isBalanced}
                            className="flex-1 md:flex-none px-10 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                            {isEditing ? 'Commit Update' : 'Initialize Entry'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default JournalEntryForm;
