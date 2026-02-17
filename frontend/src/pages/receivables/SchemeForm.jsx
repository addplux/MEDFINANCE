import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import api from '../../services/apiClient';

const SchemeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        schemeCode: '',
        schemeName: '',
        schemeType: 'insurance',
        discountRate: '',
        contactPerson: '',
        phone: '',
        email: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        if (isEdit) {
            fetchScheme();
        }
    }, [id]);

    const fetchScheme = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/receivables/schemes/${id}`);
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching scheme:', error);
            alert('Failed to load scheme details');
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

        if (!formData.schemeCode.trim() || !formData.schemeName.trim()) {
            alert('Scheme code and name are required');
            return;
        }

        try {
            setLoading(true);
            if (isEdit) {
                await api.put(`/receivables/schemes/${id}`, formData);
                alert('Scheme updated successfully');
            } else {
                await api.post('/receivables/schemes', formData);
                alert('Scheme created successfully');
            }
            navigate('/app/receivables/schemes');
        } catch (error) {
            console.error('Error saving scheme:', error);
            alert('Failed to save scheme');
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
                        onClick={() => navigate('/app/receivables/schemes')}
                        className="btn btn-secondary"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="page-title">
                            {isEdit ? 'Edit Scheme' : 'New Scheme'}
                        </h1>
                        <p className="page-subtitle">
                            {isEdit ? 'Update scheme information' : 'Create a new insurance or discount scheme'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6">
                <div className="space-y-6">
                    {/* Scheme Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Shield size={20} />
                            Scheme Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">
                                    Scheme Code <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="schemeCode"
                                    value={formData.schemeCode}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g., INS001"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Scheme Name <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="schemeName"
                                    value={formData.schemeName}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g., NHIMA Standard"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Scheme Type <span className="text-error">*</span>
                                </label>
                                <select
                                    name="schemeType"
                                    value={formData.schemeType}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="insurance">Insurance</option>
                                    <option value="corporate">Corporate</option>
                                    <option value="government">Government</option>
                                    <option value="ngo">NGO</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Discount Rate (%)</label>
                                <input
                                    type="number"
                                    name="discountRate"
                                    value={formData.discountRate}
                                    onChange={handleChange}
                                    className="form-input"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="border-t border-border-color pt-6">
                        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Contact Person</label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Full name"
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
                                    placeholder="contact@example.com"
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
                                placeholder="Additional notes or terms and conditions..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
                        <button
                            type="button"
                            onClick={() => navigate('/app/receivables/schemes')}
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
                            {loading ? 'Saving...' : isEdit ? 'Update Scheme' : 'Create Scheme'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SchemeForm;
