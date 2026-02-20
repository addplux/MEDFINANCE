import React, { useState, useEffect } from 'react';
import { ledgerAPI } from '../../services/apiService';
import { FileText, Calendar, RefreshCw, Printer } from 'lucide-react';

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

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-text-secondary">Loading Report...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Trial Balance</h1>
                    <p className="text-sm text-text-secondary mt-1">Financial Position Overview</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadTrialBalance} className="btn btn-secondary flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 no-print max-w-md">
                <label className="block text-sm font-medium text-text-primary mb-1">As Of Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="form-input pl-10 w-full"
                    />
                </div>
            </div>

            {/* Report Card */}
            <div className="card p-8 print:shadow-none print:border-none print:p-0">
                {/* Print Header */}
                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold">MEDFINANCE360</h1>
                    <h2 className="text-xl">Trial Balance</h2>
                    <p className="text-text-secondary">As of {new Date(asOfDate).toLocaleDateString()}</p>
                </div>

                {data ? (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead className="bg-surface/50">
                                <tr>
                                    <th className="text-left w-1/4">Account Code</th>
                                    <th className="text-left w-2/4">Account Name</th>
                                    <th className="text-right w-1/8">Debit (K)</th>
                                    <th className="text-right w-1/8">Credit (K)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data.accounts.map((account) => (
                                    <tr key={account.accountCode} className="hover:bg-surface/50">
                                        <td className="font-mono text-sm font-medium text-text-secondary">{account.accountCode}</td>
                                        <td className="font-medium text-text-primary">{account.accountName}</td>
                                        <td className="text-right font-mono">
                                            {account.debit > 0 ? Number(account.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="text-right font-mono">
                                            {account.credit > 0 ? Number(account.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-border font-bold bg-surface/50">
                                <tr>
                                    <td colSpan="2" className="text-right">Grand Totals</td>
                                    <td className="text-right font-mono text-text-primary">{Number(data.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right font-mono text-text-primary">{Number(data.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className={`mt-6 p-4 rounded-xl font-medium border ${data.balanced ? 'bg-success-50 text-success-700 border-success-200' : 'bg-danger-50 text-danger-700 border-danger-200'}`}>
                            {data.balanced ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FileCheckIcon className="w-5 h-5 text-success-500" />
                                    Trial Balance is Balanced
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <AlertTriangleIcon className="w-5 h-5 text-danger-500" />
                                    Trial Balance is NOT Balanced (Difference: K {Math.abs(data.totalDebit - data.totalCredit).toLocaleString()})
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-text-secondary">No data available for this date</div>
                )}
            </div>
        </div>
    );
};

// Helper Icons
const FileCheckIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AlertTriangleIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export default TrialBalance;
