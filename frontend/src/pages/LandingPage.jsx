import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    DollarSign,
    FileText,
    TrendingUp,
    Shield,
    Zap,
    BarChart3,
    Users,
    ArrowRight
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Activity className="w-8 h-8" />,
            title: 'Complete Billing',
            description: 'OPD, IPD, Pharmacy, Laboratory, and Radiology billing in one system'
        },
        {
            icon: <DollarSign className="w-8 h-8" />,
            title: 'Financial Management',
            description: 'General Ledger, Cash & Bank, and comprehensive accounting'
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: 'Accounts Management',
            description: 'Track receivables, payables, scheme invoices, and corporate accounts'
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: 'Budgeting & Analytics',
            description: 'Department budgets, variance analysis, and profitability tracking'
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: 'Reports & BI',
            description: 'Revenue reports, cashflow analysis, and department profitability'
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: 'Secure & Compliant',
            description: 'Role-based access control and complete audit trail'
        }
    ];



    return (
        <div className="min-h-screen bg-bg-primary overflow-x-hidden text-white">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/30 blur-[120px] rounded-full animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 bg-black/40 backdrop-blur-2xl">
                <div className="container mx-auto px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                            MEDFINANCE<span className="text-primary font-light">360</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-10">
                        <button className="text-sm font-bold text-white/60 hover:text-white transition-all hidden md:block uppercase tracking-widest">
                            Features
                        </button>
                        <button className="text-sm font-bold text-white/60 hover:text-white transition-all hidden md:block uppercase tracking-widest">
                            Pricing
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="group relative px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Sign In
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 px-8 container mx-auto text-center z-10">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] mb-12 animate-fade-in shadow-2xl">
                    <Zap className="w-4 h-4 text-accent animate-pulse" />
                    Complete Medical Finance OS
                </div>

                <h2 className="text-6xl md:text-9xl font-black mb-10 leading-[0.9] tracking-tighter text-white animate-fade-in">
                    EVOLVE YOUR <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
                        FINANCE
                    </span>
                </h2>

                <p className="text-xl md:text-2xl text-white/40 mb-16 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
                    The next-generation platform for billing, analytics, and hospital growth.
                    Built for speed. Engineered for precision.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="group relative px-12 py-5 bg-gradient-to-r from-primary to-primary/80 text-white font-black uppercase tracking-widest text-lg rounded-[2rem] shadow-[0_20px_50px_rgba(255,0,204,0.3)] hover:-translate-y-1 transition-all duration-500"
                    >
                        Get Started
                    </button>
                    <button className="px-12 py-5 text-lg font-black text-white/60 hover:text-white transition-all flex items-center gap-3 group uppercase tracking-widest">
                        Watch Demo
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all shadow-xl">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                    </button>
                </div>

                {/* Main Dashboard Preview (Mockup) */}
                <div className="mt-24 relative mx-auto max-w-5xl z-10">
                    <div className="relative animate-float">
                        <div className="absolute inset-x-0 -top-20 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                        <div className="relative z-10 rounded-[2.5rem] p-3 bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden">
                            <div className="rounded-[2rem] overflow-hidden bg-black/40 aspect-[16/9] flex items-center justify-center border border-white/5">
                                <Activity className="w-20 h-20 text-white/10 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-8 py-32 relative z-10">
                <div className="text-left mb-24 max-w-4xl">
                    <h3 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter uppercase">
                        Core <span className="text-white/20">Modules</span>
                    </h3>
                    <p className="text-xl text-white/40 max-w-2xl font-medium tracking-tight">
                        Powering every department with military-grade precision and liquid-smooth interfaces.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-10 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,0,204,0.3)] transition-all duration-500">
                                {feature.icon}
                            </div>
                            <h4 className="text-2xl font-black mb-4 uppercase tracking-tight">{feature.title}</h4>
                            <p className="text-white/40 font-medium leading-relaxed tracking-tight group-hover:text-white/60 transition-colors">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-8 py-32 text-center relative z-10">
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent max-w-6xl mx-auto p-20 rounded-[3rem] relative overflow-hidden border border-white/5 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full" />

                    <div className="relative z-10">
                        <h3 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter uppercase leading-none">
                            READY TO <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent font-black">
                                UPGRADE?
                            </span>
                        </h3>
                        <p className="text-xl text-white/40 mb-16 max-w-xl mx-auto font-medium tracking-tight">
                            Join the elite healthcare facilities running on the future of medical finance.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="group relative px-16 py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-lg rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                        >
                            Get Started Today
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-black/40 relative z-10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-serif font-bold text-lg tracking-tight">MEDFINANCE360</span>
                        </div>
                        <div className="text-sm text-text-tertiary">
                            © 2026 MEDFINANCE360. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
