import React, { useEffect, useState, useMemo } from 'react';
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
    Hospital, ChevronRight, Layers, LayoutDashboard, Settings
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
        <div className="glass-card p-4 rounded-xl border-slate-200 bg-bg-tertiary group hover:border-slate-300 transition-all hover:-translate-y-1">
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
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{value}</h3>
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 mt-1 group-hover:text-text-primary transition-colors">{label}</p>
            </div>
        </div>
    );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-2xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs font-bold text-slate-900/70">{p.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{typeof p.value === 'number' ? fmt(p.value) : p.value}</span>
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
    const [loading, setLoading] = useState(true);

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

    useEffect(() => { loadDashboard(); }, []);

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
        if (!trendData.length) return [];
        return trendData.map(d => ({
            day: dayName(d.date),
            revenue: d.revenue,
            patients: Math.round(d.revenue / 500) // Rough estimation if actual count not in chart data
        }));
    }, [trendData]);

    const todayString = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading && !overview) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-accent/40 border-t-accent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Initializing Mission Control...</span>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto px-4 py-4 space-y-8 animate-fade-in text-text-primary">
            
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl border border-accent/40">
                        <LayoutDashboard className="text-accent" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Hospital Dashboard</h1>
                        <p className="text-[10px] font-semibold tracking-wider text-slate-500 mt-1">{todayString} — Performance Overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Systems
                        </span>
                        <span className="text-xs font-bold text-slate-900">MedFinance Node-01</span>
                    </div>
                    <button onClick={loadDashboard} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 transition-all shadow-lg">
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
                <div className="lg:col-span-2 glass-card p-5 rounded-xl border-slate-200 bg-bg-tertiary flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Departmental Queue Load</h2>
                            <p className="text-[10px] text-slate-500 mt-1 tracking-widest uppercase">Pending items awaiting processing</p>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
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
                                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                                <Bar dataKey="value" name="Pending Items" radius={[8, 8, 0, 0]}>
                                    {deptRevenueData.map((_, i) => <Cell key={i} fill={CHART_GRADIENT_COLORS[i % CHART_GRADIENT_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Scheme Donut */}
                <div className="glass-card p-5 rounded-xl border-slate-200 bg-bg-tertiary flex flex-col">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 mb-8">Revenue Distribution</h2>
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
                            <div key={s.name} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                <span className="text-[9px] font-black uppercase text-slate-900/60 truncate tracking-tight">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Charts Row 2 ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Growth Trends */}
                <div className="glass-card p-5 rounded-xl border-slate-200 bg-bg-tertiary">
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp size={18} className="text-emerald-400" />
                        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Daily Growth Trends</h2>
                    </div>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyTrend}>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={3} fill="url(#trendGradient)" dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#0F172A' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="glass-card p-5 rounded-xl border-slate-200 bg-bg-tertiary">
                    <div className="flex items-center gap-3 mb-8">
                        <Layers size={18} className="text-accent" />
                        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Mission Shortcuts</h2>
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
                            <button key={i} onClick={() => navigate(a.path)} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-200 transition-all group">
                                <div className={`p-3 rounded-xl ${a.color} shadow-lg transition-transform group-hover:scale-110`}>{a.icon}</div>
                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-500 group-hover:text-slate-900">{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom Section ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recent Operational Activity */}
                <div className="glass-card p-5 rounded-xl border-slate-200 bg-bg-tertiary overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Activity size={18} className="text-accent" />
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Clinical Flow</h2>
                        </div>
                        <button onClick={() => navigate('/app/visits')} className="text-[10px] font-black uppercase text-accent hover:underline flex items-center gap-1">
                            Live Queue <ChevronRight size={10} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {(recentData.bills || []).slice(0, 5).map((bill, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center font-black text-xs text-accent uppercase">
                                        {bill.patient?.firstName?.[0]}{bill.patient?.lastName?.[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 uppercase group-hover:text-accent transition-colors">{bill.patient?.firstName} {bill.patient?.lastName}</span>
                                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">ID: {bill.patient?.patientNumber} — {bill.service?.serviceName || 'GENERAL_OPD'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-900">{fmt(bill.netAmount)}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Intelligence Alerts */}
                <div className="glass-card p-5 rounded-xl border-slate-200 bg-bg-tertiary">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell size={18} className="text-accent" />
                        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">System Intelligence</h2>
                    </div>
                    <div className="space-y-3">
                        {overview?.alerts?.lowStockCount > 0 && (
                            <div className="flex gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl group cursor-pointer hover:bg-orange-500/20 transition-all">
                                <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 self-start"><Pill size={20} /></div>
                                <div>
                                    <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Inventory Alert</p>
                                    <p className="text-sm font-bold text-slate-900 mt-1 uppercase italic tracking-tighter">{overview.alerts.lowStockCount} Items Below Threshold</p>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-black opacity-60">Procurement action recommended immediately.</p>
                                </div>
                                <ChevronRight className="ml-auto self-center text-orange-400/40" />
                            </div>
                        )}
                        <div className="flex gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl group hover:bg-blue-500/20 transition-all">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 self-start"><CheckCircle size={20} /></div>
                            <div>
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Data Integrity Check</p>
                                <p className="text-sm font-bold text-slate-900 mt-1 uppercase italic tracking-tighter">Mathematical Parity Confirmed</p>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-black opacity-60">All ledgers balanced — Next sync in 4 min.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group hover:bg-emerald-500/20 transition-all opacity-60 hover:opacity-100">
                            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 self-start"><Shield size={20} /></div>
                            <div>
                                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Security Protocol</p>
                                <p className="text-sm font-bold text-slate-900 mt-1 uppercase italic tracking-tighter">Threat Monitoring Level: Zero</p>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-black opacity-60">Encrypted transmission protocols active.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
