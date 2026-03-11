import React, { useState, useEffect, useRef } from 'react';
import { billingAPI, patientAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
    FileText, Download, Printer, Search, RefreshCw, User,
    Calendar, DollarSign, X, ChevronRight
} from 'lucide-react';

const fmt = (n) => `K${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * PrepaidStatementGenerator
 * Standalone modal/page for generating a downloadable patient statement
 * listing all service charges, payments, and balance for prepaid patients.
 *
 * Can be rendered inline or as a modal panel.
 * Props: patientId (optional) — pre-selects the patient
 */
const PrepaidStatementGenerator = ({ patientId: initialPatientId, onClose }) => {
    const { addToast } = useToast();
    const printRef = useRef(null);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [patient, setPatient] = useState(null);
    const [statement, setStatement] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // If patientId is provided, auto-load the patient
    useEffect(() => {
        if (initialPatientId) {
            patientAPI.getById(initialPatientId).then(res => {
                if (res.data) { setPatient(res.data); loadStatement(initialPatientId); }
            }).catch(() => { });
        }
    }, [initialPatientId]);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await patientAPI.getAll({ search: query, paymentMethod: 'prepaid', limit: 10 });
                setResults(res.data?.patients || res.data || []);
            } catch { setResults([]); } finally { setSearching(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [query]);

    const loadStatement = async (pid) => {
        setLoading(true);
        try {
            const params = {};
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;
            const res = await billingAPI.patient.getStatement(pid || patient?.id);
            setStatement(res.data);
        } catch { addToast('error', 'Failed to generate statement.'); }
        finally { setLoading(false); }
    };

    const handleSelectPatient = (p) => {
        setPatient(p);
        setQuery(`${p.firstName} ${p.lastName}`);
        setResults([]);
        loadStatement(p.id);
    };

    const handlePrint = () => {
        const el = printRef.current;
        if (!el) return;
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`
            <html>
            <head>
                <title>Patient Statement - ${patient?.firstName} ${patient?.lastName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
                    h1 { font-size: 20px; margin: 0 0 4px; }
                    p { margin: 2px 0; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                    th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
                    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
                    .total { font-weight: bold; font-size: 15px; }
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
                    .paid { background: #d1fae5; color: #065f46; }
                    .pending { background: #fef3c7; color: #92400e; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
                    .summary { display: flex; gap: 24px; margin-top: 16px; }
                    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; }
                    .summary-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
                    .summary-box .value { font-size: 20px; font-weight: bold; margin-top: 4px; }
                </style>
            </head>
            <body>
                ${el.innerHTML}
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    };

    const handleDownloadCSV = () => {
        if (!statement) return;
        const rows = [
            ['Type', 'Date', 'Description', 'Amount', 'Status'],
            ...(statement.bills || []).map(b => [
                b.type || 'Bill', new Date(b.createdAt).toLocaleDateString(), b.serviceName || b.description || 'General', b.netAmount || b.totalAmount || 0, b.status || 'pending'
            ]),
            ...(statement.payments || []).map(p => [
                'Payment', new Date(p.paymentDate || p.createdAt).toLocaleDateString(), 'Payment Received', p.amount, 'paid'
            ]),
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statement-${patient?.patientNumber}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalBilled = (statement?.bills || []).reduce((s, b) => s + Number(b.netAmount || b.totalAmount || 0), 0);
    const totalPaid = (statement?.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const balance = totalBilled - totalPaid;

    const isModal = typeof onClose === 'function';

    const content = (
        <div className={`space-y-6 ${isModal ? '' : 'py-8'}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Patient Statement Generator</h2>
                        <p className="text-xs text-text-secondary">Private prepaid scheme billing summary</p>
                    </div>
                </div>
                {isModal && (
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Patient Search */}
            {!initialPatientId && (
                <div className="card p-5">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Search Patient</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setPatient(null); setStatement(null); }}
                            placeholder="Name, patient number..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                    {searching && <p className="text-xs text-text-secondary mt-2">Searching...</p>}
                    {results.length > 0 && !patient && (
                        <div className="mt-2 border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                            {results.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectPatient(p)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                                >
                                    <div>
                                        <div className="text-sm font-medium text-white">{p.firstName} {p.lastName}</div>
                                        <div className="text-xs text-text-secondary font-mono">{p.patientNumber} · {p.paymentMethod}</div>
                                    </div>
                                    <ChevronRight className="text-purple-400 w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Date filter + Generate */}
            {patient && (
                <div className="card p-5 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">From Date</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">To Date</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none" />
                    </div>
                    <button
                        onClick={() => loadStatement()}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Generating...' : 'Generate Statement'}
                    </button>
                    {statement && (
                        <>
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors">
                                <Printer className="w-4 h-4" /> Print / PDF
                            </button>
                            <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors">
                                <Download className="w-4 h-4" /> CSV
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Statement Preview */}
            {statement && patient && (
                <div ref={printRef} className="card overflow-hidden">
                    {/* Print Header */}
                    <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                    <User className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">{patient.firstName} {patient.lastName}</h3>
                                    <p className="text-xs text-text-secondary font-mono">No. {patient.patientNumber} · {patient.paymentMethod?.toUpperCase()}</p>
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary">Statement generated: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Total Billed', value: fmt(totalBilled), color: 'text-white' },
                                { label: 'Total Paid', value: fmt(totalPaid), color: 'text-emerald-400' },
                                { label: 'Balance', value: fmt(balance), color: balance > 0 ? 'text-rose-400' : 'text-emerald-400' },
                            ].map((s, i) => (
                                <div key={i} className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{s.label}</p>
                                    <p className={`text-lg font-black mt-1 ${s.color}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bills */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-text-secondary">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {(statement.bills || []).map((b, i) => (
                                    <tr key={`b-${i}`} className="hover:bg-white/[0.02]">
                                        <td className="px-6 py-3 text-xs text-text-secondary font-mono">{new Date(b.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400">{b.type || 'Bill'}</span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-white">{b.serviceName || b.description || 'General Service'}</td>
                                        <td className="px-6 py-3 text-sm font-bold text-white text-right">{fmt(b.netAmount || b.totalAmount)}</td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${b.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                {b.status || 'pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(statement.payments || []).map((p, i) => (
                                    <tr key={`p-${i}`} className="hover:bg-white/[0.02] bg-emerald-500/[0.02]">
                                        <td className="px-6 py-3 text-xs text-text-secondary font-mono">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Payment</span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-white">Payment Received · {p.paymentMethod || 'Cash'}</td>
                                        <td className="px-6 py-3 text-sm font-bold text-emerald-400 text-right">-{fmt(p.amount)}</td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>
                                        </td>
                                    </tr>
                                ))}
                                {/* Balance row */}
                                <tr className="border-t-2 border-white/10 bg-white/[0.02]">
                                    <td colSpan={3} className="px-6 py-4 text-sm font-black text-white uppercase tracking-widest">Net Balance</td>
                                    <td colSpan={2} className={`px-6 py-4 text-right text-lg font-black ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{fmt(balance)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-full max-w-4xl my-auto">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default PrepaidStatementGenerator;
