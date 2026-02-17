import React, { useState } from 'react';
import { cashAPI } from '../../services/apiService';
import { Printer, Calendar } from 'lucide-react';

const ShiftReport = () => {
    // Current date default
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState('morning'); // morning, afternoon, night
    const [report, setReport] = useState({
        cashOnHand: 5000,
        totalReceipts: 15400,
        totalPayments: 200,
        transactions: [
            { id: 1, time: '08:30', description: 'OPD Consultation-John Doe', amount: 150, type: 'in', method: 'Cash' },
            { id: 2, time: '09:15', description: 'Lab Test-Jane Smith', amount: 400, type: 'in', method: 'Card' },
            { id: 3, time: '10:00', description: 'Pharmacy-Peter Jones', amount: 250, type: 'in', method: 'Cash' },
            { id: 4, time: '12:30', description: 'Refund-Overpayment', amount: -50, type: 'out', method: 'Cash' },
        ],
        summary: {
            cash: 5400,
            card: 5000,
            mobile: 5000,
            insurance: 15000
        }
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Shift Report</h1>
                    <p className="text-text-secondary">Daily cashier closing report</p>
                </div>
                <button onClick={handlePrint} className="btn btn-secondary flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print Report
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4 flex gap-4 items-end no-print">
                <div className="form-group mb-0 flex-1">
                    <label className="label">Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
                <div className="form-group mb-0 flex-1">
                    <label className="label">Shift</label>
                    <select
                        className="form-select"
                        value={shift}
                        onChange={e => setShift(e.target.value)}
                    >
                        <option value="morning">Morning (06:00-14:00)</option>
                        <option value="afternoon">Afternoon (14:00-22:00)</option>
                        <option value="night">Night (22:00-06:00)</option>
                    </select>
                </div>
                <button className="btn btn-primary">View Report</button>
            </div>

            {/* Report Preview */}
            <div className="card p-8 space-y-8 print:shadow-none print:border-none">
                <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-bold">MEDFINANCE360 MEDICAL CENTRE</h2>
                    <p className="text-sm text-text-secondary">Shift Handover Report</p>
                    <p className="text-sm mt-2 font-medium">
                        Date: {new Date(date).toLocaleDateString()} | Shift: {shift.toUpperCase()} | Cashier: {`Admin User`}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-4">Collection Summary</h3>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Cash</td>
                                    <td className="py-2 text-right font-medium">K{report.summary.cash.toLocaleString()}</td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Card / POS</td>
                                    <td className="py-2 text-right font-medium">K{report.summary.card.toLocaleString()}</td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Mobile Money</td>
                                    <td className="py-2 text-right font-medium">K{report.summary.mobile.toLocaleString()}</td>
                                </tr>
                                <tr className="py-2 bg-gray-50 font-bold">
                                    <td className="py-2 text-text-primary pl-2">Total Collected</td>
                                    <td className="py-2 text-right pr-2">K{(report.summary.cash + report.summary.card + report.summary.mobile).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Reconciliation</h3>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Opening Float</td>
                                    <td className="py-2 text-right font-medium">K1,000.00</td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Cash Sales</td>
                                    <td className="py-2 text-right font-medium text-green-600">+ K{report.summary.cash.toLocaleString()}</td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Expenses / Refunds</td>
                                    <td className="py-2 text-right font-medium text-red-600">- K{Math.abs(report.totalPayments).toLocaleString()}</td>
                                </tr>
                                <tr className="py-2 bg-gray-50 font-bold">
                                    <td className="py-2 text-text-primary pl-2">Expected Cash</td>
                                    <td className="py-2 text-right pr-2">K{(1000 + report.summary.cash-200).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-4">Transaction History</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left p-2">Time</th>
                                <th className="text-left p-2">Description</th>
                                <th className="text-left p-2">Method</th>
                                <th className="text-right p-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.transactions.map(t => (
                                <tr key={t.id} className="border-b border-gray-100">
                                    <td className="p-2">{t.time}</td>
                                    <td className="p-2">{t.description}</td>
                                    <td className="p-2">{t.method}</td>
                                    <td className={`p-2 text-right font-medium ${t.type === 'out' ? 'text-red-600' : ''}`}>
                                        {t.type === 'out' ? '-' : ''}K{Math.abs(t.amount).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pt-8 flex justify-between gap-8 mt-12 border-t text-sm">
                    <div className="flex-1">
                        <p className="mb-8">Prepared By:</p>
                        <div className="border-t border-black w-3/4"></div>
                        <p className="mt-1">Cashier Signature</p>
                    </div>
                    <div className="flex-1">
                        <p className="mb-8">Verified By:</p>
                        <div className="border-t border-black w-3/4"></div>
                        <p className="mt-1">Supervisor Signature</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftReport;
