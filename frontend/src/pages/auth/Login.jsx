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
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden text-white">
            {/* Background Glow Effects - Suno Style */}
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] pointer-events-none animate-pulse delay-700" />

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Side-Branding */}
                <div className="hidden lg:block p-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 text-white/40 hover:text-white mb-12 transition-all font-bold uppercase tracking-widest text-xs group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </button>

                    <div className="flex items-center gap-5 mb-12">
                        <div className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40">
                            <Activity className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                                {orgName.split(' ')[0]}<span className="text-primary font-light">360</span>
                            </h1>
                            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">Medical Finance OS</p>
                        </div>
                    </div>

                    <h2 className="text-7xl font-black mb-10 text-white leading-[0.9] tracking-tighter uppercase">
                        NEXT GEN <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
                            CONTROL
                        </span>
                    </h2>
                    <p className="text-xl text-white/40 mb-16 max-w-md leading-relaxed font-medium tracking-tight">
                        Experience the absolute pinnacle of medical financial management. Precision. Speed. Power.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-center gap-5 group">
                            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                                <Activity className="w-7 h-7 text-primary" />
                            </div>
                            <span className="text-white font-bold uppercase tracking-widest text-sm">Real-time Analytics</span>
                        </div>
                        <div className="flex items-center gap-5 group">
                            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-500">
                                <Building className="w-7 h-7 text-accent" />
                            </div>
                            <span className="text-white font-bold uppercase tracking-widest text-sm">Enterprise Core</span>
                        </div>
                    </div>
                </div>

                {/* Right Side-Login Form (Suno Glass Panel) */}
                <div className="w-full">
                    <div className="glass-panel border-white/10 p-10 lg:p-16 relative overflow-hidden rounded-[3rem] bg-black/40 backdrop-blur-3xl shadow-[0_32px_120px_rgba(0,0,0,0.8)]">
                        <div className="lg:hidden mb-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl mb-6 shadow-2xl shadow-primary/40">
                                <Activity className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">{orgName.split(' ')[0]}</h1>
                        </div>

                        <h2 className="text-4xl font-black mb-3 text-white uppercase tracking-tighter">ACCESS</h2>
                        <p className="text-white/40 mb-12 font-medium tracking-tight uppercase tracking-widest text-xs">Initialize secure session</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl mb-10 flex items-start gap-4 animate-shake">
                                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-bold uppercase tracking-tight">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Institution Type</label>
                                <div className="relative group">
                                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-accent transition-colors" />
                                    <select
                                        name="hospitalType"
                                        value={formData.hospitalType}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-12 py-5 text-white focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all appearance-none font-bold text-sm tracking-tight"
                                        required
                                    >
                                        <option value="" className="bg-bg-primary text-white/40">Select Organization Type</option>
                                        <option value="Government" className="bg-bg-primary">Government Hospital</option>
                                        <option value="Mission / NGO" className="bg-bg-primary">Mission / NGO</option>
                                        <option value="Private Hospital" className="bg-bg-primary">Private Hospital</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Secure Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-sm tracking-tight"
                                        placeholder="user@system.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Passkey</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:bg-white/10 transition-all font-bold text-sm tracking-tight"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full bg-white text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden mt-6"
                            >
                                <span className="relative z-10">{loading ? 'Processing...' : 'INITIALIZE SYSTEM'}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity" />
                            </button>

                            <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pt-4">
                                Authentication Required | System V1.2.0
                            </p>
                        </form>
                    </div>

                    <div className="text-center mt-12 lg:hidden">
                        <button
                            onClick={() => navigate('/')}
                            className="text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-widest"
                        >
                            ← Back to Portal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
