import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, patientAPI, cashAPI, setupAPI } from '../../services/apiService';
import {
    Search, User, DollarSign, ArrowLeft, Receipt, CheckCircle,
    Activity, Clock, CreditCard, Save, Printer, FileText, Shield, AlertCircle
} from 'lucide-react';

const PatientRunningBill = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [patient, setPatient] = useState(null);
    const [unpaidBills, setUnpaidBills] = useState([]);
    const [balanceInfo, setBalanceInfo] = useState({ balance: 0, totalPending: 0, deposit: 0 });
    const [loading, setLoading] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: 'partial', selectedBills: [] });
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentAmount, setPaymentAmount] = useState('');

    // Fetch patient and their running bills
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        try {
            setIsSearching(true);
            
            // 1. Search for patient
            // Assuming search by patient number (e.g. HOSP-2026...) or name
            const patientRes = await patientAPI.getAll({ search: searchTerm.trim(), limit: 1 });
            
            if (patientRes.data?.data && patientRes.data.data.length > 0) {
                const foundPatient = patientRes.data.data[0];
                setPatient(foundPatient);
                await fetchPatientBills(foundPatient.id);
            } else {
                alert('Patient not found');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Error searching for patient');
        } finally {
            setIsSearching(false);
        }
    };

    const fetchPatientBills = async (patientId) => {
        try {
            setLoading(true);
            // Get all aggregated unpaid bills across departments
            const billsRes = await billingAPI.patient.getUnpaidBills(patientId);
            setUnpaidBills(billsRes.data || []);
            
            // Calculate totals
            const totalPending = (billsRes.data || []).reduce((sum, b) => sum + Number(b.netAmount || b.totalAmount || 0), 0);
            
            // Get current account balance / previous deposits
            const balRes = await billingAPI.patient.getBalance(patientId);
            const currentBalance = Number(balRes.data?.balance || 0);
            
            setBalanceInfo({
                totalPending,
                deposit: currentBalance > 0 ? currentBalance : 0, // In this system, positive balance usually means credit/deposit
                balance: totalPending - (currentBalance > 0 ? currentBalance : 0)
            });

        } catch (error) {
            console.error('Fetch bills error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayment = async () => {
        if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        try {
            setLoading(true);
            // Payload for cashController's createPayment
            const payload = {
                patientId: patient.id,
                amount: Number(paymentAmount),
                paymentMethod: paymentMethod,
                notes: paymentModal.type === 'partial' ? 'Partial Deposit / Advance Payment' : 'Final Bill Clearance',
                // If it's a final clearance, we could optionally pass the list of all bills to mark as paid.
                // But typically, the current balance and the incoming payment handle the ledger math.
                paidBills: paymentModal.type === 'final' ? unpaidBills.map(b => ({ type: b.billType, id: b.id })) : []
            };

            await cashAPI.payments.create(payload);
            
            alert('Payment processed successfully!');
            setPaymentModal({ isOpen: false, type: 'partial', selectedBills: [] });
            setPaymentAmount('');
            
            // Refresh bills and balance
            await fetchPatientBills(patient.id);

        } catch (error) {
            console.error('Payment error:', error);
            alert(error.response?.data?.error || 'Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
    };

    const getDepartmentColor = (dept) => {
        const colors = {
            'OPD': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'IPD': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            'Laboratory': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'Pharmacy': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Radiology': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            'Theatre': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        };
        return colors[dept] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        Master Cashier
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest font-black border border-emerald-500/20">Unified Billing</span>
                    </h1>
                    <p className="text-sm text-white/40 font-medium mt-1">Process deposits and generate final discharge bills automatically</p>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="card p-4 border-white/5 bg-gradient-to-r from-bg-primary to-bg-secondary flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Scan or enter Patient ID (e.g., HOSP-2026-004567) or Name..."
                        className="w-full bg-white/[0.02] border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-blue-500/50 text-lg font-medium placeholder:text-white/20"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSearching || !searchTerm}
                    className="btn btn-primary px-8 bg-blue-600 hover:bg-blue-700 h-auto"
                >
                    {isSearching ? 'Searching...' : 'Find Patient'}
                </button>
            </form>

            {patient && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                    
                    {/* Left Column: Ledger / Running Bills array */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card border-white/5 flex flex-col h-full">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Active Charges</h2>
                                </div>
                                <div className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                    {unpaidBills.length} Items Pending
                                </div>
                            </div>

                            <div className="p-0 overflow-x-auto flex-1">
                                {loading ? (
                                    <div className="p-12 text-center text-white/40 space-y-3">
                                        <Activity className="w-8 h-8 mx-auto animate-pulse text-blue-500/50" />
                                        <p className="text-xs uppercase tracking-widest font-black">Syncing all departments...</p>
                                    </div>
                                ) : unpaidBills.length === 0 ? (
                                    <div className="p-12 text-center text-white/40 space-y-3 flex flex-col items-center justify-center h-full">
                                        <CheckCircle className="w-12 h-12 text-emerald-500/30" />
                                        <p className="text-sm font-medium">No active charges found.</p>
                                        <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Patient is fully cleared</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                                <th className="p-4 text-[10px] font-black uppercase text-white/30 tracking-widest">Date</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-white/30 tracking-widest">Dept</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-white/30 tracking-widest">Description</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-white/30 tracking-widest text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {unpaidBills.map((bill, index) => (
                                                <tr key={`${bill.billType}-${bill.id}-${index}`} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 text-xs text-white/60">
                                                        {new Date(bill.createdAt || bill.billDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-wider border ${getDepartmentColor(bill.department)}`}>
                                                            {bill.department}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-white font-medium">
                                                        {bill.description}
                                                    </td>
                                                    <td className="p-4 text-sm font-black text-white text-right">
                                                        {formatCurrency(bill.netAmount || bill.totalAmount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Patient Info & Actions */}
                    <div className="space-y-6 flex flex-col">
                        
                        {/* Patient Profile Card */}
                        <div className="card p-6 border-white/5 bg-gradient-to-br from-blue-900/20 to-transparent">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                    {patient.photoUrl ? (
                                        <img src={patient.photoUrl} alt="Patient" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-white/40" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{patient.firstName} {patient.lastName}</h3>
                                    <p className="text-blue-400 text-sm font-mono tracking-wider">{patient.patientNumber}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Status</p>
                                    <p className="text-sm text-emerald-400 font-medium flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Active
                                    </p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Method</p>
                                    <p className="text-sm text-white capitalize">{patient.paymentMethod?.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Balance & Actions Card */}
                        <div className="card border-white/5 flex-1 flex flex-col bg-white/[0.01]">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Financial Summary</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60 text-sm">Total Unpaid Charges</span>
                                        <span className="text-white font-medium">{formatCurrency(balanceInfo.totalPending)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-400">
                                        <span className="text-sm">Pre-Deposits / Credits</span>
                                        <span className="font-medium">- {formatCurrency(balanceInfo.deposit)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <span className="text-white/80 font-black uppercase tracking-widest text-xs">Balance Due</span>
                                        <span className="text-3xl font-black text-white tracking-tight">
                                            {formatCurrency(balanceInfo.balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-3 flex-1 flex flex-col justify-end">
                                <button
                                    onClick={() => setPaymentModal({ isOpen: true, type: 'partial' })}
                                    className="w-full p-4 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                                >
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                    Take Partial Deposit
                                </button>
                                
                                <button
                                    onClick={() => setPaymentModal({ isOpen: true, type: 'final' })}
                                    disabled={balanceInfo.balance <= 0 && unpaidBills.length === 0}
                                    className="w-full p-4 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <Receipt className="w-4 h-4" />
                                    Process Final Discharge
                                </button>
                                
                                <button
                                    disabled={balanceInfo.balance > 0}
                                    className="w-full mt-2 p-3 rounded-xl bg-transparent hover:bg-white/5 text-white/30 font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed group"
                                >
                                    {balanceInfo.balance <= 0 && unpaidBills.length === 0 ? (
                                        <><Printer className="w-4 h-4 text-white group-hover:text-blue-400" /> <span className="group-hover:text-blue-400 text-white">Print Clearance Slip</span></>
                                    ) : (
                                        <><AlertCircle className="w-4 h-4" /> Must clear balance to discharge</>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {paymentModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-secondary w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-400" />
                                {paymentModal.type === 'partial' ? 'Take Deposit' : 'Final Clearance'}
                            </h2>
                            <button onClick={() => setPaymentModal({ isOpen: false })} className="text-white/40 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {paymentModal.type === 'final' ? (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-100/80 text-sm">
                                    You are processing the final payment of <strong className="text-white">{formatCurrency(balanceInfo.balance)}</strong>. This will mark all {unpaidBills.length} pending items as paid and clear the patient for discharge.
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/60 text-xs">
                                    Taking an advance deposit. This money will sit on the patient's account ledger and automatically offset future charges (like Surgery or Ward fees).
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Amount to Pay</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-white/40 font-black">ZMW</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder={paymentModal.type === 'final' ? balanceInfo.balance.toString() : '0.00'}
                                            className="w-full bg-bg-primary border border-white/10 rounded-xl py-4 pl-14 pr-4 text-white font-black text-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                    {paymentModal.type === 'final' && (
                                        <button 
                                            onClick={() => setPaymentAmount(balanceInfo.balance)}
                                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
                                        >
                                            Pay Full Balance ({formatCurrency(balanceInfo.balance)})
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['cash', 'card', 'mobile_money', 'insurance'].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setPaymentMethod(m)}
                                                className={`px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                                                    paymentMethod === m 
                                                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' 
                                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                }`}
                                            >
                                                {m.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleProcessPayment}
                                disabled={loading || !paymentAmount}
                                className="w-full btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-4 font-black uppercase tracking-widest shadow-xl shadow-emerald-900/50"
                            >
                                {loading ? 'Processing...' : `Confirm ${formatCurrency(paymentAmount)} Payment`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientRunningBill;
