import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const CreatePatient = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        nhimaNumber: ''
    });
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            await patientAPI.create(formData);
            navigate('/app/patients');
        } catch (error) {
            console.error('Failed to create patient:', error);
            alert(error.response?.data?.error || 'Failed to create patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/patients')}
                    className="btn btn-secondary"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">New Patient</h1>
                    <p className="text-gray-600 mt-1">Register a new patient</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className={`form - input ${errors.firstName ? 'border-red-500' : ''} `}
                            required
                        />
                        {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className={`form - input ${errors.lastName ? 'border-red-500' : ''} `}
                            required
                        />
                        {errors.lastName && (
                            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                    </div>

                    {/* Date of Birth */}
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    {/* Gender */}
                    <div className="form-group">
                        <label className="form-label">Gender *</label>
                        <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className={`form - select ${errors.gender ? 'border-red-500' : ''} `}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.gender && (
                            <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="form-input"
                            placeholder="+260..."
                        />
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    {/* NHIMA Number */}
                    <div className="form-group">
                        <label className="form-label">NHIMA Number</label>
                        <input
                            type="text"
                            value={formData.nhimaNumber}
                            onChange={(e) => setFormData({ ...formData, nhimaNumber: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    {/* Address */}
                    <div className="form-group md:col-span-2">
                        <label className="form-label">Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="form-textarea"
                            rows="3"
                            placeholder="Full address..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/app/patients')}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Creating...' : 'Create Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePatient;
