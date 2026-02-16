import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setupAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const UserForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'viewer',
        firstName: '',
        lastName: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const roles = [
        { id: 'admin', label: 'Administrator' },
        { id: 'accountant', label: 'Accountant' },
        { id: 'billing_staff', label: 'Billing Staff' },
        { id: 'viewer', label: 'Viewer' }
    ];

    useEffect(() => {
        if (isEditMode) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await setupAPI.users.getById(id);
            // Don't set password field when editing
            const { password, ...userData } = response.data;
            setFormData(prev => ({ ...prev, ...userData, password: '' }));
        } catch (err) {
            setError('Failed to fetch user details');
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
                // Remove password if empty in edit mode
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete dataToSend.password;

                await setupAPI.users.update(id, dataToSend);
            } else {
                await setupAPI.users.create(formData);
            }
            navigate('/app/setup');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save user');
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
                    {isEditMode ? 'Edit User' : 'New User'}
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
                            <label className="label">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="label">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="form-select"
                            required
                        >
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="label">
                            {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                            required={!isEditMode}
                            minLength="6"
                        />
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
                            {loading ? 'Saving...' : 'Save User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
