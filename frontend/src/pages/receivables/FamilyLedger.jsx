import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, Download, Wallet, User2, ArrowUpRight, History } from 'lucide-react';
import api from '../../services/apiClient';

const FamilyLedger = () => {
    const { policyNumber } = useParams();
    const navigate = useNavigate();
    const [ledger, setLedger] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchLedger();
    }, [policyNumber, dateRange]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = dateRange;
            const response = await api.get(`/receivables/schemes/ledger/${policyNumber}`, {
                params: { startDate, endDate }
            });
            setLedger(response.data);
        } catch (error) {
            console.error('Error fetching ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    const handlePrint = () => window.print();

    if (loading && !ledger) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-white/40 font-black uppercase tracking-widest text-xs">Synchronizing Family Ledger...</p>
            </div>
        </div>
    );

    if (!ledger) return (
        <div className="p-12 text-center bg-red-500/10 border border-red-500/20 rounded-[3rem]">
            <p className="text-red-500 font-black uppercase tracking-widest text-sm">Ledger record not found</p>
        </div>
    );

    const { principal, members, transactions, broughtForward, finalBalance } = ledger;

    return (
        <div className="min-h-screen bg-bg-primary text-white animate-fade-in pb-20">
            {/* Header / Filter Bar (No Print) */}
            <div className="print:hidden sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/5 px-8 py-6 mb-10">
                <div className="max-w-[1600px] mx-auto flex flex-wrap justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-4 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <Wallet className="w-5 h-5 text-primary" />
                                <h1 className="text-2xl font-black uppercase tracking-tighter">Family Ledger</h1>
                            </div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Account: <span className="text-white font-mono">{policyNumber}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Date Range Pill */}
                        <div className="flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/10 group hover:bg-white/10 transition-all">
                            <input
                                type="date"
                                name="startDate"
                                value={dateRange.startDate}
                                onChange={handleDateChange}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-tighter focus:ring-0 text-white/60 p-0 w-24 cursor-pointer"
                            />
                            <span className="text-white/20 font-black">-</span>
                            <input
                                type="date"
                                name="endDate"
                                value={dateRange.endDate}
                                onChange={handleDateChange}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-tighter focus:ring-0 text-white/60 p-0 w-24 cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,0,204,0.3)]"
                        >
                            <Printer className="w-5 h-5" />
                            Print Statement
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1400px] mx-auto px-6 print:p-0 print:max-w-none">
                <div className="bg-black/40 border border-white/5 rounded-[4rem] shadow-2xl p-16 relative backdrop-blur-sm print:bg-white print:border-none print:shadow-none print:text-black print:p-4 print:rounded-none">

                    {/* Visual Decor */}
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none print:hidden"></div>

                    {/* Report Header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16 border-b border-white/5 pb-12 print:border-slate-200">
                        <div className="space-y-8 flex-1">
                            <div>
                                <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">STATEMENT OF ACCOUNT</h2>
                                <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.3em] print:text-slate-500">
                                    Period: {new Date(dateRange.startDate).toLocaleDateString()} — {new Date(dateRange.endDate).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center p-[2px] border border-white/10 print:border-slate-200">
                                    <div className="w-full h-full rounded-[1.8rem] bg-bg-primary flex items-center justify-center print:bg-slate-50">
                                        <User2 className="w-8 h-8 text-primary/60" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black uppercase tracking-tight">{principal?.firstName} {principal?.lastName}</h3>
                                    <div className="text-xs text-white/40 font-bold uppercase tracking-widest flex flex-wrap gap-4 print:text-slate-500">
                                        <p>Policy: <span className="text-white print:text-black">{policyNumber}</span></p>
                                        <p>NRC: <span className="text-white print:text-black">{principal?.nrc || '-'}</span></p>
                                        <p>Status: <span className="text-primary print:text-black font-black">{principal?.memberStatus || 'ACTIVE'}</span></p>
                                    </div>
                                    <p className="text-xs text-white/30 mt-2 font-medium print:text-slate-600">{principal?.address || 'Residential Address on Record'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-4 min-w-[320px] print:text-right">
                            <div className={`p-8 rounded-[2.5rem] border backdrop-blur-md shadow-xl transition-all ${finalBalance > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'} print:bg-slate-50 print:border-slate-200`}>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 print:text-slate-500 text-right">CLOSING BALANCE</p>
                                <div className="flex items-end gap-3 justify-end">
                                    <p className={`text-4xl font-black tabular-nums tracking-tighter ${finalBalance > 0 ? 'text-red-500' : 'text-green-500'} print:text-black`}>
                                        K {Math.abs(Number(finalBalance)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    <span className="text-[10px] font-black uppercase tracking-widest mb-1 text-white/20 print:text-slate-400">
                                        {finalBalance > 0 ? 'Debit' : 'Credit'}
                                    </span>
                                </div>
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 text-right print:text-slate-400 italic">
                                    {finalBalance > 0 ? 'Outstanding amount pending payment' : 'Account has surplus credit balance'}
                                </p>
                            </div>
                            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-4 print:text-slate-400">
                                Total Dependents Registered: {members.length - 1}
                            </div>
                        </div>
                    </div>

                    {/* Transaction History Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <History className="w-5 h-5 text-primary/40" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Transaction History</h4>
                            <div className="h-px flex-1 bg-white/5 print:bg-slate-200"></div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/[0.03] text-[9px] font-black text-white/40 uppercase tracking-widest border-y border-white/5 print:bg-slate-100 print:text-black print:border-slate-300">
                                    <tr>
                                        <th className="px-6 py-4">Transaction Date</th>
                                        <th className="px-6 py-4">Reference No.</th>
                                        <th className="px-6 py-4">Detailed Description</th>
                                        <th className="px-6 py-4 text-right">Debit (DR)</th>
                                        <th className="px-6 py-4 text-right">Credit (CR)</th>
                                        <th className="px-6 py-4 text-right bg-white/[0.02] border-l border-white/5 print:border-slate-300">Run Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-bold text-white/70 print:text-black">
                                    {/* Brought Forward row */}
                                    {broughtForward !== 0 && (
                                        <tr className="bg-white/[0.02] border-b border-white/5 italic">
                                            <td className="px-6 py-4 text-white/30">{dateRange.startDate}</td>
                                            <td className="px-6 py-4 text-white/20">OB-FWD</td>
                                            <td className="px-6 py-4 uppercase tracking-tighter">Balance brought forward from previous period</td>
                                            <td className="px-6 py-4 text-right tabular-nums">{broughtForward > 0 ? Number(broughtForward).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                            <td className="px-6 py-4 text-right tabular-nums">{broughtForward < 0 ? Number(Math.abs(broughtForward)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                            <td className="px-6 py-4 text-right tabular-nums font-black text-white bg-white/[0.02] border-l border-white/5">K {Number(broughtForward).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}

                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-20 text-center text-white/20 uppercase tracking-widest text-[10px] font-black">
                                                No financial activity recorded in the specified period
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((t, index) => (
                                            <tr key={index} className="hover:bg-white/[0.02] transition-colors border-b border-white/5 group">
                                                <td className="px-6 py-4 whitespace-nowrap text-white/50">{t.date}</td>
                                                <td className="px-6 py-4 font-mono text-[9px] text-white/40">{t.ref}</td>
                                                <td className="px-6 py-4 text-white group-hover:text-primary transition-colors">{t.description}</td>
                                                <td className="px-6 py-4 text-right tabular-nums text-red-400 font-black">{t.debit > 0 ? Number(t.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                                <td className="px-6 py-4 text-right tabular-nums text-green-400 font-black">{t.credit > 0 ? Number(t.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                                <td className="px-6 py-4 text-right tabular-nums font-black text-white bg-white/[0.02] border-l border-white/5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        K {Number(t.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        <ArrowUpRight className="w-3 h-3 text-white/10 group-hover:text-primary transition-colors" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-white/[0.05] text-[10px] font-black text-white border-t-2 border-primary/20 print:bg-slate-200 print:text-black print:border-slate-500">
                                    <tr>
                                        <td colSpan="3" className="px-6 py-6 text-right uppercase tracking-[0.2em]">Transaction Summary Totals</td>
                                        <td className="px-6 py-6 text-right tabular-nums text-red-500 text-sm">
                                            K {transactions.reduce((sum, t) => sum + (t.debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-6 text-right tabular-nums text-green-500 text-sm">
                                            K {transactions.reduce((sum, t) => sum + (t.credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-6 text-right tabular-nums text-xl bg-white/5 border-l border-white/10">
                                            K {Number(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Report Footer */}
                    <div className="mt-20 flex flex-col md:flex-row justify-between items-end gap-12">
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] print:text-slate-400 italic">
                            Report Generated by MEDFINANCE360 Internal Audit System<br />
                            End of Statement for Account {policyNumber}
                        </div>

                        <div className="flex gap-16 print:flex hidden">
                            <div className="text-center">
                                <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Medical Director</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print CSS Overrides */}
            <style>{`
                @media print {
                    @page { margin: 15mm; size: portrait; }
                    body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:text-black { color: black !important; }
                    .print\\:bg-white { background: white !important; }
                    .print\\:bg-slate-50 { background: #f8fafc !important; }
                    .print\\:bg-slate-100 { background: #f1f5f9 !important; }
                    .print\\:bg-slate-200 { background: #e2e8f0 !important; }
                    .print\\:border-slate-200 { border-color: #e2e8f0 !important; }
                    .print\\:border-slate-300 { border-color: #cbd5e1 !important; }
                    .print\\:border-slate-500 { border-color: #64748b !important; }
                    .print\\:text-slate-400 { color: #94a3b8 !important; }
                    .print\\:text-slate-500 { color: #64748b !important; }
                    .print\\:text-slate-600 { color: #475569 !important; }
                    .print\\:p-4 { padding: 1rem !important; }
                    .print\\:rounded-none { border-radius: 0 !important; }
                    .print\\:flex { display: flex !important; }
                    * { border-color: #e2e8f0 !important; }
                }
            `}</style>
        </div>
    );
};

export default FamilyLedger;
