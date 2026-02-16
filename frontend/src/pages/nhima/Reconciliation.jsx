import React, { useState } from 'react';
import { Calendar, DollarSign, FileCheck, AlertTriangle } from 'lucide-react';

const Reconciliation = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('2026-02');
    const [reconciliationData, setReconciliationData] = useState({
        totalClaimed: 5250.00,
        totalApproved: 4800.00,
        totalPaid: 4500.00,
        totalRejected: 450.00,
        variance: 300.00,
        claimsCount: 15,
        approvedCount: 12,
        rejectedCount: 3
    });

    const discrepancies = [
        { id: 1, claimNumber: 'CLM-2026-008', expectedAmount: 500.00, paidAmount: 450.00, difference: -50.00, reason: 'Partial approval' },
        { id: 2, claimNumber: 'CLM-2026-012', expectedAmount: 300.00, paidAmount: 250.00, difference: -50.00, reason: 'Deduction applied' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">NHIMA Reconciliation</h1>
                    <p className="text-gray-600 mt-1">Reconcile NHIMA payments with submitted claims</p>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <input
                        type="month"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Claimed</p>
                            <p className="text-xl font-bold text-gray-900">K {reconciliationData.totalClaimed.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Approved</p>
                            <p className="text-xl font-bold text-green-600">K {reconciliationData.totalApproved.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Paid</p>
                            <p className="text-xl font-bold text-purple-600">K {reconciliationData.totalPaid.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Variance</p>
                            <p className="text-xl font-bold text-red-600">K {reconciliationData.variance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reconciliation Status */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reconciliation Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Claims Submitted</p>
                        <p className="text-3xl font-bold text-gray-900">{reconciliationData.claimsCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Approved</p>
                        <p className="text-3xl font-bold text-green-600">{reconciliationData.approvedCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Rejected</p>
                        <p className="text-3xl font-bold text-red-600">{reconciliationData.rejectedCount}</p>
                    </div>
                </div>
            </div>

            {/* Discrepancies */}
            {discrepancies.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-yellow-50">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <h2 className="font-semibold text-gray-900">Payment Discrepancies</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Claim Number</th>
                                    <th>Expected Amount</th>
                                    <th>Paid Amount</th>
                                    <th>Difference</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discrepancies.map((item) => (
                                    <tr key={item.id}>
                                        <td className="font-medium">{item.claimNumber}</td>
                                        <td>K {item.expectedAmount.toLocaleString()}</td>
                                        <td>K {item.paidAmount.toLocaleString()}</td>
                                        <td className={item.difference < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                            K {item.difference.toLocaleString()}
                                        </td>
                                        <td>{item.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reconciliation;
