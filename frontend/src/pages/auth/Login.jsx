import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/apiService';
import { Activity, Mail, Lock, AlertCircle, ArrowLeft, Building, ChevronDown } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        hospitalType: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [orgName, setOrgName] = useState('MEDFINANCE360');

    React.useEffect(() => {
        const fetchOrgInfo = async () => {
            try {
                const response = await authAPI.getPublicOrgInfo();
                if (response.data && response.data.name) {
                    setOrgName(response.data.name);
                }
            } catch (error) {
                console.error('Failed to fetch org info', error);
            }
        };
        fetchOrgInfo();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData);

        if (result.success) {
            navigate('/app');
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow Effects - Subtle Slate/Teal */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side-Branding */}
                <div className="hidden lg:block p-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                            <Activity className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {orgName}
                            </h1>
                            <p className="text-slate-500 font-medium">Medical Finance Management</p>
                        </div>
                    </div>

                    <h2 className="text-6xl font-serif font-bold mb-8 text-slate-900 leading-tight">
                        Professional <br />
                        Financial Care
                    </h2>
                    <p className="text-xl text-slate-600 mb-12 max-w-md leading-relaxed font-light">
                        The ultimate platform for modern healthcare facilities to manage billing, accounting, and operations.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                                <Activity className="w-6 h-6 text-teal-600" />
                            </div>
                            <span className="text-slate-700 font-medium font-serif text-lg">Clinical Precision</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                                <Building className="w-6 h-6 text-slate-600" />
                            </div>
                            <span className="text-slate-700 font-medium font-serif text-lg">Enterprise Ready</span>
                        </div>
                    </div>
                </div>

                {/* Right Side-Login Form (Glassmorphism) */}
                <div className="w-full">
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 lg:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                        <div className="lg:hidden mb-10 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl mb-4 shadow-lg">
                                <Activity className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">{orgName}</h1>
                        </div>

                        <h2 className="text-3xl font-bold mb-2 text-slate-900 font-serif">Sign In</h2>
                        <p className="text-slate-500 mb-10">Enter your credentials to access the system</p>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-8 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {/* Hospital Type Selection */}
                            {/* Institution Type Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Institution Type</label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    <select
                                        name="hospitalType"
                                        value={formData.hospitalType}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-10 py-3.5 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-slate-100 appearance-none font-medium"
                                        required
                                    >
                                        <option value="" className="text-slate-400">Select Organization Type</option>
                                        <option value="Government">Government Hospital</option>
                                        <option value="Mission / NGO">Mission / NGO</option>
                                        <option value="Private Hospital">Private Hospital</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-slate-100 font-medium"
                                        placeholder="you@hospital.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-slate-100 font-medium"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] mt-4"
                            >
                                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                            </button>

                            <p className="text-center text-sm text-slate-500 pt-2">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/register')}
                                    className="text-teal-600 hover:text-teal-700 font-bold transition-colors"
                                >
                                    Contact Administration
                                </button>
                            </p>
                        </form>
                    </div>

                    <div className="text-center mt-6 lg:hidden">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
