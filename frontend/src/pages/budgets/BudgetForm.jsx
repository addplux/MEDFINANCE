import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { budgetAPI, setupAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const BudgetForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        departmentId: '',
        fiscalYear: new Date().getFullYear().toString(),
        budgetAmount: '',
        category: 'Operational',
        notes: '',
        status: 'draft'
    });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    useEffect(() => {
        loadDepartments();
        if (isEditMode) {
            fetchBudget();
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

    const fetchBudget = async () => {
        try {
            setLoading(true);
            const response = await budgetAPI.getById(id);
            setFormData(response.data);
        } catch (err) {
            setError('Failed to fetch budget details');
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
                budgetAmount: parseFloat(formData.budgetAmount),
                departmentId: parseInt(formData.departmentId)
            };

            if (isEditMode) {
                await budgetAPI.update(id, payload);
            } else {
                await budgetAPI.create(payload);
            }
            navigate('/app/budgets');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save budget';
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
                    onClick={() => navigate('/app/budgets')}
                    className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-text-primary">
                    {isEditMode ? 'Edit Budget' : 'New Budget'}
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
                            <label className="form-label">Department *</label>
                            <select
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                                ))}
                            </select>
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
                                    <option value="Operational">Operational</option>
                                    <option value="Capital">Capital</option>
                                    <option value="Personnel">Personnel</option>
                                    <option value="Administrative">Administrative</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fiscal Year *</label>
                                <select
                                    name="fiscalYear"
                                    value={formData.fiscalYear}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    {years.map(year => (
                                        <option key={year} value={year.toString()}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Budget Amount *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">K</span>
                                    <input
                                        type="number"
                                        name="budgetAmount"
                                        value={formData.budgetAmount}
                                        onChange={handleChange}
                                        className="form-input pl-8"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="4"
                                placeholder="Provide budget justification or breakdown..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-color flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/budgets')}
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
                            {loading ? 'Saving...' : 'Save Budget'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetForm;
