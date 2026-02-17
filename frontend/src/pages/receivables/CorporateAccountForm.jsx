import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { receivablesAPI } from '../../services/apiService';

const CorporateAccountForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        creditLimit: '',
        paymentTerms: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        if (isEdit) {
            fetchAccount();
        }
    }, [id]);

    const fetchAccount = async () => {
        try {
            setLoading(true);
            const response = await receivablesAPI.corporate.getById(id);
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching account:', error);
            alert('Failed to load account details');
        } finally {
            setLoading(false);
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

        if (!formData.companyName.trim()) {
            alert('Company name is required');
            return;
        }

        try {
            setLoading(true);
            if (isEdit) {
                await receivablesAPI.corporate.update(id, formData);
                alert('Corporate account updated successfully');
            } else {
                await receivablesAPI.corporate.create(formData);
                alert('Corporate account created successfully');
            }
            navigate('/app/receivables/corporate');
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Failed to save corporate account');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/receivables/corporate')}
                        className="btn btn-secondary"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="page-title">
                            {isEdit ? 'Edit Corporate Account' : 'New Corporate Account'}
                        </h1>
                        <p className="page-subtitle">
                            {isEdit ? 'Update account information' : 'Create a new company billing account'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6">
                <div className="space-y-6">
                    {/* Company Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Building2 size={20} />
                            Company Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">
                                    Company Name <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Contact Person</label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="+260..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="company@example.com"
                                />
                            </div>

                            <div className="form-group md:col-span-2">
                                <label className="form-label">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="form-textarea"
                                    rows="2"
                                    placeholder="Company physical address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="border-t border-border-color pt-6">
                        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="form-label">Credit Limit (K)</label>
                                <input
                                    type="number"
                                    name="creditLimit"
                                    value={formData.creditLimit}
                                    onChange={handleChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Terms (Days)</label>
                                <input
                                    type="number"
                                    name="paymentTerms"
                                    value={formData.paymentTerms}
                                    onChange={handleChange}
                                    className="form-input"
                                    min="0"
                                    placeholder="30"
                                />
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
                                    <option value="suspended">Suspended</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="border-t border-border-color pt-6">
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="3"
                                placeholder="Additional notes or special instructions..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
                        <button
                            type="button"
                            onClick={() => navigate('/app/receivables/corporate')}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            <Save size={18} className="mr-2" />
                            {loading ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CorporateAccountForm;
