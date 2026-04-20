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
        manNumber: '',
        medicalLimitMonthly: '',
        medicalLimitAnnual: '',
        isActive: true,
        grantLogin: false 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const roles = [
        { id: 'superintendent', label: 'Superintendent (Medical Director)' },
        { id: 'admin', label: 'Administrator' },
        { id: 'doctor', label: 'Doctor / Medical Officer' },
        { id: 'nurse', label: 'Nurse / Ward Staff' },
        { id: 'accountant', label: 'Accountant / Finance Officer' },
        { id: 'cashier', label: 'Cashier / Billing Clerk' },
        { id: 'pharmacist', label: 'Pharmacist / Dispenser' },
        { id: 'lab_technician', label: 'Lab Technician' },
        { id: 'radiographer', label: 'Radiographer' },
        { id: 'records_clerk', label: 'Records Clerk (Medical Records Officer)' },
        { id: 'billing_staff', label: 'Billing Staff (Legacy)' },
        { id: 'viewer', label: 'Viewer (Read-only)' }
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
            setFormData(prev => ({ 
                ...prev, 
                ...userData, 
                password: '', 
                grantLogin: !!userData.email || !!userData.username 
            }));
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
                if (!dataToSend.grantLogin) {
                    dataToSend.email = null;
                    dataToSend.username = null;
                }

                await setupAPI.users.update(id, dataToSend);
                navigate('/app/setup');
            } else {
                const dataToSend = { ...formData };
                if (!dataToSend.grantLogin) {
                    delete dataToSend.username;
                    delete dataToSend.email;
                    delete dataToSend.password;
                }
                const response = await setupAPI.users.create(dataToSend);
                const newUser = response.data;

                if (window.confirm(`Staff member saved successfully!\n\nWould you like to register "${newUser.firstName} ${newUser.lastName}" in the Patient Registry (Medical File) now?`)) {
                    navigate(`/app/patients/new?staffId=${newUser.id}&firstName=${newUser.firstName}&lastName=${newUser.lastName}&manNumber=${newUser.manNumber}`);
                } else {
                    navigate('/app/setup');
                }
            }
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
                    className="p-2 hover:bg-white/10 rounded-full"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="space-y-2">
                            <label className="label">Man Number</label>
                            <input
                                type="text"
                                name="manNumber"
                                value={formData.manNumber}
                                onChange={handleChange}
                                className="form-input bg-bg-tertiary/50"
                                placeholder={isEditMode ? "" : "Auto-generated"}
                            />
                            <p className="text-[10px] text-text-tertiary">Leave blank to auto-generate</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                        <input
                            type="checkbox"
                            name="grantLogin"
                            id="grantLogin"
                            checked={formData.grantLogin}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="grantLogin" className="text-sm font-bold text-white uppercase tracking-wider cursor-pointer">
                            Grant System Login Access
                        </label>
                    </div>

                    {formData.grantLogin && (
                        <div className="space-y-4 animate-fade-in border-l-2 border-primary/30 pl-4 mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="label">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="form-input"
                                        required={formData.grantLogin}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="form-input"
                                        required={formData.grantLogin}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="label">System Role</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="form-select"
                                        required={formData.grantLogin}
                                    >
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="label">
                                        {isEditMode ? 'Change Password' : 'Password'}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="form-input"
                                        required={!isEditMode && formData.grantLogin}
                                        minLength="6"
                                        placeholder={isEditMode ? "Leave blank to keep current" : ""}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label className="text-sm font-medium text-gray-300">Active</label>
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
