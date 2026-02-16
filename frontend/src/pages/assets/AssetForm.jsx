import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assetAPI, setupAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const AssetForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        assetName: '',
        category: 'equipment',
        departmentId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: '',
        usefulLife: '5',
        salvageValue: '0',
        description: '',
        supplier: '',
        serialNumber: '',
        location: '',
        status: 'active'
    });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDepartments();
        if (isEditMode) {
            fetchAsset();
        }
    }, [id]);

    const loadDepartments = async () => {
        try {
            const response = await setupAPI.departments.getAll();
            setDepartments(response.data.data || response.data);
        } catch (err) {
            console.error('Failed to load departments:', err);
        }
    };

    const fetchAsset = async () => {
        try {
            setLoading(true);
            const response = await assetAPI.getById(id);
            const asset = response.data;
            // Format date for input
            if (asset.purchaseDate) {
                asset.purchaseDate = new Date(asset.purchaseDate).toISOString().split('T')[0];
            }
            setFormData(asset);
        } catch (err) {
            setError('Failed to fetch asset details');
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

            const payload = {
                ...formData,
                purchasePrice: parseFloat(formData.purchasePrice),
                usefulLife: parseInt(formData.usefulLife),
                salvageValue: parseFloat(formData.salvageValue),
                departmentId: formData.departmentId ? parseInt(formData.departmentId) : null
            };

            if (isEditMode) {
                await assetAPI.update(id, payload);
            } else {
                await assetAPI.create(payload);
            }
            navigate('/app/assets');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save asset';
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
                    onClick={() => navigate('/app/assets')}
                    className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-text-primary">
                    {isEditMode ? 'Edit Asset' : 'New Asset'}
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
                            <h3 className="text-lg font-medium text-text-primary border-b border-border-color pb-2">Asset Details</h3>

                            <div className="form-group">
                                <label className="form-label">Asset Name *</label>
                                <input
                                    type="text"
                                    name="assetName"
                                    value={formData.assetName}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    placeholder="e.g. X-Ray Machine"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="equipment">Equipment</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="vehicles">Vehicles</option>
                                        <option value="buildings">Buildings</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        name="departmentId"
                                        value={formData.departmentId || ''}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Serial Number</label>
                                    <input
                                        type="text"
                                        name="serialNumber"
                                        value={formData.serialNumber}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="e.g. Room 204"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Supplier</label>
                                <input
                                    type="text"
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* Acquisition & Depreciation */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-text-primary border-b border-border-color pb-2">Acquisition & Financials</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Purchase Date *</label>
                                    <input
                                        type="date"
                                        name="purchaseDate"
                                        value={formData.purchaseDate}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Purchase Price *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">K</span>
                                        <input
                                            type="number"
                                            name="purchasePrice"
                                            value={formData.purchasePrice}
                                            onChange={handleChange}
                                            className="form-input pl-8"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Useful Life (Years)</label>
                                    <input
                                        type="number"
                                        name="usefulLife"
                                        value={formData.usefulLife}
                                        onChange={handleChange}
                                        className="form-input"
                                        min="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Salvage Value</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">K</span>
                                        <input
                                            type="number"
                                            name="salvageValue"
                                            value={formData.salvageValue}
                                            onChange={handleChange}
                                            className="form-input pl-8"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
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
                                    <option value="under_maintenance">Under Maintenance</option>
                                    <option value="disposed">Disposed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="form-textarea"
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-color flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/assets')}
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
                            {loading ? 'Saving...' : 'Save Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssetForm;
