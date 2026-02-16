import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { payablesAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const SupplierForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        supplierName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: '',
        taxId: '',
        bankName: '',
        bankAccountNumber: '',
        status: 'active',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            fetchSupplier();
        }
    }, [id]);

    const fetchSupplier = async () => {
        try {
            setLoading(true);
            const response = await payablesAPI.suppliers.getById(id);
            setFormData(response.data);
        } catch (err) {
            setError('Failed to fetch supplier details');
            console.error(err);
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
        try {
            setLoading(true);
            setError(null);

            if (isEditMode) {
                await payablesAPI.suppliers.update(id, formData);
            } else {
                await payablesAPI.suppliers.create(formData);
            }
            navigate('/app/payables/suppliers');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save supplier';
            setError(errorMsg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <div className="p-6">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/payables/suppliers')}
                    className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-text-primary">
                    {isEditMode ? 'Edit Supplier' : 'New Supplier'}
                </h1>
            </div>

            <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-error/10 text-error p-4 rounded-md border border-error/20">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-text-primary border-b border-border-color pb-2">Basic Information</h3>

                            <div className="form-group">
                                <label className="form-label">Supplier Name *</label>
                                <input
                                    type="text"
                                    name="supplierName"
                                    value={formData.supplierName}
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="form-input"
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
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="form-textarea"
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>

                        {/* Financial Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-text-primary border-b border-border-color pb-2">Financial Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Tax ID (TPIN)</label>
                                    <input
                                        type="text"
                                        name="taxId"
                                        value={formData.taxId}
                                        onChange={handleChange}
                                        className="form-input"
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
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bank Name</label>
                                <input
                                    type="text"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bank Account Number</label>
                                <input
                                    type="text"
                                    name="bankAccountNumber"
                                    value={formData.bankAccountNumber}
                                    onChange={handleChange}
                                    className="form-input"
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
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="form-textarea"
                                    rows="2"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-color flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/payables/suppliers')}
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
                            {loading ? 'Saving...' : 'Save Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierForm;
