import React, { useState, useEffect } from 'react';
import { systemLogsAPI } from '../../services/apiService';
import { Terminal, Trash2, RefreshCw, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [wiping, setWiping] = useState(false);
    const [filter, setFilter] = useState('all'); // all, error, warning, info
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await systemLogsAPI.getAll();
            if (response.data?.success) {
                setLogs(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch system logs:', err);
            setError('Failed to load system logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleWipeLogs = async () => {
        if (!window.confirm('Are you certain you want to WIPE ALL system logs? This action cannot be undone.')) return;

        try {
            setWiping(true);
            await systemLogsAPI.wipe();
            setLogs([]);
        } catch (err) {
            console.error('Failed to wipe logs', err);
            alert('Failed to wipe logs');
        } finally {
            setWiping(false);
        }
    };

    const handleToggleResolve = async (id) => {
        try {
            const response = await systemLogsAPI.resolve(id);
            if (response.data?.success) {
                setLogs(logs.map(log => log.id === id ? { ...log, resolved: response.data.data.resolved } : log));
            }
        } catch (err) {
            console.error('Failed to toggle resolve status', err);
        }
    };

    const getLevelIcon = (level) => {
        switch (level?.toLowerCase()) {
            case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
            case 'warn':
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'info': return <Info className="w-4 h-4 text-blue-400" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getLevelBadge = (level) => {
        switch (level?.toLowerCase()) {
            case 'error': return 'bg-red-500/10 text-red-500 border border-red-500/20';
            case 'warn':
            case 'warning': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
            case 'info': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter !== 'all' && log.level?.toLowerCase() !== filter) return false;
        if (searchTerm && !log.message?.toLowerCase().includes(searchTerm.toLowerCase()) && !log.route?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header section matching provided aesthetic */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50/10 border border-red-500/20 flex items-center justify-center">
                        <Terminal className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
                        <p className="text-sm text-text-secondary mt-1">Monitor and debug user-facing errors and system exceptions.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLogs}
                        className="btn btn-secondary flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleWipeLogs}
                        className="btn bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                        disabled={wiping || logs.length === 0}
                    >
                        {wiping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Wipe All Logs
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="form-input bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="all">All Levels</option>
                            <option value="error">Errors Only</option>
                            <option value="warning">Warnings Only</option>
                            <option value="info">Info Only</option>
                        </select>
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input w-64 bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm placeholder:text-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Log List */}
            <div className="card overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">Loading system logs...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-400">{error}</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">System is Healthy</h3>
                        <p className="text-text-secondary text-sm">No errors or exceptions found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10 text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Message</th>
                                    <th className="px-6 py-4">Route</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 w-fit ${getLevelBadge(log.level)}`}>
                                                {getLevelIcon(log.level)}
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white max-w-md truncate font-mono text-xs">
                                            {log.message}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">
                                            {log.method ? <span className="text-blue-400 mr-2">{log.method}</span> : null}
                                            {log.route || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.resolved ? (
                                                <span className="text-[10px] uppercase font-bold text-green-400 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Resolved
                                                </span>
                                            ) : (
                                                <span className="text-[10px] uppercase font-bold text-amber-500">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleToggleResolve(log.id)}
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${log.resolved ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                    }`}
                                            >
                                                {log.resolved ? 'Reopen' : 'Mark Resolved'}
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

export default SystemLogs;
