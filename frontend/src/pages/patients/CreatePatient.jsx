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
        paymentMethod: 'cash',
        costCategory: 'standard',
        staffId: '',
        serviceId: '',
        registeredService: '',
        ward: '',
        nrc: '',
        emergencyContact: '',
        emergencyPhone: '',
        nextOfKinRelationship: '',
        patientType: 'opd',
        schemeId: ''
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [staffMembers, setStaffMembers] = useState([]);
    const [services, setServices] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchStaffMembers();
        fetchServices();
        fetchSchemes();
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

    const fetchSchemes = async () => {
        try {
            // Might need import from apiService (e.g. receivablesAPI)
            const { receivablesAPI } = await import('../../services/apiService');
            const response = await receivablesAPI.schemes.getAll({ status: 'active' });
            setSchemes(response.data || []);
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
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

            // Create FormData object
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) data.append(key, formData[key]);
            });

            if (photoFile) {
                data.append('photo', photoFile);
            }

            await patientAPI.create(data);
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
                    {/* Photo Upload Section */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center mb-6">
                        <div className="relative w-32 h-32 mb-4 group cursor-pointer overflow-hidden rounded-full border-4 border-gray-100 shadow-sm">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <span className="text-4xl">📷</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-medium">Upload Photo</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Click to upload patient photo</p>
                    </div>

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

                    {/* Patient Type */}
                    <div className="form-group">
                        <label className="form-label">Patient Type *</label>
                        <select
                            value={formData.patientType}
                            onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}
                            className="form-select"
                            required
                        >
                            <option value="opd">OPD</option>
                            <option value="ipd">IPD</option>
                            <option value="maternity">Maternity</option>
                            <option value="theatre">Theatre</option>
                            <option value="emergency">Emergency</option>
                        </select>
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

                    {/* NRC (New Field) */}
                    <div className="form-group">
                        <label className="form-label">NRC Number</label>
                        <input
                            type="text"
                            value={formData.nrc}
                            onChange={(e) => setFormData({ ...formData, nrc: e.target.value })}
                            className="form-input"
                            placeholder="e.g. 123456/10/1"
                        />
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
                            value={formData.registeredService}
                            onChange={(e) => setFormData({ ...formData, registeredService: e.target.value })}
                            className="form-select"
                        >
                            <option value="">Select Service</option>
                            <option value="Consultation">Consultation</option>
                            <option value="Nursing Care">Nursing Care</option>
                            <option value="Hospitalisation">Hospitalisation</option>
                            <option value="Ante Natal Care">Ante Natal Care</option>
                            <option value="Normal Delivery/Post Natal Visit">Normal Delivery/Post Natal Visit</option>
                            <option value="Surgery">Surgery</option>
                            <option value="Anesthetic">Anesthetic</option>
                            <option value="Theater">Theater</option>
                            <option value="X-Ray Examination/Scan">X-Ray Examination/Scan</option>
                            <option value="Physiotherapy">Physiotherapy</option>
                            <option value="Medicines">Medicines</option>
                            <option value="Miscellaneous Dressing etc">Miscellaneous Dressing etc</option>
                            <option value="Doctors Round">Doctors Round</option>
                            <option value="Dental Surgery">Dental Surgery</option>
                            <option value="Other">Other</option>
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

                    <div className="form-group">
                        <label className="form-label">Next of Kin Name</label>
                        <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                            className="form-input"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Next of Kin Phone</label>
                        <input
                            type="tel"
                            value={formData.emergencyPhone}
                            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                            className="form-input"
                            placeholder="+260..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Next of Kin Relationship</label>
                        <select
                            value={formData.nextOfKinRelationship}
                            onChange={(e) => setFormData({ ...formData, nextOfKinRelationship: e.target.value })}
                            className="form-select"
                        >
                            <option value="">Select Relationship</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Child">Child</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Billing Type */}
                    <div className="form-group">
                        <label className="form-label">Billing Type *</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="form-select"
                            required
                        >
                            <option value="cash">Cash</option>
                            <option value="nhima">NHIMA</option>
                            <option value="corporate">Corporate</option>
                            <option value="private_prepaid">Private Prepaid</option>
                            <option value="staff">Staff</option>
                            <option value="foc">FOC</option>
                            <option value="emergency">Emergency</option>
                            {/* Deprecated but kept for compatibility */}
                            <option value="scheme">Insurance Scheme (Deprecated)</option>
                            <option value="exempted">Exempted (Deprecated)</option>
                        </select>
                    </div>

                    {/* Specific Scheme selection */}
                    {(['corporate', 'private_prepaid', 'nhima', 'scheme'].includes(formData.paymentMethod)) && (
                        <div className="form-group">
                            <label className="form-label">Specific Scheme</label>
                            <select
                                value={formData.schemeId}
                                onChange={(e) => setFormData({ ...formData, schemeId: e.target.value })}
                                className="form-select"
                            >
                                <option value="">Select Scheme (if applicable)</option>
                                {schemes.map(scheme => (
                                    <option key={scheme.id} value={scheme.id}>
                                        {scheme.name} ({scheme.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Staff Member-Only show if billing type is Staff */}
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

                    {/* NHIMA Number-Only show if billing type is NHIMA */}
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
