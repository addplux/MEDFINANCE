import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services/apiService';
import {
    DollarSign,
    FileText,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

const Dashboard = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await dashboardAPI.getOverview();
            setOverview(response.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading dashboard...</div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Revenue',
            value: `K ${overview?.totalRevenue?.toLocaleString() || '0'}`,
            icon: <DollarSign className="w-6 h-6" />,
            color: 'from-primary-600 to-primary-500',
            bgColor: 'from-primary-50 to-primary-100'
        },
        {
            label: 'Pending Bills',
            value: overview?.totalPendingBills || '0',
            icon: <FileText className="w-6 h-6" />,
            color: 'from-accent-600 to-accent-500',
            bgColor: 'from-accent-50 to-accent-100'
        },
        {
            label: "Today's Revenue",
            value: `K ${overview?.todayRevenue?.toLocaleString() || '0'}`,
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'from-green-600 to-green-500',
            bgColor: 'from-green-50 to-green-100'
        },
        {
            label: "Month's Revenue",
            value: `K ${overview?.monthRevenue?.toLocaleString() || '0'}`,
            icon: <Activity className="w-6 h-6" />,
            color: 'from-blue-600 to-blue-500',
            bgColor: 'from-blue-50 to-blue-100'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-3 tracking-tight">Dashboard</h1>
                <p className="text-lg text-text-secondary">Welcome back. Here's your financial overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        {/* Mesh gradient background for the first item */}
                        {index === 0 && <div className="absolute inset-0 mesh-gradient opacity-20 group-hover:opacity-30 transition-opacity" />}

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className={`p-3 rounded-xl bg-bg-tertiary border border-border-color`}>
                                    <div className={`text-text-primary`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-success text-sm font-medium bg-success/10 px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>12%</span>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-text-primary mb-1 tracking-tight">{stat.value}</div>
                            <div className="text-sm text-text-secondary font-medium">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bill Breakdown */}
                {overview?.billBreakdown && (
                    <div className="lg:col-span-2 card">
                        <div className="card-header flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-text-primary">Pending Bills</h2>
                            <button className="text-sm text-primary-500 hover:text-primary-400 font-medium">View All</button>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {Object.entries(overview.billBreakdown).map(([key, value]) => (
                                    <div key={key} className="p-4 bg-bg-tertiary rounded-xl border border-border-color hover:border-border-hover transition-colors">
                                        <div className="text-2xl font-bold text-text-primary mb-1">{value}</div>
                                        <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">{key}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="card h-full">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-text-primary">Quick Actions</h2>
                    </div>
                    <div className="card-body">
                        <div className="space-y-3">
                            <button className="w-full btn btn-primary justify-between group">
                                <span>New Bill</span>
                                <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button className="w-full btn btn-secondary justify-between group">
                                <span>Receive Payment</span>
                                <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button className="w-full btn btn-secondary justify-between group">
                                <span>New Patient</span>
                                <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button className="w-full btn btn-secondary justify-between group">
                                <span>View Reports</span>
                                <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
