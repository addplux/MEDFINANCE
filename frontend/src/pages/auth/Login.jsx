import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            navigate('/dashboard');
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side - Branding */}
                <div className="hidden lg:block p-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                            <Activity className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                MEDFINANCE360
                            </h1>
                            <p className="text-gray-400">Medical Finance Management</p>
                        </div>
                    </div>

                    <h2 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        Welcome Back
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 max-w-md leading-relaxed">
                        Sign in to access your medical finance dashboard and manage all your operations in one place.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                                <Activity className="w-5 h-5 text-primary-400" />
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors">Complete Billing System</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-accent-500/10 border border-accent-500/20 rounded-lg flex items-center justify-center group-hover:bg-accent-500/20 transition-colors">
                                <Activity className="w-5 h-5 text-accent-400" />
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors">Financial Management</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors">Advanced Reporting</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form (Glassmorphism) */}
                <div className="w-full">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        {/* Inner glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>

                        <div className="lg:hidden mb-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl mb-4 shadow-lg">
                                <Activity className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">MEDFINANCE360</h1>
                        </div>

                        <h2 className="text-2xl font-bold mb-2 text-white">Sign In</h2>
                        <p className="text-gray-400 mb-8">Enter your credentials to access your account</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all hover:bg-black/60"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-primary-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
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
