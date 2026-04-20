import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/apiService';
import {
    ArrowLeft, Save, User, AlertCircle,
    CircleCheckBig, BadgeCheck, ArrowRightLeft, Zap
} from 'lucide-react';

/**
 * PatientRegistration — External Identity Link Mode
 * 
 * Captures only the 4 fields this system needs (External system owns the rest):
 *   1. NRC *
 *   2. Man Number *
 *   3. First Name * + Last Name *
 *   4. Referral Type * (bypass → straight to Cashier | referral → Authorization first)
 */
const PatientRegistration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nrc: '',
        manNumber: '',
        firstName: '',
        lastName: '',
        referralType: '', // 'bypass' or 'referral'
        registryFee: '',
        patientCategory: 'regular' // 'regular' or 'staff'
    });
    const [errors, setErrors] = useState({});
    const [existingPatient, setExistingPatient] = useState(null);
    const [nrcLookupLoading, setNrcLookupLoading] = useState(false);

    // NRC auto-lookup — check if patient already exists in system
    useEffect(() => {
        if (!formData.nrc || formData.nrc.length < 5) {
            setExistingPatient(null);
            return;
        }
        const debounce = setTimeout(async () => {
            setNrcLookupLoading(true);
            try {
                const res = await patientAPI.getAll({ search: formData.nrc });
                const patients = res.data?.data || res.data || [];
                const match = patients.find(p => p.nrc === formData.nrc);
                if (match) {
                    setExistingPatient(match);
                    setFormData(prev => ({
                        ...prev,
                        firstName: match.firstName || prev.firstName,
                        lastName: match.lastName || prev.lastName,
                        manNumber: match.manNumber || prev.manNumber,
                    }));
                } else {
                    setExistingPatient(null);
                }
            } catch (err) {
                console.error('NRC lookup error:', err);
            } finally {
                setNrcLookupLoading(false);
            }
        }, 700);
        return () => clearTimeout(debounce);
    }, [formData.nrc]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.nrc.trim()) errs.nrc = 'NRC is required';
        if (!formData.manNumber.trim()) errs.manNumber = 'Man Number is required';
        if (!formData.firstName.trim()) errs.firstName = 'First name is required';
        if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
        if (!formData.referralType) errs.referralType = 'Please select Bypass or Referral';
        if (formData.referralType === 'bypass' && (!formData.registryFee || isNaN(formData.registryFee) || Number(formData.registryFee) <= 0)) {
            errs.registryFee = 'Registration fee is required for bypass patients';
        }
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        try {
            setLoading(true);
            const payload = {
                nrc: formData.nrc.trim(),
                manNumber: formData.manNumber.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                referralType: formData.referralType,
                registryFee: formData.referralType === 'bypass' ? Number(formData.registryFee) : 0,
                targetDepartment: null, // auto-routing is done by referralType
                paymentMethod: formData.patientCategory === 'staff' ? 'staff' : 
                               formData.patientCategory === 'prepaid' ? 'private_prepaid' : 'cash',
                costCategory: 'standard'
            };

            await patientAPI.create(payload);
            navigate('/app/records/dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
            alert(error.response?.data?.error || 'Failed to register patient');
        } finally {
            setLoading(false);
        }
    };

    const isBypass = formData.referralType === 'bypass';
    const isReferral = formData.referralType === 'referral';

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom duration-500">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        Patient Registration
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest font-black border border-blue-500/20">
                            RECORDS
                        </span>
                    </h1>
                    <p className="text-sm text-white/40 font-medium mt-1">
                        External System Link — enter the 4 required fields only
                    </p>
                </div>
            </div>

            {/* Existing patient banner */}
            {existingPatient && (
                <div className="card p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                        <p className="text-sm font-black text-white uppercase tracking-wider">Existing Patient Found</p>
                        <p className="text-xs text-amber-400/80">
                            {existingPatient.firstName} {existingPatient.lastName} — #{existingPatient.patientNumber}. Fields pre-filled.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Main card */}
                <div className="card p-8 border-white/5 space-y-8">

                    {/* ── Identification Fields ── */}
                    <section className="space-y-5">
                        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                            <User className="w-4 h-4 text-blue-400" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Identification</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* NRC */}
                            <div className="form-group">
                                <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-1">
                                    NRC <span className="text-red-400">*</span>
                                    {nrcLookupLoading && (
                                        <span className="ml-1 w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                                    )}
                                </label>
                                <input
                                    id="reg-nrc"
                                    type="text"
                                    value={formData.nrc}
                                    onChange={e => handleChange('nrc', e.target.value)}
                                    className={`form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl focus:ring-blue-500/50 ${errors.nrc ? 'border-red-500/50' : ''}`}
                                    placeholder="000000/00/0"
                                />
                                {errors.nrc && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">{errors.nrc}</p>}
                            </div>

                            {/* Man Number */}
                            <div className="form-group">
                                <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">
                                    Man Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="reg-man-number"
                                    type="text"
                                    value={formData.manNumber}
                                    onChange={e => handleChange('manNumber', e.target.value)}
                                    className={`form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl focus:ring-blue-500/50 ${errors.manNumber ? 'border-red-500/50' : ''}`}
                                    placeholder="Employee / Member Registration Number"
                                />
                                {errors.manNumber && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">{errors.manNumber}</p>}
                            </div>

                            {/* First Name */}
                            <div className="form-group">
                                <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">
                                    First Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="reg-first-name"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={e => handleChange('firstName', e.target.value)}
                                    className={`form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl focus:ring-blue-500/50 ${errors.firstName ? 'border-red-500/50' : ''}`}
                                    placeholder="Given name"
                                />
                                {errors.firstName && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">{errors.firstName}</p>}
                            </div>

                            {/* Last Name */}
                            <div className="form-group">
                                <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest">
                                    Surname <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="reg-last-name"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={e => handleChange('lastName', e.target.value)}
                                    className={`form-input bg-white/[0.02] border-white/10 text-white py-3 rounded-xl focus:ring-blue-500/50 ${errors.lastName ? 'border-red-500/50' : ''}`}
                                    placeholder="Family name"
                                />
                                {errors.lastName && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">{errors.lastName}</p>}
                            </div>

                            {/* Patient Category */}
                            <div className="form-group md:col-span-2">
                                <label className="form-label text-[10px] font-black uppercase text-white/40 tracking-widest mb-3 block">
                                    Patient Category <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleChange('patientCategory', 'regular')}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] ${
                                            formData.patientCategory === 'regular'
                                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                                                : 'bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20'
                                        }`}
                                    >
                                        <User className="w-4 h-4" />
                                        Regular (Cash)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('patientCategory', 'staff')}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] ${
                                            formData.patientCategory === 'staff'
                                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/10'
                                                : 'bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20'
                                        }`}
                                    >
                                        <BadgeCheck className="w-4 h-4" />
                                        Staff Member
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('patientCategory', 'prepaid')}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] ${
                                            formData.patientCategory === 'prepaid'
                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
                                                : 'bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20'
                                        }`}
                                    >
                                        <Zap className="w-4 h-4" />
                                        Private Prepaid
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Referral Type ── */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                            <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                Referral Type <span className="text-red-400">*</span>
                            </h2>
                        </div>

                        {errors.referralType && (
                            <p className="text-[10px] text-red-400 font-bold uppercase">{errors.referralType}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {/* Bypass */}
                            <button
                                id="reg-referral-bypass"
                                type="button"
                                onClick={() => handleChange('referralType', 'bypass')}
                                className={`relative p-5 rounded-2xl border-2 transition-all text-left group ${
                                    isBypass
                                        ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                                        : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className={`text-sm font-black uppercase tracking-wider mb-1 ${isBypass ? 'text-emerald-400' : 'text-white/60'}`}>
                                            Bypass
                                        </p>
                                        <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                                            Patient goes directly to Cashier
                                        </p>
                                    </div>
                                    {isBypass && (
                                        <CircleCheckBig className="w-5 h-5 text-emerald-400 shrink-0" />
                                    )}
                                </div>
                                <div className={`mt-3 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full inline-block ${
                                    isBypass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'
                                }`}>
                                    Records → Cashier
                                </div>
                            </button>

                            {/* Referral */}
                            <button
                                id="reg-referral-referral"
                                type="button"
                                onClick={() => handleChange('referralType', 'referral')}
                                className={`relative p-5 rounded-2xl border-2 transition-all text-left group ${
                                    isReferral
                                        ? 'bg-blue-500/10 border-blue-500/60 shadow-lg shadow-blue-500/10'
                                        : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className={`text-sm font-black uppercase tracking-wider mb-1 ${isReferral ? 'text-blue-400' : 'text-white/60'}`}>
                                            Referral
                                        </p>
                                        <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                                            Requires authorization first
                                        </p>
                                    </div>
                                    {isReferral && (
                                        <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" />
                                    )}
                                </div>
                                <div className={`mt-3 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full inline-block ${
                                    isReferral ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20'
                                }`}>
                                    Records → Authorization → Cashier
                                </div>
                            </button>
                        </div>

                        {/* Registration Fee for Bypass */}
                        {isBypass && (
                            <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl animate-in fade-in zoom-in duration-300">
                                <label className="form-label text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-2 mb-3">
                                    Registration Fee (Mandatory for Bypass) <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-black text-xs">ZK</span>
                                    <input
                                        id="reg-fee"
                                        type="number"
                                        value={formData.registryFee}
                                        onChange={e => handleChange('registryFee', e.target.value)}
                                        className={`form-input bg-white/[0.02] border-white/10 text-white py-4 pl-12 rounded-xl focus:ring-blue-500/50 text-lg font-black ${errors.registryFee ? 'border-red-500/50' : ''}`}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                {errors.registryFee && <p className="text-[10px] text-red-400 font-bold uppercase mt-2">{errors.registryFee}</p>}
                                <p className="text-[9px] text-white/40 mt-3 font-medium uppercase tracking-tight">
                                    Note: Services will be locked for this patient until this fee is paid to the cashier.
                                </p>
                            </div>
                        )}
                    </section>

                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-white/20">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            * All 4 fields are required
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/records/dashboard')}
                            className="px-6 py-3 text-white/40 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            id="reg-submit"
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/20 px-10 py-3 h-auto"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'REGISTERING...' : 'REGISTER PATIENT'}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default PatientRegistration;
