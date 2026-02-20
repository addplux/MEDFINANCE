import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ledgerAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react';

const JournalEntryForm = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(false);
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
    }, []);

    const fetchAccounts = async () => {
        try {
            // Fetch all active accounts
            const response = await ledgerAPI.accounts.getAll();
            setAccounts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            addToast('error', 'Failed to load chart of accounts.');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLineChange = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.map(line =>
                line.id === id ? { ...line, [field]: value } : line
            )
        }));
    };

    const addLine = () => {
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { id: Date.now(), accountId: '', debit: '', credit: '', description: '' }]
        }));
    };

    const removeLine = (id) => {
        if (formData.lines.length <= 2) {
            addToast('error', 'Journal entries must have at least 2 lines.');
            return;
        }
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.id !== id)
        }));
    };

    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!isBalanced) {
            addToast('error', 'Total debits must equal total credits.');
            return;
        }

        const validLines = formData.lines.every(line => line.accountId && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0));
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
            await ledgerAPI.journals.create(payload);
            addToast('success', 'Journal entry created successfully as Draft.');
            navigate('/app/ledger/journal-entries');
        } catch (error) {
            console.error('Failed to create journal entry:', error);
            addToast('error', error.response?.data?.error || 'Failed to create journal entry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/ledger/journal-entries')}
                    className="p-2 hover:bg-surface border border-border rounded-lg text-text-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">New Journal Entry</h1>
                    <p className="text-sm text-text-secondary mt-1">Record a manual double-entry transaction</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Header Information */}
                <div className="card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="form-label">Entry Date <span className="text-danger-500">*</span></label>
                        <input
                            type="date"
                            name="entryDate"
                            value={formData.entryDate}
                            onChange={handleFormChange}
                            required
                            className="form-input w-full"
                        />
                    </div>
                    <div>
                        <label className="form-label">Reference (Optional)</label>
                        <input
                            type="text"
                            name="reference"
                            value={formData.reference}
                            onChange={handleFormChange}
                            placeholder="e.g. INV-2023-001"
                            className="form-input w-full"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="form-label">Description / Memo <span className="text-danger-500">*</span></label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleFormChange}
                            required
                            rows="2"
                            placeholder="Explanation of the entry..."
                            className="form-textarea w-full"
                        ></textarea>
                    </div>
                </div>

                {/* Journal Lines */}
                <div className="card overflow-hidden">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-surface/50">
                        <h2 className="text-lg font-semibold text-text-primary">Journal Lines</h2>
                        <button
                            type="button"
                            onClick={addLine}
                            className="btn btn-sm btn-secondary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Line
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table min-w-[800px]">
                            <thead className="bg-surface/50 text-text-secondary text-sm">
                                <tr>
                                    <th className="w-[30%]">Account</th>
                                    <th className="w-[30%]">Line Description</th>
                                    <th className="w-[15%] text-right">Debit (K)</th>
                                    <th className="w-[15%] text-right">Credit (K)</th>
                                    <th className="w-[10%] text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.lines.map((line) => (
                                    <tr key={line.id} className="group">
                                        <td className="align-top">
                                            <select
                                                value={line.accountId}
                                                onChange={(e) => handleLineChange(line.id, 'accountId', e.target.value)}
                                                className="form-select w-full"
                                                required
                                            >
                                                <option value="">Select Account</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.accountCode} - {acc.accountName}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="align-top">
                                            <input
                                                type="text"
                                                value={line.description}
                                                onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                                                className="form-input w-full"
                                                placeholder="Optional line memo"
                                            />
                                        </td>
                                        <td className="align-top">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.debit}
                                                onChange={(e) => {
                                                    handleLineChange(line.id, 'debit', e.target.value);
                                                    if (e.target.value) handleLineChange(line.id, 'credit', ''); // Auto clear credit
                                                }}
                                                className="form-input w-full text-right font-mono"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="align-top">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.credit}
                                                onChange={(e) => {
                                                    handleLineChange(line.id, 'credit', e.target.value);
                                                    if (e.target.value) handleLineChange(line.id, 'debit', ''); // Auto clear debit
                                                }}
                                                className="form-input w-full text-right font-mono"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="align-middle text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(line.id)}
                                                className="p-2 text-text-disabled hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove Line"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-surface/50 font-semibold border-t border-border">
                                <tr>
                                    <td colSpan="2" className="text-right text-text-secondary py-4 pr-6">Total:</td>
                                    <td className="text-right py-4 font-mono w-[15%] pr-4 text-text-primary">
                                        {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="text-right py-4 font-mono w-[15%] pr-4 text-text-primary">
                                        {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Balance Warning */}
                {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                    <div className="bg-danger-50 p-4 rounded-xl flex items-start gap-3 border border-danger-200">
                        <AlertCircle className="w-5 h-5 text-danger-500 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold text-danger-800">Out of Balance</h4>
                            <p className="text-sm text-danger-600 mt-1">
                                Debits and Credits must equal each other. Difference: K {Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <button
                        type="button"
                        onClick={() => navigate('/app/ledger/journal-entries')}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !isBalanced || (totalDebit === 0 && totalCredit === 0)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Draft Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JournalEntryForm;
