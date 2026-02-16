import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setupAPI } from '../../services/apiService';
// import { ArrowLeft, Save } from 'lucide-react'; // Removing lucide-react import to avoid errors if not installed/configured, using text buttons or standard icons if available. 
// Actually MainLayout uses lucide-react so it should be fine.
import { ArrowLeft, Save } from 'lucide-react';

const ServiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        serviceName: '',
        category: '',
        department: '',
        tariffType: 'Low Cost',
        price: '',
        cashPrice: '',
        nhimaPrice: '',
        corporatePrice: '',
        schemePrice: '',
        staffPrice: '',
        description: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const categories = [
        { value: 'opd', label: 'OPD / Consultation' },
        { value: 'ipd', label: 'IPD / Accommodation' },
        { value: 'pharmacy', label: 'Pharmacy' },
        { value: 'laboratory', label: 'Laboratory' },
        { value: 'radiology', label: 'Radiology' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        if (isEditMode) {
            fetchService();
        }
    }, [id]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const response = await setupAPI.services.getById(id);
            setFormData(response.data);
        } catch (err) {
            setError('Failed to fetch service details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            if (isEditMode) {
                await setupAPI.services.update(id, formData);
            } else {
                await setupAPI.services.create(formData);
            }
            navigate('/app/setup');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save service';
            const details = err.response?.data?.details ? ` - ${err.response.data.details}` : '';
            const validation = err.response?.data?.validation ? ` (${err.response.data.validation.join(', ')})` : '';
            setError(`${errorMsg}${details}${validation}`);
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
                    onClick={() => navigate('/app/setup')}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Service' : 'New Service'}
                </h1>
            </div>

            <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="label">Service Name</label>
                        <input
                            type="text"
                            name="serviceName"
                            value={formData.serviceName}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="label">Base Price (Global Fallback)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="form-input font-bold"
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Pricing Matrix */}
                    <div className="border border-border-color rounded-lg p-4 bg-bg-tertiary/50 space-y-4">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Pricing Matrix (Category Specific)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-secondary">Cash Price</label>
                                <input
                                    type="number"
                                    name="cashPrice"
                                    value={formData.cashPrice}
                                    onChange={handleChange}
                                    className="form-input form-input-sm"
                                    placeholder="Leave 0 for Base"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-secondary">NHIMA Price</label>
                                <input
                                    type="number"
                                    name="nhimaPrice"
                                    value={formData.nhimaPrice}
                                    onChange={handleChange}
                                    className="form-input form-input-sm"
                                    placeholder="Leave 0 for Base"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-secondary">Staff Price</label>
                                <input
                                    type="number"
                                    name="staffPrice"
                                    value={formData.staffPrice}
                                    onChange={handleChange}
                                    className="form-input form-input-sm"
                                    placeholder="Leave 0 for Base"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-secondary">Corporate Price</label>
                                <input
                                    type="number"
                                    name="corporatePrice"
                                    value={formData.corporatePrice}
                                    onChange={handleChange}
                                    className="form-input form-input-sm"
                                    placeholder="Leave 0 for Base"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-secondary">Scheme Price</label>
                                <input
                                    type="number"
                                    name="schemePrice"
                                    value={formData.schemePrice}
                                    onChange={handleChange}
                                    className="form-input form-input-sm"
                                    placeholder="Leave 0 for Base"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary italic">
                            * If a category price is set to 0, the system will automatically use the <strong>Base Price</strong> for that category.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label">Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. OPD, Pharmacy"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="label">Tariff Type</label>
                            <select
                                name="tariffType"
                                value={formData.tariffType}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="Low Cost">Low Cost</option>
                                <option value="High Cost">High Cost</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-textarea"
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label className="text-sm font-medium text-gray-700">Active</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/setup')}
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
                            {loading ? 'Saving...' : 'Save Service'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceForm;
