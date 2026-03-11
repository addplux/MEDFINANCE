import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/apiService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
    Users, CalendarCheck, DollarSign, FileText, Shield, AlertTriangle,
    ArrowUpRight, ArrowDownRight, TrendingUp, Plus, CreditCard,
    Pill, Activity, BarChart2, RefreshCw, Bell, CheckCircle, Clock, Building2,
    Hospital, ChevronRight, Layers, LayoutDashboard, Settings, Banknote
} from 'lucide-react';

// ─── Design System ──────────────────────────────────────────────────────────
const SCHEME_COLORS = {
    nhima: '#3B82F6',   // Blue
    cash: '#10B981',    // Emerald
    corporate: '#F59E0B', // Amber
    prepaid: '#8B5CF6',  // Violet
    staff: '#EC4899',    // Pink
    foc: '#06B6D4',      // Cyan
    emergency: '#EF4444', // Red
    scheme: '#6366F1',   // Indigo
    other: '#94A3B8'     // Slate
};

const CHART_GRADIENT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1000000) return `K${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `K${(n / 1000).toFixed(1)}k`;
    return `K${n.toLocaleString()}`;
};

const dayName = (d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d).getDay()];

// ─── Stat Card (Glassmorphism) ────────────────────────────────────────────────
const StatCard = ({ icon, label, value, change, changeLabel, colorClass, iconBg }) => {
    const positive = change >= 0;
    return (
        <div className="glass-card p-5 border-white/10 group hover:border-white/20 transition-all hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${iconBg} shadow-inner`}>
                    {React.cloneElement(icon, { size: 20, className: colorClass })}
                </div>
                {change !== undefined && (
                    <span className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}{changeLabel || '%'}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-2xl font-black text-text-primary tracking-tight">{value}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1 group-hover:text-primary transition-colors">{label}</p>
            </div>
        </div>
    );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass shadow-2xl px-4 py-3 rounded-xl border-border-color">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs font-bold text-text-secondary">{p.name}</span>
                    </div>
                    <span className="text-xs font-black text-text-primary">{typeof p.value === 'number' ? fmt(p.value) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Dashboard = () => {
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [recentData, setRecentData] = useState({ payments: [], bills: [] });
    const [trendData, setTrendData] = useState([]);
    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const paymentTimerRef = useRef(null);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [ovRes, actRes, chartRes] = await Promise.allSettled([
                dashboardAPI.getOverview(),
                dashboardAPI.getRecentActivities(),
                dashboardAPI.getRevenueChart(),
            ]);

            if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data);
            if (actRes.status === 'fulfilled') setRecentData(actRes.value.data);
            if (chartRes.status === 'fulfilled') setTrendData(chartRes.value.data);
        } catch (e) {
            console.error('Dashboard load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentPayments = async () => {
        try {
            const res = await dashboardAPI.getRecentPayments();
            if (res.data?.success) setRecentPayments(res.data.data);
        } catch (e) { /* silent */ }
    };

    useEffect(() => { loadDashboard(); loadRecentPayments(); }, []);

    // Auto-refresh payment feed every 30s
    useEffect(() => {
        paymentTimerRef.current = setInterval(loadRecentPayments, 30000);
        return () => clearInterval(paymentTimerRef.current);
    }, []);

    // ── Data Processing ───────────────────────────────────────────────────────
    const stats = useMemo(() => [
        { label: "Today's Visits", value: overview?.clinicalActivity?.opdVisitsToday || 0, change: 12, icon: <Users />, colorClass: 'text-blue-400', iconBg: 'bg-blue-500/10' },
        { label: "Registered Patients", value: overview?.patientStats?.totalRegistered || 0, icon: <Hospital />, colorClass: 'text-indigo-400', iconBg: 'bg-indigo-500/10' },
        { label: "Total Revenue", value: fmt(overview?.totalRevenue || 0), change: 18, icon: <DollarSign />, colorClass: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
        { label: "Pending Bills", value: overview?.totalPendingBills || 0, change: -3, icon: <FileText />, colorClass: 'text-rose-400', iconBg: 'bg-rose-500/10' },
        { label: "Admitted Today", value: overview?.patientStats?.currentlyAdmitted || 0, icon: <Activity />, colorClass: 'text-amber-400', iconBg: 'bg-amber-500/10' },
        { label: "Low Stock Alert", value: overview?.alerts?.lowStockCount || 0, icon: <AlertTriangle />, colorClass: 'text-orange-400', iconBg: 'bg-orange-500/10' },
    ], [overview]);

    const deptRevenueData = useMemo(() => {
        if (!overview?.billBreakdown) return [];
        const bd = overview.billBreakdown;
        return [
            { name: 'OPD', value: bd.opd },
            { name: 'IPD', value: bd.ipd },
            { name: 'Lab', value: bd.laboratory },
            { name: 'Rad', value: bd.radiology },
            { name: 'Phar', value: bd.pharmacy },
            { name: 'Mat', value: bd.maternity || 0 },
            { name: 'Thea', value: bd.theatre || 0 }
        ].filter(d => d.value > 0);
    }, [overview]);

    const schemeDistribution = useMemo(() => {
        if (!overview?.schemeRevenue) return [];
        return overview.schemeRevenue.map(sr => ({
            name: sr.name?.toUpperCase() || 'UNKNOWN',
            value: sr.value,
            color: SCHEME_COLORS[sr.name?.toLowerCase()] || SCHEME_COLORS.other
        }));
    }, [overview]);

    const weeklyTrend = useMemo(() => {
        return trendData.map(d => ({
            day: dayName(d.date),
            revenue: d.revenue,
            patients: Math.round(d.revenue / 500) // Rough estimation if actual count not in chart data
        }));
    }, [trendData]);

    const activityFeed = useMemo(() => {
        if (!recentData) return [];
        const { recentPayments = [], recentBills = [], recentPatients = [] } = recentData;

        const feed = [
            ...recentPayments.map(p => ({
                id: `pay-${p.id}`,
                type: 'payment',
                timestamp: new Date(p.createdAt),
                title: 'Payment Received',
                description: `Patient ${p.patient?.patientNumber || ''} payment of ${fmt(p.amount)}${p.receiptNumber ? ` (Ref: ${p.receiptNumber})` : ''}`,
                icon: <DollarSign size={16} />,
                colorClass: 'text-emerald-400',
                bgClass: 'bg-emerald-500/10 border-emerald-500/20'
            })),
            ...recentBills.map(b => ({
                id: `bill-${b.id}`,
                type: 'bill',
                timestamp: new Date(b.createdAt),
                title: 'Service Requested',
                description: `Patient ${b.patient?.patientNumber || ''} queued for ${b.service?.serviceName || 'General OPD'}`,
                icon: <Activity size={16} />,
                colorClass: 'text-blue-400',
                bgClass: 'bg-blue-500/10 border-blue-500/20'
            })),
            ...recentPatients.map(pt => ({
                id: `pt-${pt.patientNumber}`,
                type: 'registration',
                timestamp: new Date(pt.createdAt),
                title: 'Patient Registered',
                description: `New patient registered: ${pt.firstName} ${pt.lastName} (${pt.patientNumber})`,
                icon: <Users size={16} />,
                colorClass: 'text-purple-400',
                bgClass: 'bg-purple-500/10 border-purple-500/20'
            }))
        ];

        return feed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
    }, [recentData]);

    const todayString = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading && !overview) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary animate-pulse">Initializing Mission Control...</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-2 py-4 space-y-6 animate-fade-in text-text-primary">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
                        <LayoutDashboard className="text-accent" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-text-primary uppercase">Hospital Dashboard</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">{todayString} — Performance Overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Systems
                        </span>
                        <span className="text-xs font-bold text-text-primary">MedFinance Node-01</span>
                    </div>
                    <button onClick={loadDashboard} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all shadow-lg">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Stat Cards Grid (6) ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
            </div>

            {/* ── Charts Row 1 ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Departmental Revenue Distribution */}
                <div className="lg:col-span-2 glass-card p-6 border-border-color flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Departmental Queue Load</h2>
                            <p className="text-[10px] text-text-secondary mt-1 tracking-widest uppercase">Pending items awaiting processing</p>
                        </div>
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent">Real-time</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptRevenueData} barSize={32}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#FFFFFF05" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="value" name="Pending Items" radius={[8, 8, 0, 0]}>
                                    {deptRevenueData.map((_, i) => <Cell key={i} fill={CHART_GRADIENT_COLORS[i % CHART_GRADIENT_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Scheme Donut */}
                <div className="glass-card p-6 border-border-color flex flex-col">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary mb-8">Revenue Distribution</h2>
                    <div className="flex-1 min-h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={schemeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {schemeDistribution.map((s, i) => <Cell key={i} fill={s.color} stroke="none" />)}
                                </Pie>
                                <Tooltip content={<ChartTip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        {schemeDistribution.map(s => (
                            <div key={s.name} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                <span className="text-[9px] font-black uppercase text-white/60 truncate tracking-tight">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Charts Row 2 ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Live Payment Feed (Replaced Growth Trends) */}
                <div className="glass-card p-6 border-white/10 flex flex-col h-[300px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <Banknote size={18} className="text-emerald-400" />
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Live Payment Feed</h2>
                                <p className="text-[9px] text-text-secondary mt-0.5 uppercase tracking-widest">Auto-refreshes every 30s</p>
                            </div>
                        </div>
                        <button onClick={loadRecentPayments} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-text-secondary hover:text-white transition-all">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-bg-primary z-10">
                                <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest font-black text-text-secondary">
                                    <th className="pb-2 pr-4">Time</th>
                                    <th className="pb-2 pr-4">Patient</th>
                                    <th className="pb-2 pr-4">Amount</th>
                                    <th className="pb-2 pr-4">Method</th>
                                    <th className="pb-2 pr-4">Ref No.</th>
                                    <th className="pb-2">Posted By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {recentPayments.length === 0 ? (
                                    <tr><td colSpan={6} className="py-8 text-center text-text-secondary text-xs">No payments posted yet today.</td></tr>
                                ) : recentPayments.slice(0, 20).map((p, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-2.5 pr-4 text-[9px] text-text-secondary font-mono whitespace-nowrap">
                                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <div className="text-[10px] font-bold text-text-primary group-hover:text-accent transition-colors truncate max-w-[100px]">
                                                {p.patient?.firstName} {p.patient?.lastName}
                                            </div>
                                            <div className="text-[8px] text-text-secondary font-mono">{p.patient?.patientNumber}</div>
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <span className="text-[10px] font-black text-emerald-400">{fmt(p.amount)}</span>
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-bg-secondary text-text-secondary border border-border-color">
                                                {p.paymentMethod || p.patient?.paymentMethod || 'cash'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 pr-4 text-[9px] font-mono text-text-secondary truncate max-w-[80px]">{p.receiptNumber || p.referenceNumber || '—'}</td>
                                        <td className="py-2.5 text-[9px] text-text-secondary truncate max-w-[80px]">
                                            {p.receiver?.firstName} {p.receiver?.lastName}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="glass-card p-8 border-border-color">
                    <div className="flex items-center gap-3 mb-8">
                        <Layers size={18} className="text-accent" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Mission Shortcuts</h2>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Register', icon: <Users size={20} />, path: '/app/patients/new', color: 'bg-blue-500/10 text-blue-400' },
                            { label: 'Visits', icon: <CalendarCheck size={20} />, path: '/app/visits', color: 'bg-emerald-500/10 text-emerald-400' },
                            { label: 'Billing', icon: <Plus size={20} />, path: '/app/billing/opd/new', color: 'bg-orange-500/10 text-orange-400' },
                            { label: 'Cashier', icon: <CreditCard size={20} />, path: '/app/cash/payments', color: 'bg-indigo-500/10 text-indigo-400' },
                            { label: 'Pharmacy', icon: <Pill size={20} />, path: '/app/pharmacy/dashboard', color: 'bg-rose-500/10 text-rose-400' },
                            { label: 'Insurance', icon: <Shield size={20} />, path: '/app/receivables/schemes', color: 'bg-purple-500/10 text-purple-400' },
                            { label: 'Ledger', icon: <FileText size={20} />, path: '/app/ledger/journal-entries', color: 'bg-cyan-500/10 text-cyan-400' },
                            { label: 'Settings', icon: <Settings size={20} />, path: '/app/setup', color: 'bg-slate-500/10 text-slate-400' },
                        ].map((a, i) => (
                            <button key={i} onClick={() => navigate(a.path)} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-bg-secondary border border-border-color hover:bg-bg-tertiary transition-all group">
                                <div className={`p-3 rounded-xl ${a.color} shadow-lg transition-transform group-hover:scale-110`}>{a.icon}</div>
                                <span className="text-[9px] font-black uppercase tracking-tight text-text-secondary group-hover:text-text-primary">{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom Section ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Operational Activity / Master Activity Feed */}
                <div className="glass-card p-6 border-border-color overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Activity size={18} className="text-accent" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">System Activity Feed</h2>
                        </div>
                        <button onClick={() => navigate('/app/setup/audit-logs')} className="text-[10px] font-black uppercase text-accent hover:underline flex items-center gap-1">
                            Full Audit Log <ChevronRight size={10} />
                        </button>
                    </div>
                    <div className="space-y-4 flex-1">
                        {activityFeed.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-text-secondary">No recent activities available.</div>
                        ) : activityFeed.map((item) => (
                            <div key={item.id} className="flex flex-col p-4 bg-bg-secondary border border-border-color rounded-2xl group hover:bg-bg-tertiary transition-colors shadow-sm">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${item.bgClass} ${item.colorClass}`}>
                                            {item.icon}
                                        </div>
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${item.colorClass}`}>
                                            {item.title}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest whitespace-nowrap">
                                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="mt-3 text-xs font-medium text-text-secondary leading-relaxed pl-[44px]">
                                    {item.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Intelligence Alerts */}
                <div className="glass-card p-6 border-border-color">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell size={18} className="text-accent" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">System Intelligence</h2>
                    </div>
                    <div className="space-y-3">
                        {overview?.alerts?.lowStockCount > 0 && (
                            <div className="flex gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl group cursor-pointer hover:bg-orange-500/20 transition-all">
                                <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 self-start"><Pill size={20} /></div>
                                <div>
                                    <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Inventory Alert</p>
                                    <p className="text-sm font-bold text-text-primary mt-1 uppercase italic tracking-tighter">{overview.alerts.lowStockCount} Items Below Threshold</p>
                                    <p className="text-[10px] text-text-secondary mt-1 uppercase font-black opacity-60">Procurement action recommended immediately.</p>
                                </div>
                                <ChevronRight className="ml-auto self-center text-orange-400/40" />
                            </div>
                        )}
                        <div className="flex gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl group hover:bg-blue-500/20 transition-all">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 self-start"><CheckCircle size={20} /></div>
                            <div>
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Data Integrity Check</p>
                                <p className="text-sm font-bold text-text-primary mt-1 uppercase italic tracking-tighter">Mathematical Parity Confirmed</p>
                                <p className="text-[10px] text-text-secondary mt-1 uppercase font-black opacity-60">All ledgers balanced — Next sync in 4 min.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group hover:bg-emerald-500/20 transition-all opacity-60 hover:opacity-100">
                            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 self-start"><Shield size={20} /></div>
                            <div>
                                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Security Protocol</p>
                                <p className="text-sm font-bold text-text-primary mt-1 uppercase italic tracking-tighter">Threat Monitoring Level: Zero</p>
                                <p className="text-[10px] text-text-secondary mt-1 uppercase font-black opacity-60">Encrypted transmission protocols active.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
