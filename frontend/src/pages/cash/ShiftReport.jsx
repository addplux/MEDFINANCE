import React, { useState, useEffect } from 'react';
import { cashAPI } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Printer, Calendar, Edit3, Download, Save, RefreshCw } from 'lucide-react';

const ShiftReport = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState('morning');
    const [isEditable, setIsEditable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState({
        transactions: [],
        summary: {
            cash: 0,
            card: 0,
            mobile: 0,
            insurance: 0
        },
        reconciliation: {
            openingFloat: 0,
            expenses: 0
        }
    });

    useEffect(() => {
        loadReportData();
    }, [date, shift]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            // Note: In a real environment, you'd filter by exact time based on shift logic
            // For now, let's fetch payments for the specific date and user.
            const response = await cashAPI.payments.getAll({
                paymentDate: date,
                receiverId: user?.id
            });

            const payments = response.data || [];

            let cash = 0, card = 0, mobile = 0, insurance = 0;
            const txs = payments.map(p => {
                const amt = parseFloat(p.amountPaid) || 0;
                // Group by paymentMethod
                if (p.paymentMethod?.toLowerCase() === 'cash') cash += amt;
                else if (p.paymentMethod?.toLowerCase().includes('card')) card += amt;
                else if (p.paymentMethod?.toLowerCase().includes('mobile') || p.paymentMethod?.toLowerCase() === 'momo') mobile += amt;
                else insurance += amt;

                return {
                    id: p.id,
                    time: new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    description: p.reference || `Payment #${p.paymentNumber}`,
                    amount: amt,
                    type: 'in', // Assuming all are incoming for now. If refund, make it 'out'.
                    method: p.paymentMethod
                };
            });

            setReport(prev => ({
                ...prev,
                transactions: txs,
                summary: { cash, card, mobile, insurance }
            }));

        } catch (error) {
            console.error('Failed to load shift report:', error);
            addToast('error', 'Failed to load shift transactions');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        setIsEditable(false);
        setTimeout(() => window.print(), 100);
    };

    const handleExportPDF = () => {
        setIsEditable(false);
        setTimeout(() => window.print(), 100);
    };

    const updateReportValue = (path, value) => {
        const keys = path.split('.');
        setReport(prev => {
            const newReport = { ...prev };
            let current = newReport;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = parseFloat(value) || 0;
            return newReport;
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Shift Report</h1>
                    <p className="text-text-secondary">Daily cashier closing report</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditable(!isEditable)}
                        className={`btn ${isEditable ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                    >
                        {isEditable ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditable ? 'Done Editing' : 'Edit Report'}
                    </button>
                    <button onClick={handlePrint} className="btn btn-secondary flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button onClick={handleExportPDF} className="btn btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
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
                <button
                    onClick={loadReportData}
                    disabled={loading}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Refreshing...' : 'View Report'}
                </button>
            </div>

            {/* Report Preview */}
            <div className="card p-8 space-y-8 print:shadow-none print:border-none">
                <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-bold">MEDFINANCE360 MEDICAL CENTRE</h2>
                    <p className="text-sm text-text-secondary">Shift Handover Report</p>
                    <p className="text-sm mt-2 font-medium">
                        Date: {new Date(date).toLocaleDateString()} | Shift: {shift.toUpperCase()} | Cashier: {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-4">Collection Summary</h3>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Cash</td>
                                    <td className="py-2 text-right font-medium">
                                        {isEditable ? (
                                            <input
                                                type="number"
                                                value={report.summary.cash}
                                                onChange={(e) => updateReportValue('summary.cash', e.target.value)}
                                                className="w-24 px-2 py-1 text-right border border-primary-500 rounded"
                                                step="0.01"
                                            />
                                        ) : (
                                            `K${report.summary.cash.toLocaleString()}`
                                        )}
                                    </td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Card / POS</td>
                                    <td className="py-2 text-right font-medium">
                                        {isEditable ? (
                                            <input
                                                type="number"
                                                value={report.summary.card}
                                                onChange={(e) => updateReportValue('summary.card', e.target.value)}
                                                className="w-24 px-2 py-1 text-right border border-primary-500 rounded"
                                                step="0.01"
                                            />
                                        ) : (
                                            `K${report.summary.card.toLocaleString()}`
                                        )}
                                    </td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Mobile Money</td>
                                    <td className="py-2 text-right font-medium">
                                        {isEditable ? (
                                            <input
                                                type="number"
                                                value={report.summary.mobile}
                                                onChange={(e) => updateReportValue('summary.mobile', e.target.value)}
                                                className="w-24 px-2 py-1 text-right border border-primary-500 rounded"
                                                step="0.01"
                                            />
                                        ) : (
                                            `K${report.summary.mobile.toLocaleString()}`
                                        )}
                                    </td>
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
                                    <td className="py-2 text-right font-medium">
                                        {isEditable ? (
                                            <input
                                                type="number"
                                                value={report.reconciliation.openingFloat}
                                                onChange={(e) => updateReportValue('reconciliation.openingFloat', e.target.value)}
                                                className="w-24 px-2 py-1 text-right border border-primary-500 rounded"
                                                step="0.01"
                                            />
                                        ) : (
                                            `K${report.reconciliation.openingFloat.toLocaleString()}`
                                        )}
                                    </td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Cash Sales</td>
                                    <td className="py-2 text-right font-medium text-green-600">+ K{report.summary.cash.toLocaleString()}</td>
                                </tr>
                                <tr className="py-2">
                                    <td className="py-2 text-text-secondary">Expenses / Refunds</td>
                                    <td className="py-2 text-right font-medium text-red-600">
                                        {isEditable ? (
                                            <input
                                                type="number"
                                                value={report.reconciliation.expenses}
                                                onChange={(e) => updateReportValue('reconciliation.expenses', e.target.value)}
                                                className="w-24 px-2 py-1 text-right border border-primary-500 rounded"
                                                step="0.01"
                                            />
                                        ) : (
                                            `- K${Math.abs(report.reconciliation.expenses).toLocaleString()}`
                                        )}
                                    </td>
                                </tr>
                                <tr className="py-2 bg-gray-50 font-bold">
                                    <td className="py-2 text-text-primary pl-2">Expected Cash</td>
                                    <td className="py-2 text-right pr-2">K{(report.reconciliation.openingFloat + report.summary.cash - report.reconciliation.expenses).toLocaleString()}</td>
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
                            {report.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-4 text-center text-text-secondary border-b border-border">
                                        No transactions recorded for this shift.
                                    </td>
                                </tr>
                            ) : (
                                report.transactions.map(t => (
                                    <tr key={t.id} className="border-b border-border hover:bg-surface/50">
                                        <td className="p-2 text-text-secondary">{t.time}</td>
                                        <td className="p-2 font-medium">{t.description}</td>
                                        <td className="p-2">{t.method}</td>
                                        <td className={`p-2 text-right font-mono ${t.type === 'out' ? 'text-danger-600' : 'text-success-600'}`}>
                                            {t.type === 'out' ? '-' : ''}K{Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
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
