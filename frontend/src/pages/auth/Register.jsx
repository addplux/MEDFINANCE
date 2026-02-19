import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/apiService';
import {
    Activity, Mail, Lock, User, Building, ArrowLeft,
    CheckCircle, AlertCircle, Eye, EyeOff, ChevronDown
} from 'lucide-react';

const DEPARTMENTS = [
    'Administration',
    'Finance & Accounts',
    'Billing Department',
    'Outpatient Department (OPD)',
    'Inpatient Department (IPD)',
    'Pharmacy',
    'Laboratory',
    'Radiology',
    'Theatre',
    'Maternity',
    'Human Resources',
    'IT Department',
    'Other'
];

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authAPI.register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                department: formData.department
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-md text-center">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-10 shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Registration Submitted!</h2>
                        <p className="text-gray-400 mb-2">
                            Your account request has been sent to the administrator for review.
                        </p>
                        <p className="text-gray-500 text-sm mb-8">
                            You will be able to log in once your account has been approved. Please contact your administrator if you need urgent access.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-semibold py-3 rounded-lg transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side — Branding */}
                <div className="hidden lg:block p-8">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </button>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                            <Activity className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">MEDFINANCE360</h1>
                            <p className="text-gray-400">Medical Finance Management</p>
                        </div>
                    </div>

                    <h2 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        Request Access
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 max-w-md leading-relaxed">
                        Fill in your details below to request an account. An administrator will review and approve your request before you can log in.
                    </p>

                    <div className="space-y-4 p-5 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-sm font-medium text-gray-300 mb-3">What happens next?</p>
                        {['Your request is sent to the admin', 'Admin reviews and approves your account', 'You receive access to log in'].map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-primary-400 font-bold">{i + 1}</span>
                                </div>
                                <span className="text-gray-400 text-sm">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side — Form */}
                <div className="w-full">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

                        {/* Mobile logo */}
                        <div className="lg:hidden mb-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl mb-3 shadow-lg">
                                <Activity className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white">MEDFINANCE360</h1>
                        </div>

                        <h2 className="text-2xl font-bold mb-1 text-white">Create Account</h2>
                        <p className="text-gray-400 mb-6 text-sm">Request access to MEDFINANCE360</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg mb-5 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            {/* Name row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-400">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-400">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60"
                                            placeholder="Mwansa"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60"
                                        placeholder="you@hospital.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Department */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Department / Role</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60 appearance-none"
                                    >
                                        <option value="" className="bg-gray-900 text-gray-400">Select Department</option>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d} value={d} className="bg-gray-900">{d}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-10 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60"
                                        placeholder="Min. 6 characters"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-10 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60"
                                        placeholder="Repeat password"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-primary-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? 'Submitting Request...' : 'Submit Registration'}
                            </button>

                            <p className="text-center text-sm text-gray-500">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                >
                                    Sign In
                                </button>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
