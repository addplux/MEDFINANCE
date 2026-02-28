import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fundAPI, ledgerAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const FundForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        fundName: '',
        fundType: 'restricted',
        purpose: '',
        status: 'active',
        notes: ''
    });
    const [accounts, setAccounts] = useState([]);
    
    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const accRes = await ledgerAPI.accounts.getAll();
            const allAccs = accRes.data.data || accRes.data;
            // Funds are usually Liability or Equity
            setAccounts(allAccs.filter(a => ['liability', 'equity', 'asset'].includes(a.accountType)));
            
            if (isEditMode) {
                const fundRes = await fundAPI.getById(id);
                setFormData(fundRes.data);
            }
        } catch (err) {
            console.error('Failed to load form data:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            if (isEditMode) {
                await fundAPI.update(id, formData);
            } else {
                await fundAPI.create(formData);
            }
            navigate('/app/funds');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save fund';
            setError(errorMsg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <div className="p-6">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/funds')}
                    className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-text-primary">
                    {isEditMode ? 'Edit Fund' : 'New Fund Account'}
                </h1>
            </div>

            <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-error/10 text-error p-4 rounded-md border border-error/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label">Fund Name *</label>
                            <input
                                type="text"
                                name="fundName"
                                value={formData.fundName}
                                onChange={handleChange}
                                className="form-input"
                                required
                                placeholder="e.g. Research & Development Fund"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Fund Type *</label>
                                <select
                                    name="fundType"
                                    value={formData.fundType}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="general">General Fund</option>
                                    <option value="donor">Donor Fund</option>
                                    <option value="retention">Retention Fund</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="active">Active</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">GL Account (Ledger Link)</label>
                            <select
                                name="accountId"
                                value={formData.accountId || ''}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="">Draft / No Ledger Link</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.accountCode} - {acc.accountName} ({acc.accountType})
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-text-secondary mt-1">Required for automated financial reporting on donor/retention funds.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Purpose</label>
                            <input
                                type="text"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Brief description of usage..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="3"
                                placeholder="Additional details..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-color flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/funds')}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Fund'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FundForm;
