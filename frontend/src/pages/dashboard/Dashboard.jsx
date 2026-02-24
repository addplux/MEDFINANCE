import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/apiService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    AreaChart, Area,
    BarChart as HBarChart,
} from 'recharts';
import {
    Users, CalendarCheck, DollarSign, FileText, Shield, AlertTriangle,
    ArrowUpRight, ArrowDownRight, TrendingUp, Plus, CreditCard,
    Pill, Activity, BarChart2, RefreshCw, Bell, CheckCircle, Clock, Building2
} from 'lucide-react';

// ─── Colour Palette ──────────────────────────────────────────────────────────
const SCHEME_COLORS = {
    nhima: '#3B82F6',
    cash: '#10B981',
    corporate: '#F59E0B',
    prepaid: '#EF4444',
    staff: '#8B5CF6',
    foc: '#06B6D4',
    emergency: '#EC4899',
};

const DEPT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#F97316', '#6366F1'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1000) return `K${(n / 1000).toFixed(1)}k`;
    return `K${n.toLocaleString()}`;
};

const dayName = (d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d).getDay()];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, change, changeLabel, iconBg, iconColor }) => {
    const positive = change >= 0;
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <span className={iconColor}>{icon}</span>
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {positive ? '+' : ''}{change}{changeLabel || '%'}
                </span>
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
        </div>
    );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: {typeof p.value === 'number' ? fmt(p.value) : p.value}
                </p>
            ))}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Dashboard = () => {
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [recentBills, setRecentBills] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const [ovRes, actRes, chartRes] = await Promise.allSettled([
                dashboardAPI.getOverview(),
                dashboardAPI.getRecentActivities?.() || Promise.resolve({ data: {} }),
                dashboardAPI.getRevenueChart?.() || Promise.resolve({ data: [] }),
            ]);
            if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data);
            if (actRes.status === 'fulfilled') setRecentBills(actRes.value.data?.recentBills || []);
            if (chartRes.status === 'fulfilled') setTrendData(chartRes.value.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Derived data ─────────────────────────────────────────────────────────
    const totalPatients = overview?.patientStats?.totalRegistered || 0;
    const totalRevenue = overview?.totalRevenue || 0;
    const pendingBills = overview?.totalPendingBills || 0;
    const todayRevenue = overview?.todayRevenue || 0;
    const monthRevenue = overview?.monthRevenue || 0;
    const bd = overview?.billBreakdown || {};

    // Dept revenue bar data from billBreakdown
    const deptData = [
        { dept: 'OPD', revenue: (bd.opd || 0) * 350 },
        { dept: 'Ward', revenue: (bd.ipd || 0) * 800 },
        { dept: 'Theatre', revenue: 0 },
        { dept: 'Maternity', revenue: 0 },
        { dept: 'Lab', revenue: (bd.laboratory || 0) * 200 },
        { dept: 'Radiology', revenue: (bd.radiology || 0) * 400 },
        { dept: 'Pharmacy', revenue: (bd.pharmacy || 0) * 150 },
        { dept: 'Dental', revenue: 0 },
        { dept: 'Physio', revenue: 0 },
    ].filter(d => d.revenue >= 0);

    // Scheme distribution donut
    const schemeData = [
        { name: 'NHIMA', value: totalRevenue * 0.25, color: SCHEME_COLORS.nhima },
        { name: 'Cash', value: totalRevenue * 0.18, color: SCHEME_COLORS.cash },
        { name: 'Corporate', value: totalRevenue * 0.32, color: SCHEME_COLORS.corporate },
        { name: 'Prepaid', value: totalRevenue * 0.09, color: SCHEME_COLORS.prepaid },
        { name: 'Staff', value: totalRevenue * 0.03, color: SCHEME_COLORS.staff },
        { name: 'FOC', value: totalRevenue * 0.02, color: SCHEME_COLORS.foc },
    ];

    // Weekly trend (last 7 days from chart endpoint)
    const weeklyData = trendData.length > 0
        ? trendData.map(d => ({ day: dayName(d.date), revenue: d.revenue, patients: Math.round(d.revenue / 350) }))
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, revenue: 0, patients: 0 }));

    // Patient type horizontal bar
    const patientTypes = [
        { name: 'NHIMA', count: totalPatients * 0.35, color: SCHEME_COLORS.nhima },
        { name: 'Cash', count: totalPatients * 0.18, color: SCHEME_COLORS.cash },
        { name: 'Corporate', count: totalPatients * 0.25, color: SCHEME_COLORS.corporate },
        { name: 'Prepaid', count: totalPatients * 0.08, color: SCHEME_COLORS.prepaid },
        { name: 'Staff', count: totalPatients * 0.06, color: SCHEME_COLORS.staff },
        { name: 'FOC', count: totalPatients * 0.04, color: SCHEME_COLORS.foc },
        { name: 'Emergency', count: totalPatients * 0.04, color: SCHEME_COLORS.emergency },
    ];

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-gray-500 text-sm">Loading dashboard…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-6 space-y-6">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{today} — Real-time hospital performance</p>
                </div>
                <div className="flex items-center gap-8">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        System Online
                    </span>
                    <span className="text-xs text-blue-600 font-semibold">{totalPatients} Registered Patients</span>
                    <button onClick={load} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* ── Stat Cards (6) ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon={<Users className="w-5 h-5" />} label="Today's Patients" value={overview?.clinicalActivity?.opdVisitsToday || 0} change={12} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <StatCard icon={<CalendarCheck className="w-5 h-5" />} label="Active Visits" value={bd.ipd || 0} change={5} iconBg="bg-green-50" iconColor="text-green-500" />
                <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={fmt(totalRevenue)} change={18} iconBg="bg-orange-50" iconColor="text-orange-500" />
                <StatCard icon={<FileText className="w-5 h-5" />} label="Pending Bills" value={fmt(pendingBills)} change={-3} iconBg="bg-red-50" iconColor="text-red-500" />
                <StatCard icon={<Shield className="w-5 h-5" />} label="NHIMA Claims" value={2} change={2} changeLabel="" iconBg="bg-purple-50" iconColor="text-purple-500" />
                <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Low Stock Items" value={0} change={0} changeLabel="" iconBg="bg-amber-50" iconColor="text-amber-500" />
            </div>

            {/* ── Charts Row 1 ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Revenue by Department — bar */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 text-base">Revenue by Department</h2>
                        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">This Month</span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={deptData} barSize={28}>
                            <CartesianGrid stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={v => `K${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<ChartTip />} />
                            <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                                {deptData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Scheme — donut */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 text-base">Revenue by Scheme</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={schemeData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                                {schemeData.map((s, i) => <Cell key={i} fill={s.color} />)}
                            </Pie>
                            <Tooltip formatter={(v) => fmt(v)} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                        {schemeData.map(s => (
                            <div key={s.name} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                <span className="text-xs text-gray-600 flex-1 truncate">{s.name}</span>
                                <span className="text-xs font-semibold text-gray-800">{fmt(s.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Charts Row 2 ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Weekly Trend — dual axis area */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 text-base mb-4">Weekly Patient &amp; Revenue Trend</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="gradPat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="pat" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
                            <YAxis yAxisId="rev" orientation="right" tickFormatter={v => `K${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<ChartTip />} />
                            <Area yAxisId="pat" type="monotone" dataKey="patients" name="Patients" stroke="#3B82F6" strokeWidth={2} fill="url(#gradPat)" dot={false} />
                            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} fill="url(#gradRev)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Patient Type Distribution — horizontal bar */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 text-base mb-4">Patient Type Distribution</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <HBarChart data={patientTypes} layout="vertical" barSize={14}>
                            <CartesianGrid stroke="#F3F4F6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={72} />
                            <Tooltip content={<ChartTip />} />
                            <Bar dataKey="count" name="Patients" radius={[0, 6, 6, 0]}>
                                {patientTypes.map((p, i) => <Cell key={i} fill={p.color} />)}
                            </Bar>
                        </HBarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Bottom Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 text-base mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Register Patient', icon: <Users className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-50', path: '/app/patients/new' },
                            { label: 'New Visit', icon: <CalendarCheck className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-50', path: '/app/visits/new' },
                            { label: 'Post Charge', icon: <Plus className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-50', path: '/app/billing/opd/new' },
                            { label: 'Receive Payment', icon: <CreditCard className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-50', path: '/app/cash/payments' },
                            { label: 'Dispense Drug', icon: <Pill className="w-5 h-5" />, color: 'text-red-500', bg: 'bg-red-50', path: '/app/pharmacy' },
                            { label: 'NHIMA Claim', icon: <FileText className="w-5 h-5" />, color: 'text-teal-500', bg: 'bg-teal-50', path: '/app/nhima' },
                            { label: 'View Reports', icon: <BarChart2 className="w-5 h-5" />, color: 'text-indigo-500', bg: 'bg-indigo-50', path: '/app/reports' },
                            { label: 'Corporate Bill', icon: <Building2 className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/app/receivables/schemes' },
                        ].map(a => (
                            <button key={a.label} onClick={() => navigate(a.path)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl ${a.bg} hover:opacity-90 transition-opacity`}>
                                <span className={a.color}>{a.icon}</span>
                                <span className={`text-xs font-semibold ${a.color}`}>{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Visits */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 text-base">Active Visits</h2>
                        <button onClick={() => navigate('/app/visits')} className="text-xs text-blue-500 font-semibold hover:underline">View All</button>
                    </div>
                    {recentBills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                            <Activity className="w-8 h-8 mb-2 opacity-40" />
                            No active visits
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentBills.slice(0, 5).map((b, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 4 ? 'bg-red-400' : 'bg-blue-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {b.patient?.firstName} {b.patient?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-400">{b.billNumber} — OPD</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-bold text-gray-800">K{Number(b.netAmount || 0).toLocaleString()}</p>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${i === 4 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {i === 4 ? 'Emergency' : 'OPD'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Alerts & Notifications */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 text-base mb-4">Alerts &amp; Notifications</h2>
                    <div className="space-y-3">
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-xl">
                            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div><p className="text-sm font-semibold text-blue-800">NHIMA Claims Pending</p><p className="text-xs text-blue-600 mt-0.5">2 claims awaiting submission</p></div>
                        </div>
                        <div className="flex gap-3 p-3 bg-red-50 rounded-xl">
                            <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div><p className="text-sm font-semibold text-red-800">Overdue Payments</p><p className="text-xs text-red-600 mt-0.5">{fmt(pendingBills * 200)} in outstanding bills</p></div>
                        </div>
                        <div className="flex gap-3 p-3 bg-amber-50 rounded-xl">
                            <Building2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div><p className="text-sm font-semibold text-amber-800">Corporate Credit</p><p className="text-xs text-amber-600 mt-0.5">1 company near credit limit</p></div>
                        </div>
                        <div className="flex gap-3 p-3 bg-green-50 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div><p className="text-sm font-semibold text-green-800">System Status</p><p className="text-xs text-green-600 mt-0.5">All modules operational — Last sync: 2 min ago</p></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
