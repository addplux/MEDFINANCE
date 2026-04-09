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
                // Use allSettled so that permission failures on secondary calls
                // (staff, services, schemes) don't crash the patient data load
                const [patientRes, staffRes, servicesRes, schemesRes] = await Promise.allSettled([
                    patientAPI.getById(id),
                    setupAPI.users.getAll({ isActive: true }),
                    setupAPI.services.getAll({ isActive: true }),
                    receivablesAPI.schemes.getAll({ status: 'active' })
                ]);

                // Patient data is required — if it failed, abort
                if (patientRes.status === 'rejected') {
                    throw patientRes.reason;
                }

                const patient = patientRes.value.data;
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
                    setPhotoPreview(`${import.meta.env.VITE_API_URL.replace('/api', '')}${patient.photoUrl}?token=${localStorage.getItem('token')}`);
                }

                // Secondary data — fall back to empty arrays on permission errors
                if (staffRes.status === 'fulfilled') setStaffMembers(staffRes.value.data || []);
                if (servicesRes.status === 'fulfilled') setServices(servicesRes.value.data || []);
                if (schemesRes.status === 'fulfilled') setSchemes(schemesRes.value.data || []);
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
                    <h1 className="text-3xl font-black text-text-primary tracking-tight">Edit Patient</h1>
                    <p className="text-text-secondary mt-1">Update patient information</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-border-color mb-8">
                <button
                    className={`px-6 py-3 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    onClick={() => setActiveTab('details')}
                >
                    Patient Details
                </button>
                <button
                    className={`px-6 py-3 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    onClick={() => setActiveTab('history')}
                >
                    Visit History
                </button>
                <button
                    className={`px-6 py-3 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'movement' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    onClick={() => setActiveTab('movement')}
                >
                    Patient Movement
                </button>
            </div>

            {activeTab === 'details' && (

            {activeTab === 'details' && (
                <form onSubmit={handleSubmit} className="card p-8">
                    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Identity Details</h3>
                            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Core Identity Link Information</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="form-group">
                            <label className="form-label text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block">First Name</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className={`form-input bg-white/5 border-white/10 text-white rounded-xl py-3 px-4 focus:border-primary transition-all ${errors.firstName ? 'border-red-500' : ''}`}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className={`form-input bg-white/5 border-white/10 text-white rounded-xl py-3 px-4 focus:border-primary transition-all ${errors.lastName ? 'border-red-500' : ''}`}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block">NRC Number</label>
                            <input
                                type="text"
                                value={formData.nrc}
                                onChange={(e) => setFormData({ ...formData, nrc: e.target.value })}
                                className="form-input bg-white/5 border-white/10 text-white rounded-xl py-3 px-4 focus:border-primary transition-all"
                                placeholder="e.g. 123456/10/1"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block">Man Number</label>
                            <input
                                type="text"
                                value={formData.manNumber}
                                onChange={(e) => setFormData({ ...formData, manNumber: e.target.value })}
                                className="form-input bg-white/5 border-white/10 text-white rounded-xl py-3 px-4 focus:border-primary transition-all"
                                placeholder="e.g. 987654"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block">Visit Flow Type</label>
                            <select
                                value={formData.referralType}
                                onChange={(e) => setFormData({ ...formData, referralType: e.target.value })}
                                className="form-select bg-white/5 border-white/10 text-white rounded-xl py-3 px-4 focus:border-primary transition-all"
                            >
                                <option value="bypass">Bypass (Standard Fee)</option>
                                <option value="referral">Referral (No Consult Fee)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2 block">Billing Category</label>
                            <select
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="form-select bg-white/5 border-white/10 text-white rounded-xl py-3 px-4 focus:border-primary transition-all"
                                required
                            >
                                <option value="cash">Cash / Full Payment</option>
                                <option value="corporate">Corporate / NHIMA</option>
                                <option value="private_prepaid">Private Prepaid</option>
                                <option value="staff">Staff Member</option>
                                <option value="foc">Free of Charge (FOC)</option>
                            </select>
                        </div>
                    </div>

                    {/* Secondary Info Disclaimer */}
                    <div className="mt-12 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-1">Managed Externally</h4>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                                Demographic data such as **Address, Phone, Email, and Photograph** are synchronised with the **National EHR**. Updates to those fields should be performed in the external record interface to ensure data integrity.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => navigate('/app/patients')}
                            className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Save Patient Profile'}
                        </button>
                    </div>
                </form>
            )
            )
            }

            {activeTab === 'history' && (
                <div className="card p-6">
                    <h3 className="text-lg font-bold mb-4">Patient Visit History</h3>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="text-left bg-bg-tertiary border-b border-border-color">
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Date</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Service / Visit</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Amount</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Current Location</label>
                                    <div className="p-4 bg-bg-tertiary border border-border-color rounded-xl text-text-primary font-bold">
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
                                    <div key={idx} className="flex gap-4 p-5 border border-border-color rounded-2xl bg-bg-secondary hover:bg-bg-tertiary transition-all relative">
                                        <div className="mt-1"><Clock className="w-5 h-5 text-text-tertiary" /></div>
                                        <div>
                                            <p className="font-bold text-text-primary">
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
        </div>
    );
};

export default EditPatient;
