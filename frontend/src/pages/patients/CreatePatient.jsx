import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, setupAPI } from '../../services/apiService';
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
        nhimaNumber: '',
        paymentMethod: 'cash', // Default to cash (non-NHIMA)
        costCategory: 'standard',
        staffId: '',
        serviceId: '',
        ward: ''
    });
    const [staffMembers, setStaffMembers] = useState([]);
    const [services, setServices] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchStaffMembers();
        fetchServices();
    }, []);

    const fetchStaffMembers = async () => {
        try {
            const response = await setupAPI.users.getAll({ isActive: true });
            setStaffMembers(response.data);
        } catch (error) {
            console.error('Failed to fetch staff members:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await setupAPI.services.getAll({ isActive: true });
            setServices(response.data);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    };

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
                            className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
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
                            className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
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
                            className={`form-select ${errors.gender ? 'border-red-500' : ''}`}
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

                    {/* Cost Category */}
                    <div className="form-group">
                        <label className="form-label">Cost Category *</label>
                        <select
                            value={formData.costCategory}
                            onChange={(e) => setFormData({ ...formData, costCategory: e.target.value })}
                            className="form-select"
                            required
                        >
                            <option value="standard">Standard</option>
                            <option value="high_cost">High Cost</option>
                            <option value="low_cost">Low Cost</option>
                        </select>
                    </div>

                    {/* Service */}
                    <div className="form-group">
                        <label className="form-label">Service</label>
                        <select
                            value={formData.serviceId}
                            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                            className="form-select"
                        >
                            <option value="">Select Service</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.serviceName} ({service.category})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ward */}
                    <div className="form-group">
                        <label className="form-label">Ward</label>
                        <select
                            value={formData.ward}
                            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                            className="form-select"
                        >
                            <option value="">Select Ward</option>
                            <option value="male_ward">Male Ward</option>
                            <option value="female_ward">Female Ward</option>
                            <option value="general_ward">General Ward</option>
                            <option value="pediatric_ward">Pediatric Ward</option>
                            <option value="icu">ICU</option>
                        </select>
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

                    {/* Payment Method */}
                    <div className="form-group">
                        <label className="form-label">Payment Method *</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="form-select"
                            required
                        >
                            <option value="cash">Cash (Self-Pay)</option>
                            <option value="nhima">NHIMA</option>
                            <option value="corporate">Corporate Account</option>
                            <option value="scheme">Insurance Scheme</option>
                            <option value="staff">Staff</option>
                            <option value="exempted">Exempted (Free)</option>
                        </select>
                    </div>

                    {/* Staff Member-Only show if payment method is Staff */}
                    {formData.paymentMethod === 'staff' && (
                        <div className="form-group">
                            <label className="form-label">Principal Staff Member *</label>
                            <select
                                value={formData.staffId}
                                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                className="form-select"
                                required
                            >
                                <option value="">Select Staff Member</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.firstName} {staff.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* NHIMA Number-Only show if payment method is NHIMA */}
                    {formData.paymentMethod === 'nhima' && (
                        <div className="form-group">
                            <label className="form-label">NHIMA Number *</label>
                            <input
                                type="text"
                                value={formData.nhimaNumber}
                                onChange={(e) => setFormData({ ...formData, nhimaNumber: e.target.value })}
                                className="form-input"
                                required
                            />
                        </div>
                    )}

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
