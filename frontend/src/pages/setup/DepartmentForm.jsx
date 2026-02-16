import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setupAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const DepartmentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        departmentCode: '',
        departmentName: '',
        managerId: '',
        description: '',
        status: 'active'
    });
    const [managers, setManagers] = useState([]); // Users who can be managers
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchManagers();
        if (isEditMode) {
            fetchDepartment();
        }
    }, [id]);

    const fetchManagers = async () => {
        try {
            const response = await setupAPI.users.getAll({ isActive: true });
            setManagers(response.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const fetchDepartment = async () => {
        try {
            setLoading(true);
            const response = await setupAPI.departments.getById(id);
            setFormData(response.data);
        } catch (err) {
            setError('Failed to fetch department details');
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
                await setupAPI.departments.update(id, formData);
            } else {
                await setupAPI.departments.create(formData);
            }
            navigate('/app/setup');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save department');
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
                    {isEditMode ? 'Edit Department' : 'New Department'}
                </h1>
            </div>

            <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label">Department Code</label>
                            <input
                                type="text"
                                name="departmentCode"
                                value={formData.departmentCode}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="label">Department Name</label>
                            <input
                                type="text"
                                name="departmentName"
                                value={formData.departmentName}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="label">Manager</label>
                        <select
                            name="managerId"
                            value={formData.managerId || ''}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="">Select Manager</option>
                            {managers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.username})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            className="form-textarea"
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="label">Status</label>
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
                            {loading ? 'Saving...' : 'Save Department'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentForm;
