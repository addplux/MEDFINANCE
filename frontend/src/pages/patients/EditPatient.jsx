import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI, setupAPI } from '../../services/apiService';
import api from '../../services/apiClient'; // Import base client for new routes
import { ArrowLeft, Save, Clock, Move, FileText } from 'lucide-react';

const EditPatient = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'history', 'movement'
    const [patientHistory, setPatientHistory] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [movementData, setMovementData] = useState({
        toDepartment: '',
        notes: ''
    });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
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
        const fetchData = async () => {
            try {
                const { receivablesAPI } = await import('../../services/apiService');
                const [patientRes, staffRes, servicesRes, schemesRes] = await Promise.all([
                    patientAPI.getById(id),
                    setupAPI.users.getAll({ isActive: true }),
                    setupAPI.services.getAll({ isActive: true }),
                    receivablesAPI.schemes.getAll({ status: 'active' })
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
                    paymentMethod: patient.paymentMethod || 'cash',
                    costCategory: patient.costCategory || 'standard',
                    staffId: patient.staffId || '',
                    serviceId: patient.serviceId || '',
                    registeredService: patient.registeredService || '',
                    ward: patient.ward || '',
                    nrc: patient.nrc || '',
                    emergencyContact: patient.emergencyContact || '',
                    emergencyPhone: patient.emergencyPhone || '',
                    nextOfKinRelationship: patient.nextOfKinRelationship || '',
                    patientType: patient.patientType || 'opd',
                    schemeId: patient.schemeId || ''
                });

                if (patient.photoUrl) {
                    setPhotoPreview(`${import.meta.env.VITE_API_URL.replace('/api', '')}${patient.photoUrl}`);
                }

                setStaffMembers(staffRes.data);
                setServices(servicesRes.data);
                setSchemes(schemesRes.data || []);
            } catch (error) {
                console.error('Failed to load data:', error);
                alert('Failed to load patient data');
                navigate('/app/patients');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [id, navigate, activeTab]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        } else if (activeTab === 'movement') {
            fetchMovements();
        }
    }, [activeTab, id]);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            // Fetch bills as proxy for history
            const response = await setupAPI.services.getAll(); // Placeholder, need specific billing endpoint
            // Since we don't have a direct "patient history" endpoint yet, we might need to mock or fetch bills
            // For now, let's fetch OPD bills for this patient if possible, or leave as placeholder
            // Assuming billingAPI exists and can filter by patient
            const billsRes = await api.get(`/billing/opd?patientId=${id}`); // pseudo-code
            setPatientHistory(billsRes.data.data || []);
        } catch (error) {
            console.log("History fetch simulated");
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchMovements = async () => {
        try {
            // Placeholder for fetching movements
            const res = await api.get(`/patient-movements/${id}`);
            setMovements(res.data);
        } catch (error) {
            console.error('Failed to fetch movements', error);
        }
    };

    const handleLogMovement = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patient-movements', {
                patientId: id,
                fromDepartment: formData.ward,
                toDepartment: movementData.toDepartment,
                notes: movementData.notes
            });
            alert('Movement logged successfully');
            setMovementData({ toDepartment: '', notes: '' });
            fetchMovements();
            // Update local ward state
            setFormData(prev => ({ ...prev, ward: movementData.toDepartment }));
        } catch (error) {
            alert('Failed to log movement');
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

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'details' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('details')}
                >
                    Patient Details
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'history' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('history')}
                >
                    Visit History
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'movement' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('movement')}
                >
                    Patient Movement
                </button>
            </div>

            {activeTab === 'details' && (

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

                        <div className="form-group">
                            <label className="form-label">Billing Type *</label>
                            <select
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="form-select"
                                required
                            >
                                <option value="cash">Cash</option>
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
                        {(['corporate', 'private_prepaid', 'scheme'].includes(formData.paymentMethod)) && (
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
            )
            }

            {activeTab === 'history' && (
                <div className="card p-6">
                    <h3 className="text-lg font-bold mb-4">Patient Visit History</h3>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="text-left bg-gray-50 border-b">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Service / Visit</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientHistory.length > 0 ? (
                                    patientHistory.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-3">{new Date(item.billDate).toLocaleDateString()}</td>
                                            <td className="p-3">{item.service?.serviceName || 'Consultation'}</td>
                                            <td className="p-3">K {item.netAmount}</td>
                                            <td className="p-3"><span className="badge badge-success">{item.status}</span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-500">No history found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {
                activeTab === 'movement' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card p-6 md:col-span-1">
                            <h3 className="font-bold text-lg mb-4">Log New Movement</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Current Location</label>
                                    <div className="p-3 bg-gray-100 rounded text-gray-700 font-medium">
                                        {formData.ward || 'Not Associated'}
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Transfer To</label>
                                    <select
                                        className="form-select"
                                        value={movementData.toDepartment}
                                        onChange={(e) => setMovementData({ ...movementData, toDepartment: e.target.value })}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="male_ward">Male Ward</option>
                                        <option value="female_ward">Female Ward</option>
                                        <option value="general_ward">General Ward</option>
                                        <option value="icu">ICU</option>
                                        <option value="theatre">Theatre</option>
                                        <option value="maternity">Maternity</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="3"
                                        value={movementData.notes}
                                        onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
                                    ></textarea>
                                </div>
                                <button onClick={handleLogMovement} className="btn btn-primary w-full">
                                    <Move className="w-4 h-4 mr-2" /> Transfer Patient
                                </button>
                            </div>
                        </div>

                        <div className="card p-6 md:col-span-2">
                            <h3 className="font-bold text-lg mb-4">Movement Log</h3>
                            <div className="space-y-4">
                                {movements.map((move, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 border rounded-lg bg-gray-50 relative">
                                        <div className="mt-1"><Clock className="w-5 h-5 text-gray-400" /></div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                Moved from {move.fromDepartment} to {move.toDepartment}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(move.movementDate).toLocaleString()} - by {move.admitter?.firstName}
                                            </p>
                                            {move.notes && (
                                                <p className="text-sm text-gray-600 mt-1 italic">"{move.notes}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {movements.length === 0 && <p className="text-gray-500 text-center">No movements logged.</p>}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default EditPatient;
