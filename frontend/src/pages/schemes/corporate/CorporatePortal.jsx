import React, { useState, useEffect } from 'react';
import { corporatePortalAPI } from '../../services/apiService';
import { Building2, LogIn, DollarSign, Users, FileText, RefreshCw, LogOut, ChevronRight, Download } from 'lucide-react';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1000000) return `K${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `K${(n / 1000).toFixed(1)}k`;
    return `K${n.toLocaleString()}`;
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
    const [schemeCode, setSchemeCode] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await corporatePortalAPI.login({ schemeCode, pin });
            if (res.data?.success) {
                onLogin(res.data.token, res.data.scheme);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-4">
                        <Building2 className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Corporate Portal</h1>
                    <p className="text-slate-400 mt-2 text-sm">Sign in with your company scheme credentials</p>
                </div>

                {/* Card */}
                <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
                    {error && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Scheme Code</label>
                        <input
                            type="text"
                            value={schemeCode}
                            onChange={e => setSchemeCode(e.target.value.toUpperCase())}
                            placeholder="e.g. ZNCB-2024"
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 text-sm font-mono tracking-wider"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Portal PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            placeholder="Enter your 4–6 digit PIN"
                            required
                            maxLength={6}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-slate-500 text-xs mt-6">
                    Contact the hospital to receive your Scheme Code and Portal PIN.
                </p>
            </div>
        </div>
    );
};

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
const PortalDashboard = ({ token, scheme, onLogout }) => {
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const loadAccount = async () => {
        try {
            const res = await corporatePortalAPI.getAccount(token);
            if (res.data?.success) setAccount(res.data.account);
        } catch { }
    };

    const loadTransactions = async () => {
        setTxLoading(true);
        try {
            const params = {};
            if (dateFrom) params.startDate = dateFrom;
            if (dateTo) params.endDate = dateTo;
            const res = await corporatePortalAPI.getTransactions(token, params);
            if (res.data?.success) setTransactions(res.data.data);
        } catch { }
        finally { setTxLoading(false); }
    };

    useEffect(() => {
        Promise.all([loadAccount(), loadTransactions()]).finally(() => setLoading(false));
    }, []);

    const handleDownload = () => {
        const rows = [
            ['Date', 'Patient', 'Patient No.', 'Amount', 'Service', 'Status'],
            ...transactions.map(t => [
                new Date(t.createdAt).toLocaleDateString(),
                `${t.patient?.firstName} ${t.patient?.lastName}`,
                t.patient?.patientNumber || t.patient?.policyNumber || '',
                t.netAmount || t.totalAmount || 0,
                t.serviceName || 'General',
                t.status || 'pending'
            ])
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${scheme?.code || 'scheme'}-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    const usedPct = account ? Math.min(100, (account.usedCredit / account.creditLimit) * 100) : 0;
    const isLow = usedPct > 80;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Building2 className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">{scheme?.name || 'Corporate Account'}</h1>
                            <p className="text-slate-400 text-xs font-mono mt-0.5">{scheme?.code}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-sm transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                {/* Account Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                        { label: 'Credit Limit', value: fmt(account?.creditLimit), color: 'text-blue-400', icon: <DollarSign className="w-5 h-5" />, bg: 'bg-blue-500/10 border-blue-500/20' },
                        { label: 'Amount Used', value: fmt(account?.usedCredit), color: 'text-amber-400', icon: <FileText className="w-5 h-5" />, bg: 'bg-amber-500/10 border-amber-500/20' },
                        { label: 'Balance Remaining', value: fmt(account?.balance), color: isLow ? 'text-red-400' : 'text-emerald-400', icon: <DollarSign className="w-5 h-5" />, bg: isLow ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20' },
                    ].map((c, i) => (
                        <div key={i} className={`p-6 rounded-2xl border ${c.bg} bg-white/[0.02]`}>
                            <div className={`p-2 rounded-xl ${c.bg} w-fit mb-4`}>{React.cloneElement(c.icon, { className: `w-5 h-5 ${c.color}` })}</div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{c.label}</p>
                            <p className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* Credit Usage Bar */}
                {account && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Credit Utilisation</span>
                            <span className={`text-xs font-black ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>{usedPct.toFixed(1)}% used</span>
                        </div>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${usedPct}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Transactions */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <h2 className="text-sm font-bold text-white">Transaction History</h2>
                            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-slate-400">{transactions.length} records</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white" />
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white" />
                            <button onClick={loadTransactions} disabled={txLoading} className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                                <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? 'animate-spin' : ''}`} /> Filter
                            </button>
                            <button onClick={handleDownload} disabled={transactions.length === 0} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40">
                                <Download className="w-3.5 h-3.5" /> CSV
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest font-black text-slate-500">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Employee / Patient</th>
                                    <th className="px-6 py-4">Policy No.</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {txLoading ? (
                                    <tr><td colSpan={5} className="py-10 text-center"><RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" /></td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="py-10 text-center text-slate-500 text-sm">No transactions found for the selected period.</td></tr>
                                ) : transactions.map((t, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-white">{t.patient?.firstName} {t.patient?.lastName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">{t.patient?.policyNumber || t.patient?.patientNumber || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-white">{fmt(t.netAmount || t.totalAmount)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${t.status === 'paid' || t.status === 'settled' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                {t.status || 'pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Portal Entry ────────────────────────────────────────────────────────
const CorporatePortal = () => {
    const [token, setToken] = useState(() => sessionStorage.getItem('portal_token') || '');
    const [scheme, setScheme] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('portal_scheme') || 'null'); } catch { return null; }
    });

    const handleLogin = (t, s) => {
        sessionStorage.setItem('portal_token', t);
        sessionStorage.setItem('portal_scheme', JSON.stringify(s));
        setToken(t);
        setScheme(s);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('portal_token');
        sessionStorage.removeItem('portal_scheme');
        setToken('');
        setScheme(null);
    };

    if (!token) return <LoginScreen onLogin={handleLogin} />;
    return <PortalDashboard token={token} scheme={scheme} onLogout={handleLogout} />;
};

export default CorporatePortal;
