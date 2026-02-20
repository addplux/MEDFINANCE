import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI, setupAPI } from '../../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

const EditPatient = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
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
        ward: '',
        nrc: '',
        emergencyContact: '',
        emergencyPhone: ''
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [staffMembers, setStaffMembers] = useState([]);
    const [services, setServices] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientRes, staffRes, servicesRes] = await Promise.all([
                    patientAPI.getById(id),
                    setupAPI.users.getAll({ isActive: true }),
                    setupAPI.services.getAll({ isActive: true })
                ]);

                const patient = patientRes.data;
                setFormData({
                    firstName: patient.firstName || '',
                    lastName: patient.lastName || '',
                    dateOfBirth: patient.dateOfBirth || '',
                    gender: patient.gender || '',
                    phone: patient.phone || '',
                    email: patient.email || '',
                    address: patient.address || '',
                    nhimaNumber: patient.nhimaNumber || '',
                    paymentMethod: patient.paymentMethod || 'cash',
                    costCategory: patient.costCategory || 'standard',
                    staffId: patient.staffId || '',
                    serviceId: patient.serviceId || '',
                    ward: patient.ward || '',
                    nrc: patient.nrc || '',
                    emergencyContact: patient.emergencyContact || '',
                    emergencyPhone: patient.emergencyPhone || ''
                });

                if (patient.photoUrl) {
                    setPhotoPreview(`http://localhost:5000${patient.photoUrl}`);
                }

                setStaffMembers(staffRes.data);
                setServices(servicesRes.data);
            } catch (error) {
                console.error('Failed to load data:', error);
                alert('Failed to load patient data');
                navigate('/app/patients');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

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

            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            if (photoFile) {
                data.append('photo', photoFile);
            }

            await patientAPI.update(id, data);
            navigate('/app/patients');
        } catch (error) {
            console.error('Failed to update patient:', error);
            alert(error.response?.data?.error || 'Failed to update patient');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading patient data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/patients')}
                    className="btn btn-secondary"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Patient</h1>
                    <p className="text-gray-600 mt-1">Update patient information</p>
                </div>
            </div>

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
                        <p className="text-sm text-gray-500">Click to update patient photo</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="form-input"
                        />
                    </div>

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
                        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                    </div>

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

                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="form-input"
                        />
                    </div>

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
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Next of Kin Phone</label>
                        <input
                            type="tel"
                            value={formData.emergencyPhone}
                            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                            className="form-input"
                        />
                    </div>

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

                    <div className="form-group md:col-span-2">
                        <label className="form-label">Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="form-textarea"
                            rows="3"
                        />
                    </div>
                </div>

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
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditPatient;
