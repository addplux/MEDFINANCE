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
            description: 'Track receivables, payables, NHIMA claims, and corporate accounts'
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
        <div className="min-h-screen bg-bg-primary overflow-x-hidden">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 mesh-gradient opacity-20 pointer-events-none" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border-color">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 font-serif tracking-tight">
                            MEDFINANCE360
                        </h1>
                    </div>
                    <div className="flex items-center gap-8">
                        <button className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hidden md:block px-2">
                            Features
                        </button>
                        <button className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hidden md:block px-2">
                            Pricing
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-primary"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 container mx-auto text-center z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-sm font-medium mb-8 animate-fade-in">
                    <Zap className="w-4 h-4 text-teal-600" />
                    Complete Medical Finance Management
                </div>

                <h2 className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-tight tracking-tight text-slate-900">
                    Streamline Your <br />
                    <span className="text-teal-600">
                        Medical Finance
                    </span>
                </h2>

                <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                    All-in-one platform for billing, accounting, budgeting, and financial reporting.
                    Built specifically for modern healthcare facilities.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary px-10 py-4 text-lg rounded-full shadow-xl shadow-slate-200 hover:-translate-y-1 transition-all duration-300"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="px-10 py-4 text-lg font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 group">
                        Watch Demo
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-slate-900 border-b-[5px] border-b-transparent ml-1" />
                        </div>
                    </button>
                </div>

                {/* Main Dashboard Preview (Mockup) */}
                {/* Main Hero Video (Animated) */}
                <div className="mt-16 relative mx-auto max-w-sm z-10">
                    <div className="relative animate-float">
                        <div className="absolute inset-0 bg-primary-500/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-auto"
                            >
                                <source src="/hero-video.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>

                {/* Stats */}

            </section>

            {/* Features Section */}
            <section className="container mx-auto px-6 py-24 relative z-10">
                <div className="text-center mb-20">
                    <h3 className="text-3xl md:text-5xl font-serif font-bold mb-6">
                        Everything You Need in One Platform
                    </h3>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                        Comprehensive modules designed to handle all aspects of medical finance management
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white p-5 md:p-8 rounded-2xl hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group border border-slate-100"
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-teal-600 group-hover:scale-110 transition-all duration-300">
                                {feature.icon}
                            </div>
                            <h4 className="text-xl font-bold mb-3 font-serif text-slate-900">{feature.title}</h4>
                            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modules Section */}
            <section className="py-24 relative z-10 overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-600/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-6 relative">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                            10 Powerful Modules
                        </h3>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Integrated modules that work seamlessly together
                        </p>
                    </div>

                    <div className="container mx-auto px-6 relative">
                        <div className="text-center mb-16">
                            <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                                Why Choose MEDFINANCE360?
                            </h3>
                            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                                Designed to modernize healthcare financial operations
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    title: 'Real-time Analytics',
                                    description: 'Track revenue, expenses, and cash flow instantly with live dashboards.',
                                    icon: <BarChart3 className="w-6 h-6 text-teal-600" />
                                },
                                {
                                    title: 'Bank-Grade Security',
                                    description: 'Your financial data is protected with enterprise-level encryption and role-based access.',
                                    icon: <Shield className="w-6 h-6 text-slate-600" />
                                },
                                {
                                    title: 'Automated Billing',
                                    description: 'Reduce errors and save time with automated invoice generation and claims processing.',
                                    icon: <Zap className="w-6 h-6 text-teal-500" />
                                },
                                {
                                    title: 'Seamless Integration',
                                    description: 'Connects effortlessly with existing hospital information systems and banking platforms.',
                                    icon: <Activity className="w-6 h-6 text-emerald-600" />
                                },
                                {
                                    title: 'Audit Ready',
                                    description: 'Maintain complete financial transparency with detailed audit trails for every transaction.',
                                    icon: <FileText className="w-6 h-6 text-rose-600" />
                                },
                                {
                                    title: 'Multi-User Support',
                                    description: 'Collaborate effectively with tailored roles for admins, accountants, and billing staff.',
                                    icon: <Users className="w-6 h-6 text-indigo-600" />
                                }
                            ].map((benefit, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {benefit.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold mb-2 font-serif text-slate-900">{benefit.title}</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-24 text-center relative z-10">
                <div className="bg-slate-900 max-w-4xl mx-auto p-12 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 text-white">
                        <h3 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                            Ready to Transform Your Finance?
                        </h3>
                        <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto font-light">
                            Join healthcare facilities across Zambia using MEDFINANCE360 to streamline operations.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn bg-white text-slate-900 hover:bg-slate-100 btn-lg rounded-full px-10 py-4 text-lg font-bold"
                        >
                            Get Started Today
                            <ArrowRight className="w-5 h-5" />
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
