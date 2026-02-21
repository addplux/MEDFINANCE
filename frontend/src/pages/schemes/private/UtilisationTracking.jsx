import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, TrendingUp, Users, DollarSign, Download,
    RefreshCw, Filter, AlertTriangle, CheckCircle, Search,
    ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import { utilisationAPI } from '../../../services/apiService';

const fmt = (n) => `ZK ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const UtilisationTracking = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [tierFilter, setTierFilter] = useState('all');

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await utilisationAPI.getReport();
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch utilisation report:', err);
            setError('Failed to load utilisation data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw size={40} className="animate-spin text-accent" />
                <p className="text-text-secondary animate-pulse">Generating real-time utilisation analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-12 text-center space-y-4">
                <AlertTriangle size={48} className="mx-auto text-red-500" />
                <h3 className="text-lg font-bold text-text-primary">{error}</h3>
                <button
                    onClick={fetchReport}
                    className="px-6 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent/80 transition-all"
                >
                    Retry
                </button>
            </div>
        );
    }

    const { summary, planBreakdown, memberBreakdown } = data || { summary: {}, planBreakdown: [], memberBreakdown: [] };

    // Filter member data
    const filteredMembers = memberBreakdown.filter(m => {
        const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.patientNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = tierFilter === 'all' || m.planName === tierFilter;
        return matchesSearch && matchesTier;
    });

    const columns = [
        {
            field: 'name',
            headerName: 'Member Name',
            flex: 1.5,
            renderCell: (params) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: params.row.planColor }}
                    >
                        {params.row.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <div className="font-bold text-text-primary text-sm">{params.value}</div>
                        <div className="text-[10px] text-text-secondary">{params.row.patientNumber}</div>
                    </div>
                </div>
            )
        },
        {
            field: 'planName',
            headerName: 'Plan Tier',
            flex: 1,
            renderCell: (params) => (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: params.row.planColor + '22', color: params.row.planColor }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'coverageLimit',
            headerName: 'Coverage Limit',
            flex: 1,
            valueFormatter: (params) => fmt(params.value)
        },
        {
            field: 'totalSpent',
            headerName: 'Amount Spent',
            flex: 1,
            renderCell: (params) => (
                <span className={`font-bold ${params.value > 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                    {fmt(params.value)}
                </span>
            )
        },
        {
            field: 'utilisationPercent',
            headerName: 'Utilisation',
            flex: 1.2,
            renderCell: (params) => {
                const pct = params.value;
                const color = pct > 90 ? '#ef4444' : (pct > 60 ? '#f59e0b' : '#10b981');
                return (
                    <div className="w-full space-y-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
                            <span className="text-text-secondary">Used</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-1000" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                        </div>
                    </div>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Risk Status',
            flex: 0.8,
            renderCell: (params) => (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${params.value === 'Exceeded' ? 'bg-red-500/10 text-red-400' :
                        (params.value === 'Critical' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400')
                    }`}>
                    {params.value}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Utilisation Tracking</h1>
                    <p className="text-sm text-text-secondary mt-1">Real-time benefit consumption analytics for Private Prepaid scheme</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="p-2 rounded-xl bg-surface border border-border hover:bg-white/5 text-text-secondary transition-all"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-white/5 transition-all">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Members', value: summary.totalMembers, icon: Users, color: '#6366f1', trend: '+12%', isPositive: true },
                    { label: 'Total Coverage Liability', value: fmt(summary.totalCoverage), icon: ShieldCheckIcon, color: '#0ea5e9', trend: 'Stable', isPositive: true },
                    { label: 'Total Claims/Spent', value: fmt(summary.totalSpent), icon: DollarSign, color: '#ef4444', trend: '+8.4%', isPositive: false },
                    { label: 'Overall Utilisation', value: `${summary.overallUtilisation.toFixed(1)}%`, icon: TrendingUp, color: '#10b981', trend: '+2.1%', isPositive: false },
                ].map(({ label, value, icon: Icon, color, trend, isPositive }) => (
                    <div key={label} className="glass-card p-5 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-2xl" style={{ background: color + '11' }}>
                                <Icon size={24} style={{ color }} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend === 'Stable' ? 'bg-white/5 text-text-secondary' : (isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')
                                }`}>
                                {trend === 'Stable' ? null : (isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                                {trend}
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-text-secondary font-medium">{label}</p>
                            <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-20" style={{ background: color }} />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Chart - Utilisation by Tier */}
                <div className="glass-card p-6 lg:col-span-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <Activity size={18} className="text-accent" />
                            Spend by Plan Tier
                        </h3>
                        <Info size={14} className="text-text-secondary cursor-help" />
                    </div>

                    <div className="space-y-6">
                        {planBreakdown.map(plan => (
                            <div key={plan.planId} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{plan.planName}</p>
                                        <p className="text-[10px] text-text-secondary">{plan.memberCount} active members</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-text-primary">{fmt(plan.totalSpent)}</p>
                                        <p className="text-[10px] text-text-secondary">utilised</p>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full relative transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${Math.min(100, plan.utilisationPercent)}%`,
                                            backgroundColor: plan.color,
                                            boxShadow: `0 0 15px ${plan.color}44`
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-text-secondary font-medium">
                                    <span>{plan.utilisationPercent.toFixed(1)}% Usage</span>
                                    <span>Goal: &lt; 70%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-accent/5 border border-accent/10 rounded-2xl">
                        <div className="flex gap-3">
                            <CheckCircle size={18} className="text-accent shrink-0" />
                            <p className="text-xs text-text-secondary leading-relaxed">
                                <span className="text-text-primary font-bold">Optimised Pool:</span> Based on current trends, your risk levels are healthy across all tiers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Member Audit List */}
                <div className="glass-card overflow-hidden lg:col-span-2 flex flex-col">
                    <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-text-primary">Member Spend Audit</h3>
                            <p className="text-xs text-text-secondary mt-0.5">Individual benefit consumption tracking</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search member..."
                                    className="pl-9 pr-4 py-2 text-xs bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent w-48"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-2 py-1">
                                <Filter size={14} className="text-text-secondary ml-1" />
                                <select
                                    value={tierFilter}
                                    onChange={e => setTierFilter(e.target.value)}
                                    className="bg-transparent border-none text-xs text-text-primary focus:outline-none pr-6"
                                >
                                    <option value="all">All Tiers</option>
                                    {planBreakdown.map(p => (
                                        <option key={p.planId} value={p.planName}>{p.planName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="h-[500px] w-full member-grid-container">
                        <DataGrid
                            rows={filteredMembers}
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[10, 20]}
                            disableSelectionOnClick
                            sx={{
                                border: 'none',
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                },
                                '& .MuiDataGrid-row': {
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)'
                                    }
                                },
                                '& .MuiDataGrid-cell': {
                                    borderBottom: 'none',
                                    padding: '12px'
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.01)'
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShieldCheckIcon = ({ size, style }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default UtilisationTracking;
