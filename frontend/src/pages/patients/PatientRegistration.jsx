import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, setupAPI, prepaidPlanAPI } from '../../services/apiService';
import {
    ArrowLeft, Save, User, Shield,
    CreditCard, Phone,
    AlertCircle, Camera, CircleCheckBig,
    Stethoscope
} from 'lucide-react';

const PatientRegistration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        ageGroup: '5_to_65',
        gender: '',
        phone: '',
        paymentMethod: 'cash',
        costCategory: 'high_cost',
        nrc: '',
        emergencyContact: '',
        emergencyPhone: '',
        nextOfKinRelationship: '',
        patientType: 'opd',
        memberPlan: '',
        initialDeposit: '',
        targetDepartment: '',
        reasonForVisit: ''
    });
    const [hasReferral, setHasReferral] = useState(false);
    const [receiptNumber, setReceiptNumber] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [prepaidPlans, setPrepaidPlans] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [errors, setErrors] = useState({});

    const [existingPatientId, setExistingPatientId] = useState(null);
    const [prePaidBanner, setPrePaidBanner] = useState(false);

    useEffect(() => {
        fetchPrepaidPlans();
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (!formData.nrc || formData.nrc.length < 5) {
            setPrePaidBanner(false);
            setExistingPatientId(null);
            return;
        }
        const debounce = setTimeout(async () => {
            try {
                const res = await patientAPI.getAll({ search: formData.nrc });
                const patients = res.data?.data || res.data || [];
                const draft = patients.find(p => p.registeredService === 'Pre-Registration Payment' && p.nrc === formData.nrc);
                if (draft) {
                    setFormData(prev => ({
                        ...prev,
                        firstName: draft.firstName || prev.firstName,
                        lastName: draft.lastName || prev.lastName,
                        costCategory: draft.costCategory || prev.costCategory,
                        paymentMethod: draft.paymentMethod || prev.paymentMethod
                    }));
                    setExistingPatientId(draft.id);
                    setPrePaidBanner(true);
                } else {
                    setExistingPatientId(null);
                    setPrePaidBanner(false);
                }
            } catch (error) {
                console.error('NRC Lookup error:', error);
            }
        }, 800);
        return () => clearTimeout(debounce);
    }, [formData.nrc]);

    const fetchPrepaidPlans = async () => {
        try {
            const response = await prepaidPlanAPI.getAll();
            setPrepaidPlans(response.data || []);
        } catch (error) {
            console.error('Failed to fetch prepaid plans:', error);
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

    const getRequiredFee = () => {
        if (formData.costCategory === 'high_cost' && formData.paymentMethod === 'private_prepaid') {
            return 2100;
        }
        return 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const newErrors = {};
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

        const requiredFee = getRequiredFee();
        if (requiredFee > 0 && !receiptNumber && !prePaidBanner) {
            newErrors.receiptNumber = 'Cashier Receipt Number is required for paid registration';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            
            // Build submission payload
            const payload = {
                ...formData,
                isReferral: formData.costCategory === 'low_cost' ? hasReferral : false,
                initialDeposit: prePaidBanner ? 0 : requiredFee,
                receiptNumber: prePaidBanner ? 'PRE-PAID' : (requiredFee > 0 ? receiptNumber : ''),
                registeredService: null // Clear the pre-paid draft marker
            };

            Object.keys(payload).forEach(key => {
                if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
                    data.append(key, payload[key]);
                }
            });

            if (photoFile) data.append('photo', photoFile);

            if (existingPatientId) {
                await patientAPI.update(existingPatientId, data);
            } else {
                await patientAPI.create(data);
            }

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

            {prePaidBanner && (
                <div className="card p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 mb-6">
                    <div className="flex items-center gap-3">
                        <CircleCheckBig className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-sm font-black text-white uppercase tracking-wider">Pre-Paid Registration Detected!</p>
                            <p className="text-xs text-emerald-400/80">This patient's registration fee was already paid at the Cashier. Updating skeleton profile.</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Photo & Core Metadata */}
                <div className="space-y-6">
                    <div className="card p-6 border-white/5 space-y-4">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Cost Category</h3>
                        <div className="flex gap-2">
                            {[
                                { value: 'high_cost', label: 'High Cost' },
                                { value: 'low_cost', label: 'Low Cost' }
                            ].map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, costCategory: cat.value, paymentMethod: 'cash' })}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase border transition-all ${formData.costCategory === cat.value ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.costCategory === 'high_cost' && (
                        <div className="card p-6 border-white/5 space-y-4 animate-in slide-in-from-top duration-300">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">High Cost Types</h3>
                            <div className="space-y-3">
                                {['cash', 'private_prepaid', 'corporate', 'staff'].map(method => (
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
                                                {method === 'cash' ? <CreditCard className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
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
                    )}

                    {formData.costCategory === 'low_cost' && (
                        <div className="card p-6 border-white/5 space-y-4 animate-in slide-in-from-top duration-300">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Referral Status</h3>
                            <div className="flex gap-2">
                                {[
                                    { value: true, label: 'Referral Patient' },
                                    { value: false, label: 'Non-Referral' }
                                ].map(ref => (
                                    <button
                                        key={String(ref.value)}
                                        type="button"
                                        onClick={() => setHasReferral(ref.value)}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase border transition-all ${hasReferral === ref.value ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                    >
                                        {ref.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {getRequiredFee() > 0 && (
                        <div className="card p-6 border-white/5 space-y-4 bg-blue-600/5 animate-in slide-in-from-top duration-300">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Required Fee</span>
                                <span className="text-xl font-black text-white">K{getRequiredFee()}</span>
                            </div>
                            <div className="form-group space-y-2">
                                <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Cashier Receipt Number</label>
                                <input
                                    type="text"
                                    value={receiptNumber}
                                    onChange={e => setReceiptNumber(e.target.value)}
                                    className={`form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl focus:ring-blue-500/50 ${errors.receiptNumber ? 'border-red-500/50 focus:border-red-500' : ''}`}
                                    placeholder="Enter receipt number"
                                />
                                {errors.receiptNumber && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.receiptNumber}</p>}
                            </div>
                        </div>
                    )}
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
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Age Group *</label>
                                    <select
                                        value={formData.ageGroup}
                                        onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
                                        className="form-select bg-white/[0.02] border-white/10 text-white rounded-xl py-3"
                                    >
                                        <option value="under_5">Under 5 Years</option>
                                        <option value="5_to_65">5 to 65 Years</option>
                                        <option value="above_65">Above 65 Years</option>
                                    </select>
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

                            <div className="grid grid-cols-1 gap-6">
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
                            </div>
                        </section>

                        {/* Prepaid Plan Selection (for Private Prepaid patients) */}
                        {formData.paymentMethod === 'private_prepaid' && (
                            <section className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Prepaid Plan</h2>
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Select Plan Tier</label>
                                    <select
                                        value={formData.memberPlan}
                                        onChange={e => setFormData({ ...formData, memberPlan: e.target.value })}
                                        className="form-select bg-white/[0.02] border-white/10 text-white rounded-xl"
                                    >
                                        <option value="">Choose a prepaid plan...</option>
                                        {prepaidPlans.filter(p => p.isActive).map(p => (
                                            <option key={p.id} value={p.planKey}>{p.name}</option>
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
                                    <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">Target Department (Optional)</label>

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
                            <span className="text-[10px] font-black uppercase tracking-widest">* Required fields must be completed. Others are optional.</span>

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
