import React, { useState } from 'react';
import { publicAPI } from '../../services/apiService';
import { Search, CreditCard, ShieldCheck, ArrowRight, User, AlertCircle, CheckCircle } from 'lucide-react';

const PatientPaymentPortal = () => {
    const [patientId, setPatientId] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Payment form states
    const [amountToPay, setAmountToPay] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mobile_money');
    const [processing, setProcessing] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!patientId.trim()) return;

        try {
            setLoading(true);
            setError('');
            const res = await publicAPI.getPatientBalance(patientId.trim());
            setPatientData(res.data.patient);
            
            // Auto-fill amount if they have a balance
            if (res.data.patient.balance > 0) {
                setAmountToPay(res.data.patient.balance.toString());
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Patient not found. Please check your ID.');
            setPatientData(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!amountToPay || isNaN(amountToPay) || Number(amountToPay) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        try {
            setProcessing(true);
            setError('');
            
            const payload = {
                patientId: patientData.id,
                amount: Number(amountToPay),
                paymentMethod: paymentMethod
            };

            const response = await publicAPI.initiatePayment(payload);
            
            // Redirect to the Mock Checkout URL (or real Flutterwave URL)
            if (response.data?.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                setError('Failed to get payment gateway link.');
            }

        } catch (err) {
            console.error(err);
            setError('Unable to initiate payment. Please try again later.');
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans">
            {/* Minimal Header */}
            <header className="bg-white px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
                        Z
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">MedFinance</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Patient Portal</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <ShieldCheck className="w-4 h-4" /> Secure SSL
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-lg w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
                
                <div className="text-center mb-8 animate-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Pay Your Bill Online</h2>
                    <p className="text-slate-500 font-medium">Clear your hospital balances instantly via Mobile Money or Visa.</p>
                </div>

                {/* Patient Search Form */}
                {!patientData && (
                    <form onSubmit={handleSearch} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in zoom-in-95 duration-500">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                            Enter your Patient ID
                        </label>
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="text"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                                placeholder="e.g. HOSP-2026-004567"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-medium text-lg placeholder:font-sans placeholder:text-slate-400"
                            />
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 rounded-xl">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !patientId}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading ? 'Finding Account...' : 'Look Up My Account'} <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                )}

                {/* Patient Details & Payment Form */}
                {patientData && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
                        
                        {/* Profile Summary */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900">{patientData.name}</h3>
                                <p className="text-sm font-mono text-slate-500 mt-1">{patientData.patientNumber}</p>
                            </div>
                            <button 
                                onClick={() => { setPatientData(null); setPatientId(''); }}
                                className="text-xs font-black uppercase text-blue-500 hover:text-blue-700 underline"
                            >
                                Change
                            </button>
                        </div>

                        {/* Payment Checkout */}
                        <form onSubmit={handlePaymentSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            
                            <div className="text-center mb-8 border-b border-slate-100 pb-8">
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Current Balance Due</p>
                                <div className="text-5xl font-black text-slate-900 tracking-tight">
                                    {formatCurrency(patientData.balance)}
                                </div>
                                {patientData.balance <= 0 && (
                                    <div className="mt-4 inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-sm font-bold">
                                        <CheckCircle className="w-5 h-5" /> Account Clear. No payment needed.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                        Amount to Pay
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <span className="text-slate-400 font-black">ZMW</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={amountToPay}
                                            onChange={(e) => setAmountToPay(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-16 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black text-2xl"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['mobile_money', 'card'].map((method) => (
                                            <div 
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                                                    paymentMethod === method 
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                                                }`}
                                            >
                                                <CreditCard className={`w-6 h-6 ${paymentMethod === method ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <span className="text-xs font-black uppercase tracking-widest text-center">
                                                    {method.replace('_', ' ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 rounded-xl">
                                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || !amountToPay || patientData.balance <= 0 && amountToPay == 0}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none text-lg tracking-wide uppercase"
                                >
                                    {processing ? 'Connecting Gateway...' : `Pay ${formatCurrency(amountToPay)} Now`} 
                                </button>
                                
                                <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-4 flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Secured by Payment Gateway
                                </p>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PatientPaymentPortal;
