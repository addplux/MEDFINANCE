import React, { useState, useEffect } from 'react';
import { billingAPI } from '../../../services/apiService';
import { Activity, Printer, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

const BillingStatementSection = ({ patientId, onRefreshBalance }) => {
    const [open, setOpen] = useState(true); // Default open when initialized inside modal drawers
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const statementRes = await billingAPI.patient.getStatement(patientId);
            setData(statementRes.data);
        } catch (e) {
            setError('Failed to load financial statement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) load();
    }, [patientId]);

    const fmt = (n) => `K${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handlePrint = () => {
        if (!data) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Patient Statement</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .gov-header { text-align: center; border-bottom: 3px double #222; padding-bottom: 16px; margin-bottom: 20px; }
                        .gov-header .country { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #555; font-weight: 600; }
                        .gov-header .ministry { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #333; font-weight: 700; margin: 4px 0; }
                        .gov-header .hospital { font-size: 22px; font-weight: 900; color: #111; margin: 6px 0 2px; }
                        .gov-header .doc-title { font-size: 15px; font-weight: 600; color: #444; margin-top: 8px; letter-spacing: 1px; }
                        .meta { font-size: 11px; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f4f4f4; font-size: 12px; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="gov-header">
                        <div class="country">Republic of Zambia</div>
                        <div class="ministry">Ministry of Health</div>
                        <div class="hospital">Nchanga North General Hospital</div>
                        <div class="doc-title">Patient Billing Statement</div>
                    </div>
                    <p class="meta">Generated: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th class="text-right">Debit</th>
                                <th class="text-right">Credit</th>
                                <th class="text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.statement.map(s => `
                                <tr>
                                    <td>${new Date(s.date).toLocaleDateString()}</td>
                                    <td>${s.type}</td>
                                    <td>${s.description}</td>
                                    <td class="text-right">${s.debit > 0 ? fmt(s.debit) : '-'}</td>
                                    <td class="text-right">${s.credit > 0 ? fmt(s.credit) : '-'}</td>
                                    <td class="text-right font-bold">${fmt(s.balance)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    return (
        <div className="card overflow-hidden bg-bg-secondary border border-border-color rounded-2xl">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-bold text-text-primary">Financial History & Statements</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
            </button>

            {open && (
                <div className="px-4 pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs text-text-tertiary uppercase tracking-widest font-bold">Transaction History</p>
                        <div className="flex gap-2">
                            <button onClick={load} className="p-1.5 hover:bg-white/5 rounded-lg text-text-tertiary hover:text-white transition-colors">
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {data && (
                                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white transition-colors">
                                    <Printer className="w-3 h-3" />
                                    Print Statement
                                </button>
                            )}
                        </div>
                    </div>

                    {loading && !data && (
                        <div className="py-8 text-center text-text-tertiary text-sm">Loading transactions...</div>
                    )}

                    {error && <p className="text-red-400 text-sm py-4">{error}</p>}

                    {data && (
                        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-bg-secondary z-10">
                                    <tr className="text-[9px] uppercase tracking-widest text-text-tertiary border-b border-white/5">
                                        <th className="px-4 py-3 font-black">Date</th>
                                        <th className="px-4 py-3 font-black">Type</th>
                                        <th className="px-4 py-3 font-black">Description</th>
                                        <th className="px-4 py-3 font-black text-right">Debit</th>
                                        <th className="px-4 py-3 font-black text-right">Credit</th>
                                        <th className="px-4 py-3 font-black text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {data.statement.map((s, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-2.5 text-xs text-text-tertiary font-mono">{new Date(s.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase border ${
                                                    s.type === 'PAYMENT' || s.type === 'CREDIT' 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {s.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-white max-w-[200px] truncate">{s.description}</td>
                                            <td className="px-4 py-2.5 text-xs text-white text-right">{s.debit > 0 ? fmt(s.debit) : '-'}</td>
                                            <td className="px-4 py-2.5 text-xs text-emerald-400 text-right">{s.credit > 0 ? fmt(s.credit) : '-'}</td>
                                            <td className="px-4 py-2.5 text-xs font-bold text-white text-right">{fmt(s.balance)}</td>
                                        </tr>
                                    ))}
                                    {data.statement.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-xs text-text-tertiary italic">No transactions found for this patient.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BillingStatementSection;
