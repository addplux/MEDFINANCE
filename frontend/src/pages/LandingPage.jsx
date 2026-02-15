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
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent font-serif tracking-tight">
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900/30 border border-primary-500/30 text-primary-300 rounded-full text-sm font-medium mb-8 animate-fade-in shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                    <Zap className="w-4 h-4" />
                    Complete Medical Finance Management
                </div>

                <h2 className="text-5xl md:text-6xl font-serif font-bold mb-8 leading-tight tracking-tight">
                    Streamline Your <br />
                    <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                        Medical Finance
                    </span>
                </h2>

                <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                    All-in-one platform for billing, accounting, budgeting, and financial reporting.
                    Built specifically for healthcare facilities in Zambia.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary px-8 py-4 text-base rounded-full shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1 transition-all duration-300"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="px-8 py-4 text-base font-medium text-text-primary hover:text-white transition-colors flex items-center gap-2 group">
                        Watch Demo
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
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
                            className="glass p-8 rounded-2xl hover:bg-white/5 transition-all duration-300 group border border-white/5 hover:border-primary-500/30"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center mb-6 text-primary-400 group-hover:scale-110 group-hover:text-primary-300 transition-all duration-300">
                                {feature.icon}
                            </div>
                            <h4 className="text-xl font-bold mb-3 font-serif">{feature.title}</h4>
                            <p className="text-text-secondary leading-relaxed">{feature.description}</p>
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
                                    icon: <BarChart3 className="w-6 h-6 text-accent-400" />
                                },
                                {
                                    title: 'Bank-Grade Security',
                                    description: 'Your financial data is protected with enterprise-level encryption and role-based access.',
                                    icon: <Shield className="w-6 h-6 text-primary-400" />
                                },
                                {
                                    title: 'Automated Billing',
                                    description: 'Reduce errors and save time with automated invoice generation and claims processing.',
                                    icon: <Zap className="w-6 h-6 text-yellow-400" />
                                },
                                {
                                    title: 'Seamless Integration',
                                    description: 'Connects effortlessly with existing hospital information systems and banking platforms.',
                                    icon: <Activity className="w-6 h-6 text-emerald-400" />
                                },
                                {
                                    title: 'Audit Ready',
                                    description: 'Maintain complete financial transparency with detailed audit trails for every transaction.',
                                    icon: <FileText className="w-6 h-6 text-rose-400" />
                                },
                                {
                                    title: 'Multi-User Support',
                                    description: 'Collaborate effectively with tailored roles for admins, accountants, and billing staff.',
                                    icon: <Users className="w-6 h-6 text-indigo-400" />
                                }
                            ].map((benefit, index) => (
                                <div
                                    key={index}
                                    className="glass p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {benefit.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold mb-2 font-serif text-white">{benefit.title}</h4>
                                            <p className="text-sm text-text-secondary leading-relaxed">
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
                <div className="glass-panel max-w-4xl mx-auto p-12 rounded-3xl border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 mesh-gradient opacity-30" />
                    <div className="relative z-10">
                        <h3 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                            Ready to Transform Your Finance?
                        </h3>
                        <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                            Join healthcare facilities across Zambia using MEDFINANCE360 to streamline operations.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-primary btn-lg rounded-full px-10 py-4 text-lg shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40"
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
