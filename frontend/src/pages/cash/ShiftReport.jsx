import React, { useState, useEffect, useMemo } from 'react';
import { cashAPI } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
    Printer, Calendar, Edit3, Download, Save, 
    RefreshCw, Eye, Wallet, CreditCard, Smartphone, 
    TrendingUp, ArrowDownRight, User, Clock, 
    CheckCircle2, FileText, Settings, ChevronRight
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

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

    const [selectedReceiptData, setSelectedReceiptData] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptLoading, setReceiptLoading] = useState(false);

    useEffect(() => {
        loadReportData();
    }, [date, shift]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const response = await cashAPI.payments.getAll({
                paymentDate: date,
                receiverId: user?.id
            });

            const payments = response.data || [];

            let cash = 0, card = 0, mobile = 0, insurance = 0;
            const txs = payments.map(p => {
                const amt = parseFloat(p.amountPaid) || 0;
                if (p.paymentMethod?.toLowerCase() === 'cash') cash += amt;
                else if (p.paymentMethod?.toLowerCase().includes('card')) card += amt;
                else if (p.paymentMethod?.toLowerCase().includes('mobile') || p.paymentMethod?.toLowerCase() === 'momo') mobile += amt;
                else insurance += amt;

                return {
                    id: p.id,
                    time: new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    description: p.reference || `Payment #${p.paymentNumber}`,
                    amount: amt,
                    type: 'in',
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

    const handleViewReceipt = async (id) => {
        try {
            setReceiptLoading(id);
            const response = await cashAPI.payments.getReceipt(id);
            setSelectedReceiptData(response.data);
            setShowReceipt(true);
        } catch (error) {
            console.error('Error fetching receipt:', error);
            addToast('error', 'Failed to load receipt details.');
        } finally {
            setReceiptLoading(false);
        }
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

    const totalCollected = useMemo(() => 
        report.summary.cash + report.summary.card + report.summary.mobile, 
    [report.summary]);

    const expectedCash = useMemo(() => 
        report.reconciliation.openingFloat + report.summary.cash - report.reconciliation.expenses,
    [report.reconciliation, report.summary.cash]);

    const paymentMethods = [
        { id: 'cash', label: 'Cash', icon: Wallet, color: 'text-emerald-400', amount: report.summary.cash },
        { id: 'card', label: 'Card / POS', icon: CreditCard, color: 'text-indigo-400', amount: report.summary.card },
        { id: 'mobile', label: 'Mobile Money', icon: Smartphone, color: 'text-amber-400', amount: report.summary.mobile }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
                        <div className="p-2 bg-accent/10 rounded-2xl">
                            <Clock className="text-accent" size={32} />
                        </div>
                        Cashier Shift Report
                    </h1>
                    <p className="text-sm text-text-secondary mt-1 ml-14">Daily handover and revenue reconciliation</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsEditable(!isEditable)}
                        className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-lg ${isEditable ? 'bg-accent text-white' : 'bg-white/5 text-text-secondary hover:text-white border border-white/10'}`}
                    >
                        {isEditable ? <Save size={18} /> : <Edit3 size={18} />}
                        {isEditable ? 'Save Adjustments' : 'Edit Floats'}
                    </button>
                    <button 
                        onClick={handlePrint} 
                        className="btn bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        <Printer size={18} />
                        Print Handover
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <div className="md:col-span-2 glass-card p-6 border-white/10 flex flex-col md:flex-row items-end gap-4">
                    <div className="form-group mb-0 flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                            <Calendar size={12} className="text-accent" /> Shift Date
                        </label>
                        <input
                            type="date"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-white"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-0 flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                            <Clock size={12} className="text-accent" /> Time Slot
                        </label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-white"
                            value={shift}
                            onChange={e => setShift(e.target.value)}
                        >
                            <option value="morning" className="bg-slate-900">Morning (06:00-14:00)</option>
                            <option value="afternoon" className="bg-slate-900">Afternoon (14:00-22:00)</option>
                            <option value="night" className="bg-slate-900">Night (22:00-06:00)</option>
                        </select>
                    </div>
                    <button
                        onClick={loadReportData}
                        disabled={loading}
                        className="p-3 bg-accent text-white rounded-xl shadow-lg hover:bg-accent/80 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="glass-card p-6 border-white/10 bg-accent/5 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black text-white">K {totalCollected.toLocaleString()}</h3>
                    <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1 italic">
                        <TrendingUp size={10} className="text-emerald-400" /> System calculated from transactions
                    </p>
                </div>
            </div>

            {/* Main Report Body */}
            <div className="glass-card overflow-hidden border-white/10 relative print:shadow-none print:border-none print:bg-white print:text-black">
                {/* Print watermark/header */}
                <div className="hidden print:flex flex-col items-center justify-center p-10 border-b-2 border-slate-900 mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">MedFinance360</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Cashier Shift Handover Document</p>
                    <div className="grid grid-cols-3 gap-10 mt-10 w-full text-left">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Date</p>
                            <p className="text-sm font-bold">{new Date(date).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Shift Zone</p>
                            <p className="text-sm font-bold uppercase">{shift}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Duty Cashier</p>
                            <p className="text-sm font-bold">{user ? `${user.firstName} ${user.lastName}` : 'System Administrator'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 border-b border-white/10 print:grid-cols-2 print:border-slate-200">
                    {/* Collection Summary */}
                    <div className="p-8 space-y-6 lg:border-r border-white/10 print:border-slate-200">
                        <div className="flex items-center gap-3">
                            <Layers size={18} className="text-accent" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-white print:text-slate-900">Collection Summary</h3>
                        </div>
                        <div className="space-y-4">
                            {paymentMethods.map(method => (
                                <div key={method.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors`}>
                                            <method.icon size={16} className={method.color} />
                                        </div>
                                        <span className="text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors print:text-slate-600">{method.label}</span>
                                    </div>
                                    <div className="text-right">
                                        {isEditable ? (
                                            <input
                                                type="number"
                                                value={method.amount}
                                                onChange={(e) => updateReportValue(`summary.${method.id}`, e.target.value)}
                                                className="w-28 bg-white/5 border border-accent/50 rounded-lg px-2 py-1 text-right text-sm font-mono text-white outline-none focus:ring-2 focus:ring-accent/30"
                                                step="0.01"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono font-black text-white print:text-slate-900">K {method.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center print:border-slate-200">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Gross Collected</span>
                                <span className="text-lg font-black text-white print:text-slate-900">K {totalCollected.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reconciliation */}
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <Settings size={18} className="text-accent" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-white print:text-slate-900">Reconciliation Matrix</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-text-secondary print:text-slate-600">Opening Float</span>
                                {isEditable ? (
                                    <input
                                        type="number"
                                        value={report.reconciliation.openingFloat}
                                        onChange={(e) => updateReportValue('reconciliation.openingFloat', e.target.value)}
                                        className="w-28 bg-white/5 border border-accent/50 rounded-lg px-2 py-1 text-right text-sm font-mono text-white outline-none focus:ring-2 focus:ring-accent/30"
                                        step="0.01"
                                    />
                                ) : (
                                    <span className="text-sm font-mono font-black text-text-primary print:text-slate-900">K {report.reconciliation.openingFloat.toLocaleString()}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-text-secondary print:text-slate-600">Cash Sales (+)</span>
                                <span className="text-sm font-mono font-black text-emerald-400">K {report.summary.cash.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-text-secondary print:text-slate-600">Expenses / Refunds (-)</span>
                                {isEditable ? (
                                    <input
                                        type="number"
                                        value={report.reconciliation.expenses}
                                        onChange={(e) => updateReportValue('reconciliation.expenses', e.target.value)}
                                        className="w-28 bg-white/5 border border-rose-500/50 rounded-lg px-2 py-1 text-right text-sm font-mono text-white outline-none focus:ring-2 focus:ring-rose-500/30"
                                        step="0.01"
                                    />
                                ) : (
                                    <span className="text-sm font-mono font-black text-rose-400">- K {Math.abs(report.reconciliation.expenses).toLocaleString()}</span>
                                )}
                            </div>
                            <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center bg-accent/5 -mx-4 px-4 py-3 rounded-2xl print:border-slate-200 print:bg-slate-50 print:px-0 print:mx-0">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Expected Physical Cash</span>
                                    <span className="text-[9px] text-text-secondary italic print:text-slate-500">Must match cash in drawer</span>
                                </div>
                                <span className="text-xl font-black text-white print:text-slate-900">K {expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-accent" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-white print:text-slate-900">Transaction Audit Trail</h3>
                        </div>
                        <span className="no-print text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                            {report.transactions.length} Records
                        </span>
                    </div>
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-text-secondary border-b border-white/5 print:bg-slate-100 print:text-slate-900">
                                    <th className="py-3 px-4">Time</th>
                                    <th className="py-3 px-4">Description / Reference</th>
                                    <th className="py-3 px-4">Method</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                    <th className="py-3 px-4 text-right no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 print:divide-slate-200">
                                {report.transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-text-secondary opacity-40">
                                                <Smartphone size={32} />
                                                <p className="text-xs font-bold uppercase tracking-widest">No shift activity found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    report.transactions.map(t => (
                                        <tr key={t.id} className="group hover:bg-white/[0.02] transition-colors print:hover:bg-transparent">
                                            <td className="py-4 px-4">
                                                <span className="text-[10px] font-mono font-bold text-text-secondary print:text-slate-500">{t.time}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-text-primary print:text-slate-900">{t.description}</span>
                                                    <span className="text-[9px] text-text-secondary opacity-60 uppercase mt-0.5 print:text-slate-400">Ref: {t.id}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-text-secondary print:border-slate-200">
                                                    {t.method}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono text-xs">
                                                <span className={`font-black ${t.type === 'out' ? 'text-rose-400' : 'text-emerald-400'} print:text-slate-900`}>
                                                    {t.type === 'out' ? '-' : ''}K {Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right no-print">
                                                <button
                                                    onClick={() => handleViewReceipt(t.id)}
                                                    disabled={receiptLoading === t.id}
                                                    className="p-2 bg-white/5 hover:bg-accent hover:text-white rounded-lg transition-all text-text-secondary opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                    title="Reprint Receipt"
                                                >
                                                    {receiptLoading === t.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer size={14} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Handover Signatures */}
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16 mt-10 border-t border-white/10 print:border-slate-200 print:text-slate-900 print:mt-12">
                    <div className="space-y-8">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50">Prepared By (Outgoing Cashier)</span>
                            <div className="pt-10 border-b border-white/20 flex justify-between items-end print:border-slate-900">
                                <span className="text-xs font-bold text-white mb-2 print:text-slate-900">{user ? `${user.firstName} ${user.lastName}` : 'System Admin'}</span>
                                <span className="text-[9px] text-text-secondary mb-2 uppercase opacity-40">Signature & Date</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50">Verified By (Shift Supervisor)</span>
                            <div className="pt-10 border-b border-white/20 flex justify-between items-end print:border-slate-900">
                                <div className="w-1 h-6"></div> {/* Placeholder for signature space */}
                                <span className="text-[9px] text-text-secondary mb-2 uppercase opacity-40">Signature & Date</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                data={selectedReceiptData}
            />
        </div>
    );
};

export default ShiftReport;
