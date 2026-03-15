import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, setupAPI, receivablesAPI } from '../../services/apiService';
import {
    ArrowLeft, Save, User, UserPlus, Shield,
    CreditCard, Calendar, Phone, MapPin,
    Briefcase, AlertCircle, Camera, CircleCheckBig,
    Stethoscope
} from 'lucide-react';

const PatientRegistration = () => {
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
        paymentMethod: 'cash',
        costCategory: 'standard',
        nrc: '',
        emergencyContact: '',
        emergencyPhone: '',
        nextOfKinRelationship: '',
        patientType: 'opd',
        schemeId: '',
        initialDeposit: '',
        targetDepartment: '',
        reasonForVisit: ''
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchSchemes();
        fetchDepartments();
    }, []);

    const fetchSchemes = async () => {
        try {
            const response = await receivablesAPI.schemes.getAll({ status: 'active' });
            setSchemes(response.data || []);
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await setupAPI.departments.getAll({ status: 'active' });
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
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
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
        if (!formData.targetDepartment) newErrors.targetDepartment = 'Target department is required for initial visit';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) data.append(key, formData[key]);
            });

            if (photoFile) data.append('photo', photoFile);

            await patientAPI.create(data);
            navigate('/app/records/dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
            alert(error.response?.data?.error || 'Failed to register patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            Patient Registration
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest font-black border border-blue-500/20">RECORDS</span>
                        </h1>
                        <p className="text-sm text-white/40 font-medium">Create a new electronic medical record for a patient</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Photo & Core Metadata */}
                <div className="space-y-6">
                    <div className="card p-8 flex flex-col items-center border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-3xl bg-gradient-to-tr from-white/10 to-transparent p-[1px] group-hover:from-blue-500/50 transition-all duration-500 shadow-2xl overflow-hidden">
                                <div className="w-full h-full rounded-[23px] bg-bg-primary flex items-center justify-center overflow-hidden">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center space-y-2 opacity-20">
                                            <Camera className="w-10 h-10 mx-auto" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">No Photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-blue-600/0 hover:bg-blue-600/40 opacity-0 hover:opacity-100 transition-all duration-300 rounded-[23px]">
                                <span className="text-white text-xs font-black uppercase tracking-widest">Update</span>
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </label>
                            {photoPreview && (
                                <button
                                    type="button"
                                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                >
                                    <ArrowLeft className="w-4 h-4 rotate-45" />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-6">Identification Image</p>
                    </div>

                    <div className="card p-6 border-white/5 space-y-4">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Account Type</h3>
                        <div className="space-y-3">
                            {['cash', 'corporate', 'private_prepaid'].map(method => (
                                <label
                                    key={method}
                                    className={`
                                        flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border
                                        ${formData.paymentMethod === method
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.04]'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${formData.paymentMethod === method ? 'bg-blue-400/20' : 'bg-white/5'}`}>
                                            {method === 'cash' ? <CreditCard className="w-4 h-4" /> : method === 'corporate' ? <Briefcase className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider">{method.replace('_', ' ')}</span>
                                    </div>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method}
                                        checked={formData.paymentMethod === method}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="hidden"
                                    />
                                    {formData.paymentMethod === method && <CircleCheckBig className="w-4 h-4" />}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Area: Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-8 border-white/5 space-y-8">
                        {/* Personal Information */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                <User className="w-4 h-4 text-blue-400" />
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Personal Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl focus:ring-blue-500/50"
                                        placeholder="Enter given name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Surname *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl"
                                        placeholder="Enter family name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">National ID (NRC)</label>
                                    <input
                                        type="text"
                                        value={formData.nrc}
                                        onChange={e => setFormData({ ...formData, nrc: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white"
                                        placeholder="000000/00/0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Gender *</label>
                                    <div className="flex gap-2">
                                        {['male', 'female', 'other'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gender: g })}
                                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase border transition-all ${formData.gender === g ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Contact Information */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                <Phone className="w-4 h-4 text-purple-400" />
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Contact details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white"
                                        placeholder="+260..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white"
                                        placeholder="patient@example.com"
                                    />
                                </div>
                                <div className="form-group md:col-span-2">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Residential Address</label>
                                    <textarea
                                        rows="2"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white"
                                        placeholder="Plot number, Street, Area..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Scheme Details (Conditional) */}
                        {['corporate', 'private_prepaid'].includes(formData.paymentMethod) && (
                            <section className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Scheme Information</h2>
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Select Plan/Company *</label>
                                    <select
                                        value={formData.schemeId}
                                        onChange={e => setFormData({ ...formData, schemeId: e.target.value })}
                                        className="form-select bg-white/[0.02] border-white/10 text-white rounded-xl"
                                    >
                                        <option value="">Choose available scheme...</option>
                                        {schemes.map(s => (
                                            <option key={s.id} value={s.id}>{s.schemeName} ({s.type})</option>
                                        ))}
                                    </select>
                                </div>
                            </section>
                        )}

                        {/* Initial Visit Details */}
                        <section className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                <Stethoscope className="w-4 h-4 text-rose-400" />
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Initial Visit & Triage</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Target Department *</label>
                                    <select
                                        value={formData.targetDepartment}
                                        onChange={e => setFormData({ ...formData, targetDepartment: e.target.value })}
                                        className="form-select bg-white/[0.02] border-white/10 text-white rounded-xl"
                                    >
                                        <option value="">Select where to send patient...</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.departmentName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Reason for Visit</label>
                                    <input
                                        type="text"
                                        value={formData.reasonForVisit}
                                        onChange={e => setFormData({ ...formData, reasonForVisit: e.target.value })}
                                        className="form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl"
                                        placeholder="E.g., General Checkup, Fever..."
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-3 text-white/20">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">* Required fields must be completed</span>
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/app/records/dashboard')}
                                className="px-8 py-4 text-white/40 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/20 px-10 py-4 h-auto"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'PROCESSING...' : 'COMPLETE REGISTRATION'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PatientRegistration;
