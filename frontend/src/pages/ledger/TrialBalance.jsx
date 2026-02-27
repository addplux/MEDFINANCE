import React, { useState, useEffect, useMemo } from 'react';
import { ledgerAPI } from '../../services/apiService';
import { 
    FileText, Calendar, RefreshCw, Printer, 
    CheckCircle2, AlertTriangle, TrendingUp, 
    TrendingDown, Calculator, Scale, Layers
} from 'lucide-react';

const TrialBalance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadTrialBalance();
    }, [asOfDate]);

    const loadTrialBalance = async () => {
        try {
            setLoading(true);
            const response = await ledgerAPI.trialBalance({ asOfDate });
            setData(response.data);
        } catch (error) {
            console.error('Failed to load trial balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Group accounts by type for the report
    const groupedAccounts = useMemo(() => {
        if (!data || !data.accounts) return {};
        
        return data.accounts.reduce((groups, account) => {
            const type = account.accountType || 'Other';
            if (!groups[type]) groups[type] = [];
            groups[type].push(account);
            return groups;
        }, {});
    }, [data]);

    const accountTypes = [
        { id: 'asset', label: 'Assets', color: 'text-emerald-400', icon: TrendingUp },
        { id: 'liability', label: 'Liabilities', color: 'text-rose-400', icon: TrendingDown },
        { id: 'equity', label: 'Equity', color: 'text-indigo-400', icon: Scale },
        { id: 'revenue', label: 'Revenue', color: 'text-amber-400', icon: Layers },
        { id: 'expense', label: 'Expenses', color: 'text-orange-400', icon: Calculator }
    ];

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest text-text-secondary">Generating Financial Snapshot...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
                        <div className="p-2 bg-accent/10 rounded-2xl">
                            <Scale className="text-accent" size={32} />
                        </div>
                        Trial Balance
                    </h1>
                    <p className="text-sm text-text-secondary mt-1 ml-14">Verify the mathematical accuracy of the General Ledger</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadTrialBalance} 
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all shadow-lg"
                        title="Refresh Report"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handlePrint} 
                        className="btn bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        <Printer size={18} />
                        Export / Print
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="glass-card p-6 border-white/10 no-print max-w-sm">
                <div className="form-group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                        <Calendar size={12} className="text-accent" /> As Of Reporting Date
                    </label>
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-white"
                    />
                </div>
            </div>

            {/* Report Content */}
            <div className="glass-card overflow-hidden border-white/10 relative print:shadow-none print:border-none print:bg-white print:text-black">
                {/* Print watermark/header */}
                <div className="hidden print:flex flex-col items-center justify-center p-10 border-b-2 border-slate-900 mb-10">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">MEDFINANCE360</h1>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Professional Financial Reporting</p>
                    <div className="mt-8 text-center">
                        <h2 className="text-xl font-bold uppercase tracking-widest">Trial Balance Report</h2>
                        <p className="text-sm font-medium mt-1">Generated as of {new Date(asOfDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                </div>

                {/* Status Bar */}
                {data && (
                    <div className={`p-4 flex items-center justify-between border-b border-white/10 no-print ${data.balanced ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <div className="flex items-center gap-3">
                            {data.balanced ? (
                                <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                                    <CheckCircle2 size={16} />
                                </div>
                            ) : (
                                <div className="p-2 bg-rose-500/20 rounded-full text-rose-400 animate-pulse">
                                    <AlertTriangle size={16} />
                                </div>
                            )}
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${data.balanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    Ledger Integrity Status
                                </p>
                                <p className="text-xs font-bold text-white">
                                    {data.balanced ? 'All accounts are mathematically balanced.' : `Discrepancy detected: K ${Math.abs(data.totalDebit - data.totalCredit).toLocaleString()}`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Balance Verification</p>
                            <p className="text-xs font-mono font-bold text-white uppercase italic">Zero-Variance Check</p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-white/10 print:bg-slate-100 print:text-slate-900">
                                <th className="py-4 px-8">Account Details</th>
                                <th className="py-4 px-4 text-right">Debit (K)</th>
                                <th className="py-4 px-8 text-right">Credit (K)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 print:divide-slate-200">
                            {data ? (
                                accountTypes.map(type => {
                                    const accounts = groupedAccounts[type.id] || [];
                                    if (accounts.length === 0) return null;

                                    return (
                                        <React.Fragment key={type.id}>
                                            {/* Type Header */}
                                            <tr className="bg-white/[0.02] no-print">
                                                <td colSpan="3" className="py-3 px-8">
                                                    <div className="flex items-center gap-2">
                                                        <type.icon size={12} className={type.color} />
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${type.color}`}>
                                                            {type.label} Summary
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Accounts */}
                                            {accounts.map(acc => (
                                                <tr key={acc.accountCode} className="group hover:bg-white/[0.02] transition-colors print:hover:bg-transparent">
                                                    <td className="py-3 px-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-text-primary print:text-slate-900">
                                                                {acc.accountName}
                                                            </span>
                                                            <span className="text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest mt-0.5 print:text-slate-500">
                                                                {acc.accountCode}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-sm">
                                                        <span className={acc.debit > 0 ? 'text-emerald-400 font-bold print:text-slate-900' : 'text-text-disabled print:text-slate-200'}>
                                                            {acc.debit > 0 ? Number(acc.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-8 text-right font-mono text-sm">
                                                        <span className={acc.credit > 0 ? 'text-rose-400 font-bold print:text-slate-900' : 'text-text-disabled print:text-slate-200'}>
                                                            {acc.credit > 0 ? Number(acc.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="3" className="py-20 text-center text-text-secondary italic">
                                        No data found for this reporting period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {data && (
                            <tfoot className="border-t-4 border-white/10 bg-white/10 print:bg-slate-200 print:text-slate-900 print:border-slate-900">
                                <tr className="text-sm font-black uppercase tracking-widest">
                                    <td className="py-6 px-8 text-right text-text-secondary print:text-slate-500">Aggregate Totals:</td>
                                    <td className="py-6 px-4 text-right text-emerald-400 font-mono print:text-slate-900">
                                        K {Number(data.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-6 px-8 text-right text-rose-400 font-mono print:text-slate-900">
                                        K {Number(data.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Footer Insights */}
            <div className="flex flex-col md:flex-row gap-6 no-print">
                <div className="flex-1 glass-card p-6 border-white/10 flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">Net Worth Analysis</h4>
                        <p className="text-xl font-bold mt-1 text-white">
                            K {data ? Number(data.totalDebit - data.totalCredit).toLocaleString() : '0.00'}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-1">Calculated surplus/deficit based on ledger accounts.</p>
                    </div>
                </div>
                <div className="flex-1 glass-card p-6 border-white/10 flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">Reporting Status</h4>
                        <p className="text-xl font-bold mt-1 text-white">Internal Audit</p>
                        <p className="text-[10px] text-text-secondary mt-1">Ready for month-end closure processing.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialBalance;
