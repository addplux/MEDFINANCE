import React, { useState, useEffect, useCallback } from 'react';
import { systemLogsAPI, auditLogsAPI } from '../../services/apiService';
import {
    Terminal, Trash2, RefreshCw, AlertTriangle, AlertCircle,
    Info, CheckCircle2, ClipboardList, Search, ChevronLeft, ChevronRight,
    User, Clock, Database, Shield
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                             */
/* ─────────────────────────────────────────────────────────────────── */
const fmt = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const actionColor = (action) => {
    switch ((action || '').toUpperCase()) {
        case 'CREATE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'UPDATE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'DELETE': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'LOGIN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'LOGOUT': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        default: return 'bg-white/5 text-white/50 border-white/10';
    }
};

const levelBadge = (level) => {
    switch (level?.toLowerCase()) {
        case 'error': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'warn':
        case 'warning': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'info': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        default: return 'bg-white/5 text-white/40 border-white/10';
    }
};

const levelIcon = (level) => {
    switch (level?.toLowerCase()) {
        case 'error': return <AlertCircle className="w-3.5 h-3.5" />;
        case 'warn':
        case 'warning': return <AlertTriangle className="w-3.5 h-3.5" />;
        case 'info': return <Info className="w-3.5 h-3.5" />;
        default: return <AlertCircle className="w-3.5 h-3.5 text-white/30" />;
    }
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Audit Trail Tab                                                     */
/* ─────────────────────────────────────────────────────────────────── */
const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [tableFilter, setTableFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (actionFilter) params.action = actionFilter;
            if (tableFilter) params.tableName = tableFilter;
            const res = await auditLogsAPI.getAll(params);
            const d = res.data;
            setLogs(d.data || d.rows || []);
            setTotal(d.total || d.count || 0);
            setTotalPages(d.totalPages || Math.ceil((d.total || d.count || 0) / 20) || 1);
        } catch (e) {
            console.error('Audit log fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter, tableFilter]);

    useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

    const filtered = logs.filter(l =>
        !search ||
        l.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        l.tableName?.toLowerCase().includes(search.toLowerCase()) ||
        l.recordId?.toString().includes(search) ||
        l.action?.toLowerCase().includes(search.toLowerCase())
    );

    // Unique table names for filter dropdown
    const tables = [...new Set(logs.map(l => l.tableName).filter(Boolean))];

    return (
        <div className="space-y-4">
            {/* Filters row */}
            <div className="card p-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search user, table, record ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                    />
                </div>
                <select
                    value={actionFilter}
                    onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                    className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                    <option value="">All Actions</option>
                    {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'].map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
                <select
                    value={tableFilter}
                    onChange={e => { setTableFilter(e.target.value); setPage(1); }}
                    className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                    <option value="">All Tables</option>
                    {tables.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={fetchAuditLogs} disabled={loading} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <span className="ml-auto text-xs text-white/30">{total.toLocaleString()} records</span>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary text-sm">Loading audit trail...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/40 text-sm">No audit entries found.</p>
                        <p className="text-white/20 text-xs mt-1">User actions (create, update, delete) will appear here automatically.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/5 text-[9px] uppercase tracking-widest text-text-secondary">
                                <tr>
                                    <th className="px-5 py-4">Timestamp</th>
                                    <th className="px-5 py-4">User</th>
                                    <th className="px-5 py-4">Action</th>
                                    <th className="px-5 py-4">Table</th>
                                    <th className="px-5 py-4">Record ID</th>
                                    <th className="px-5 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filtered.map(log => (
                                    <tr key={log.id} className="hover:bg-white/[0.025] transition-colors">
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                <Clock className="w-3 h-3 opacity-50" />
                                                {fmt(log.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] font-black text-primary">
                                                    {log.user ? `${log.user.firstName?.[0]}${log.user.lastName?.[0]}` : '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white leading-none">
                                                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : `User #${log.userId}`}
                                                    </div>
                                                    <div className="text-[10px] text-text-secondary mt-0.5">{log.user?.role || log.user?.email || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${actionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 text-sm text-white/70">
                                                <Database className="w-3.5 h-3.5 text-white/20" />
                                                <span className="font-mono text-xs">{log.tableName || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">
                                            {log.recordId || '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-text-secondary max-w-xs truncate">
                                            {log.details ? (
                                                typeof log.details === 'object'
                                                    ? JSON.stringify(log.details).slice(0, 80) + (JSON.stringify(log.details).length > 80 ? '…' : '')
                                                    : String(log.details).slice(0, 80)
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                        <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-20 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-20 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────── */
/*  System Errors Tab (original)                                        */
/* ─────────────────────────────────────────────────────────────────── */
const SystemErrors = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wiping, setWiping] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await systemLogsAPI.getAll();
            if (res.data?.success) setLogs(res.data.data);
        } catch { /* no-op */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleWipe = async () => {
        if (!window.confirm('Wipe ALL system error logs? This cannot be undone.')) return;
        setWiping(true);
        try { await systemLogsAPI.wipe(); setLogs([]); } catch { alert('Failed to wipe logs.'); }
        finally { setWiping(false); }
    };

    const handleToggle = async (id) => {
        try {
            const res = await systemLogsAPI.resolve(id);
            if (res.data?.success) setLogs(l => l.map(x => x.id === id ? { ...x, resolved: res.data.data.resolved } : x));
        } catch { /* no-op */ }
    };

    const filtered = logs.filter(log => {
        if (filter !== 'all' && log.level?.toLowerCase() !== filter) return false;
        if (searchTerm && !log.message?.toLowerCase().includes(searchTerm.toLowerCase()) && !log.route?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-3 items-center">
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 py-2 text-sm">
                        <option value="all">All Levels</option>
                        <option value="error">Errors Only</option>
                        <option value="warning">Warnings Only</option>
                        <option value="info">Info Only</option>
                    </select>
                    <input type="text" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm placeholder:text-white/20 focus:outline-none w-56" />
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} disabled={loading} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleWipe} disabled={wiping || logs.length === 0}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors disabled:opacity-30">
                        {wiping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Wipe All
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="p-10 text-center text-text-secondary text-sm">Loading system logs...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-base font-semibold text-white mb-1">System is Healthy</h3>
                        <p className="text-text-secondary text-sm">No errors or exceptions found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/5 text-[9px] uppercase tracking-widest text-text-secondary">
                                <tr>
                                    <th className="px-5 py-4">Timestamp</th>
                                    <th className="px-5 py-4">Level</th>
                                    <th className="px-5 py-4">Message</th>
                                    <th className="px-5 py-4">Route</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filtered.map(log => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-text-secondary">{fmt(log.createdAt)}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 w-fit ${levelBadge(log.level)}`}>
                                                {levelIcon(log.level)} {log.level}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-white font-mono max-w-sm truncate">{log.message}</td>
                                        <td className="px-5 py-3.5 text-xs text-text-secondary font-mono">
                                            {log.method && <span className="text-blue-400 mr-1">{log.method}</span>}
                                            {log.route || '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs">
                                            {log.resolved
                                                ? <span className="text-emerald-400 flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Resolved</span>
                                                : <span className="text-amber-400 font-semibold">Pending</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button onClick={() => handleToggle(log.id)}
                                                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${log.resolved ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                                {log.resolved ? 'Reopen' : 'Resolve'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Main Component                                                      */
/* ─────────────────────────────────────────────────────────────────── */
const SystemLogs = () => {
    const [tab, setTab] = useState('audit');

    const tabs = [
        { id: 'audit', label: 'Audit Trail', icon: <ClipboardList className="w-4 h-4" />, desc: 'All user actions — creates, updates, deletes, logins' },
        { id: 'errors', label: 'System Errors', icon: <Terminal className="w-4 h-4" />, desc: 'Backend exceptions and error logs' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">System Logs</h1>
                    <p className="text-sm text-text-secondary mt-0.5">Audit trail and system error monitoring</p>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id
                                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(255,0,204,0.15)]'
                                : 'text-white/40 hover:text-white'
                            }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'audit' ? <AuditTrail /> : <SystemErrors />}
        </div>
    );
};

export default SystemLogs;
