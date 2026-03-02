import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Calendar, Search, Filter, Save, RefreshCw,
    AlertCircle, CheckCircle, Clock, ArrowRight,
    TrendingUp, Shield, User
} from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import { patientAPI, prepaidPlanAPI } from '../../../services/apiService';

const StartEndDate = () => {
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const active = members.filter(m => m.planEndDate && new Date(m.planEndDate) >= now).length;
        const expired = members.filter(m => m.planEndDate && new Date(m.planEndDate) < now).length;
        const expiringSoon = members.filter(m => {
            if (!m.planEndDate) return false;
            const end = new Date(m.planEndDate);
            const daysLeft = (end - now) / (1000 * 60 * 60 * 24);
            return daysLeft > 0 && daysLeft <= 30;
        }).length;

        return { active, expired, expiringSoon, total: members.length };
    }, [members]);

    const showMessage = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 4000);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, mRes] = await Promise.all([
                prepaidPlanAPI.getAll(),
                patientAPI.getAll({ paymentMethod: 'private_prepaid', limit: 1000 })
            ]);
            setPlans(pRes.data || []);
            setMembers(mRes.data?.data || []);
        } catch (error) {
            console.error('Failed to load duration data:', error);
            showMessage('error', 'Failed to load member data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDateChange = async (id, field, value) => {
        try {
            await patientAPI.update(id, { [field]: value });
            setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
            showMessage('success', 'Date updated successfully.');
        } catch (error) {
            showMessage('error', 'Failed to update date.');
        }
    };

    const handleQuickRenew = async (member) => {
        setSaving(true);
        try {
            const now = new Date();
            const start = member.planEndDate && new Date(member.planEndDate) > now
                ? new Date(member.planEndDate)
                : now;

            const nextYear = new Date(start);
            nextYear.setFullYear(nextYear.getFullYear() + 1);

            const startDate = start.toISOString().split('T')[0];
            const endDate = nextYear.toISOString().split('T')[0];

            await patientAPI.update(member.id, {
                planStartDate: startDate,
                planEndDate: endDate
            });

            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, planStartDate: startDate, planEndDate: endDate } : m));
            showMessage('success', `Renewed ${member.firstName}'s plan for 1 year.`);
        } catch (error) {
            showMessage('error', 'Failed to renew plan.');
        } finally {
            setSaving(false);
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = (m.firstName + ' ' + m.lastName + ' ' + m.patientNumber).toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (statusFilter === 'all') return true;
        const now = new Date();
        const isExpired = m.planEndDate && new Date(m.planEndDate) < now;
        const isExpiring = m.planEndDate && (new Date(m.planEndDate) - now) / (1000 * 60 * 60 * 24) <= 30 && !isExpired;
        const isActive = !isExpired && !isExpiring;

        if (statusFilter === 'active') return isActive;
        if (statusFilter === 'expiring') return isExpiring;
        if (statusFilter === 'expired') return isExpired;
        return true;
    });

    const columns = [
        {
            field: 'member',
            headerName: 'Member',
            width: 250,
            renderCell: (params) => {
                const plan = plans.find(p => (p.planKey || '').toLowerCase() === (params.row.memberPlan || '').toLowerCase() || p.name.toLowerCase() === (params.row.memberPlan || '').toLowerCase());
                return (
                    <div className="flex items-center gap-3 py-2">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: plan?.color || '#64748b' }}
                        >
                            {params.row.firstName[0]}{params.row.lastName[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-text-primary truncate">{params.row.firstName} {params.row.lastName}</span>
                            <span className="text-[10px] text-text-secondary">{params.row.patientNumber}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            field: 'memberPlan',
            headerName: 'Plan Tier',
            width: 130,
            renderCell: (params) => {
                const plan = plans.find(p => (p.planKey || '').toLowerCase() === (params.row.memberPlan || '').toLowerCase() || p.name.toLowerCase() === (params.row.memberPlan || '').toLowerCase());
                return (
                    <span
                        className="text-[10px] px-2 py-1 rounded-full font-bold uppercase"
                        style={{ background: (plan?.color || '#64748b') + '22', color: plan?.color || '#64748b' }}
                    >
                        {params.value || 'No Plan'}
                    </span>
                );
            }
        },
        {
            field: 'planStartDate',
            headerName: 'Start Date',
            width: 150,
            renderCell: (params) => (
                <input
                    type="date"
                    className="bg-white/5 border border-border rounded-lg px-2 py-1 text-xs text-text-primary outline-none focus:border-accent w-full"
                    value={params.value || ''}
                    onChange={(e) => handleDateChange(params.row.id, 'planStartDate', e.target.value)}
                />
            )
        },
        {
            field: 'planEndDate',
            headerName: 'End Date',
            width: 150,
            renderCell: (params) => (
                <input
                    type="date"
                    className="bg-white/5 border border-border rounded-lg px-2 py-1 text-xs text-text-primary outline-none focus:border-accent w-full"
                    value={params.value || ''}
                    onChange={(e) => handleDateChange(params.row.id, 'planEndDate', e.target.value)}
                />
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
                const now = new Date();
                const end = params.row.planEndDate ? new Date(params.row.planEndDate) : null;
                if (!end) return <span className="text-[10px] text-text-secondary">Not Set</span>;

                const isExpired = end < now;
                const daysLeft = (end - now) / (1000 * 60 * 60 * 24);

                if (isExpired) return <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 capitalize bg-red-400/10 px-2 py-1 rounded-full"><AlertCircle size={12} /> Expired</span>;
                if (daysLeft <= 30) return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 capitalize bg-amber-400/10 px-2 py-1 rounded-full"><Clock size={12} /> Expiring</span>;
                return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 capitalize bg-emerald-400/10 px-2 py-1 rounded-full"><CheckCircle size={12} /> Active</span>;
            }
        },
        {
            field: 'utilization',
            headerName: 'Utilization',
            width: 150,
            renderCell: (params) => {
                const plan = plans.find(p => (p.planKey || '').toLowerCase() === (params.row.memberPlan || '').toLowerCase() || p.name.toLowerCase() === (params.row.memberPlan || '').toLowerCase());
                const spend = parseFloat(params.row.totalPlanSpend || 0);
                const limit = parseFloat(plan?.coverageLimit || 1);
                const pct = Math.min(100, (spend / limit) * 100);
                const color = pct > 90 ? '#ef4444' : (pct > 70 ? '#f59e0b' : (plan?.color || '#3b82f6'));

                return (
                    <div className="w-full space-y-1">
                        <div className="flex justify-between text-[10px] text-text-secondary">
                            <span>{pct.toFixed(0)}%</span>
                            <span>ZK {spend.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                    </div>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <button
                    onClick={() => handleQuickRenew(params.row)}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:text-white hover:bg-accent px-3 py-1.5 rounded-xl transition-all border border-accent/20"
                >
                    <RefreshCw size={12} className={saving ? 'animate-spin' : ''} />
                    Renew
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Plan Duration</h1>
                    <p className="text-sm text-text-secondary mt-1">Manage validity periods and monitor service utilization for prepaid members</p>
                </div>
                {alert && (
                    <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {alert.msg}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Members', value: stats.total, icon: User, color: '#3b82f6' },
                    { label: 'Active Plans', value: stats.active, icon: CheckCircle, color: '#10b981' },
                    { label: 'Expiring Soon', value: stats.expiringSoon, icon: Clock, color: '#f59e0b' },
                    { label: 'Expired', value: stats.expired, icon: AlertCircle, color: '#ef4444' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="glass-card p-4 flex items-center gap-4">
                        <div className="p-3 rounded-2xl" style={{ background: color + '15' }}>
                            <Icon size={20} style={{ color }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{label}</p>
                            <p className="text-xl font-bold text-text-primary">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-[#1A1A1A] p-3 rounded-2xl border border-[#2A2A2A]">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search members by name, ID or patient number..."
                        className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-color rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-bg-secondary border border-border-color rounded-xl">
                    {['all', 'active', 'expiring', 'expired'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${statusFilter === status ? 'bg-accent text-white shadow-lg' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <button
                    onClick={loadData}
                    className="p-2.5 bg-bg-secondary border border-border-color rounded-xl text-text-secondary hover:text-accent transition-all"
                    title="Refresh Data"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* DataGrid */}
            <div className="glass-card overflow-hidden" style={{ height: 600 }}>
                <DataGrid
                    rows={filteredMembers}
                    columns={columns}
                    loading={loading}
                    disableSelectionOnClick
                    rowHeight={70}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    sx={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        },
                        '& .MuiDataGrid-row.Mui-selected': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                        '& .MuiDataGrid-row.Mui-selected:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                        },
                        '& .MuiTablePagination-root': {
                            color: 'var(--text-secondary)',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-secondary)',
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default StartEndDate;
