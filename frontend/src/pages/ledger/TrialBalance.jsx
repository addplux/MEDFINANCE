import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
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
            const response = await api.get('/ledger/trial-balance', {
                params: { asOfDate }
            });
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
                <div className="text-lg text-gray-600">Loading Report...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Trial Balance</h1>
                    <p className="text-gray-600 mt-1">Financial Position Overview</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadTrialBalance} className="btn btn-secondary">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button onClick={handlePrint} className="btn btn-secondary">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 no-print max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">As Of Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="form-input pl-11"
                    />
                </div>
            </div>

            {/* Report Card */}
            <div className="card p-8 print:shadow-none print:border-none print:p-0">
                {/* Print Header */}
                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold">MEDFINANCE360</h1>
                    <h2 className="text-xl">Trial Balance</h2>
                    <p className="text-gray-600">As of {new Date(asOfDate).toLocaleDateString()}</p>
                </div>

                {data ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Account Code</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Account Name</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Debit</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.accounts.map((account) => (
                                    <tr key={account.accountCode} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 font-mono text-gray-500">{account.accountCode}</td>
                                        <td className="py-2 px-4 font-medium text-gray-900">{account.accountName}</td>
                                        <td className="py-2 px-4 text-right">
                                            {account.debit > 0 ? Number(account.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            {account.credit > 0 ? Number(account.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-gray-300 font-bold bg-gray-50">
                                <tr>
                                    <td colSpan="2" className="py-3 px-4 text-right">Totals</td>
                                    <td className="py-3 px-4 text-right">{Number(data.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-3 px-4 text-right">{Number(data.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className={`mt-4 p-3 rounded-md text-center font-medium ${data.balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {data.balanced ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FileCheckIcon className="w-5 h-5" />
                                    Trial Balance is Balanced
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <AlertTriangleIcon className="w-5 h-5" />
                                    Trial Balance is NOT Balanced (Difference: {Math.abs(data.totalDebit - data.totalCredit).toLocaleString()})
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">No data available</div>
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
