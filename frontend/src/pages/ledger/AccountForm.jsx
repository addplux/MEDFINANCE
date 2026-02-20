import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ledgerAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Save } from 'lucide-react';

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
            // Fetch all accounts so we can populate the Parent Account dropdown
            try {
                const acctsResponse = await ledgerAPI.accounts.getAll();
                setParentAccounts(acctsResponse.data || []);
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
        return <div className="p-8 text-center text-text-secondary">Loading account details...</div>;
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/ledger/accounts')}
                    className="p-2 hover:bg-surface border border-border rounded-lg text-text-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {isEditing ? 'Edit Account' : 'New Account'}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {isEditing ? 'Update ledger account settings' : 'Add a new chart of account entry'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Code */}
                    <div>
                        <label className="form-label">Account Code <span className="text-danger-500">*</span></label>
                        <input
                            type="text"
                            name="accountCode"
                            value={formData.accountCode}
                            onChange={handleChange}
                            required
                            placeholder="e.g. 1010"
                            className="form-input w-full"
                        />
                    </div>

                    {/* Account Name */}
                    <div>
                        <label className="form-label">Account Name <span className="text-danger-500">*</span></label>
                        <input
                            type="text"
                            name="accountName"
                            value={formData.accountName}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Cash in Bank"
                            className="form-input w-full"
                        />
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="form-label">Account Type <span className="text-danger-500">*</span></label>
                        <select
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleChange}
                            required
                            className="form-select w-full"
                        >
                            <option value="asset">Asset (Debit Balance)</option>
                            <option value="liability">Liability (Credit Balance)</option>
                            <option value="equity">Equity (Credit Balance)</option>
                            <option value="revenue">Revenue (Credit Balance)</option>
                            <option value="expense">Expense (Debit Balance)</option>
                        </select>
                    </div>

                    {/* Parent Account */}
                    <div>
                        <label className="form-label">Parent Account (Optional)</label>
                        <select
                            name="parentId"
                            value={formData.parentId}
                            onChange={handleChange}
                            className="form-select w-full"
                        >
                            <option value="">-- None (Top Level) --</option>
                            {parentAccounts.map((acct) => (
                                <option key={acct.id} value={acct.id}>
                                    {acct.accountCode} - {acct.accountName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Optional explanation of this account's purpose..."
                            className="form-textarea w-full"
                        ></textarea>
                    </div>

                    {/* Active Status */}
                    {isEditing && (
                        <div className="md:col-span-2 flex items-center gap-3 mt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-text-primary">
                                Account is Active
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <button
                        type="button"
                        onClick={() => navigate('/app/ledger/accounts')}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Account'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AccountForm;
