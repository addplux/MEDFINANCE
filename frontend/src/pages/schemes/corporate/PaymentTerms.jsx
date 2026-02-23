import React, { useState, useEffect } from 'react';
import { Calendar, Shield, Percent, CreditCard, Save, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { receivablesAPI } from '../../../services/apiService';
import { useToast } from '../../../context/ToastContext';

const PaymentTerms = () => {
    const { addToast } = useToast();
    const [schemes, setSchemes] = useState([]);
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        paymentTermsDays: 30,
        gracePeriodDays: 7,
        latePaymentRate: 0,
        paymentMethod: 'Bank Transfer'
    });

    useEffect(() => {
        fetchSchemes();
    }, []);

    const fetchSchemes = async () => {
        setLoading(true);
        try {
            const response = await receivablesAPI.schemes.getAll({ status: 'active' });
            setSchemes(response.data || []);
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
            addToast('error', 'Failed to load schemes.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectScheme = (scheme) => {
        setSelectedScheme(scheme);
        setFormData({
            paymentTermsDays: scheme.paymentTermsDays || 30,
            gracePeriodDays: scheme.gracePeriodDays || 7,
            latePaymentRate: scheme.latePaymentRate || 0,
            paymentMethod: scheme.paymentMethod || 'Bank Transfer'
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'paymentMethod' ? value : parseFloat(value) || 0
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedScheme) return;

        setSaving(true);
        try {
            await receivablesAPI.schemes.update(selectedScheme.id, formData);
            addToast('success', 'Payment terms updated successfully.');

            // Refresh local scheme list
            setSchemes(schemes.map(s => s.id === selectedScheme.id ? { ...s, ...formData } : s));
            setSelectedScheme({ ...selectedScheme, ...formData });
        } catch (error) {
            console.error('Save failed:', error);
            addToast('error', 'Failed to save payment terms.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment Terms</h1>
                <p className="text-sm text-slate-500 mt-1">Configure corporate payment terms and conditions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Scheme Selection Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-1">Select Scheme</h2>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl border border-slate-200" />
                            ))
                        ) : schemes.length === 0 ? (
                            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500">
                                No active schemes found.
                            </div>
                        ) : (
                            schemes.map(scheme => (
                                <button
                                    key={scheme.id}
                                    onClick={() => handleSelectScheme(scheme)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${selectedScheme?.id === scheme.id
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{scheme.schemeName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{scheme.schemeCode}</p>
                                    </div>
                                    <Building2 className={`h-5 w-5 shrink-0 ${selectedScheme?.id === scheme.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Configuration Form */}
                <div className="lg:col-span-8">
                    {!selectedScheme ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                            <Building2 className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a scheme to view and edit terms</p>
                            <p className="text-sm">Modified terms will apply to future invoice cycles.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{selectedScheme.schemeName}</h3>
                                    <p className="text-sm text-slate-500">Configuration Details</p>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {selectedScheme.status}
                                </span>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Net Days */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <Calendar className="h-4 w-4 text-theme-primary" />
                                            Payment Terms (Net Days)
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="paymentTermsDays"
                                                value={formData.paymentTermsDays}
                                                onChange={handleInputChange}
                                                className="w-full h-12 pl-4 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all appearance-none cursor-pointer"
                                            >
                                                {[7, 14, 30, 45, 60, 90].map(days => (
                                                    <option key={days} value={days}>Net {days} Days</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-slate-400 rotate-45" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400">Days from invoice date until payment is due.</p>
                                    </div>

                                    {/* Grace Period */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <Shield className="h-4 w-4 text-theme-primary" />
                                            Grace Period (Days)
                                        </label>
                                        <input
                                            type="number"
                                            name="gracePeriodDays"
                                            value={formData.gracePeriodDays}
                                            onChange={handleInputChange}
                                            className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all"
                                            min="0"
                                            max="30"
                                        />
                                        <p className="text-xs text-slate-400">Additional days allowed before penalties apply.</p>
                                    </div>

                                    {/* Late Fee Rate */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <Percent className="h-4 w-4 text-theme-primary" />
                                            Late Payment Interest Rate (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="latePaymentRate"
                                                value={formData.latePaymentRate}
                                                onChange={handleInputChange}
                                                className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all"
                                                min="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Monthly interest rate for overdue invoices.</p>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <CreditCard className="h-4 w-4 text-theme-primary" />
                                            Preferred Payment Method
                                        </label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleInputChange}
                                            className="w-full h-12 pl-4 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all appearance-none cursor-pointer"
                                        >
                                            {['Bank Transfer', 'Cheque', 'Mobile Money', 'Cash'].map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Summary Box */}
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                        <AlertCircle className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">Business Impact</h4>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                            Setting the terms to <strong>Net {formData.paymentTermsDays} Days</strong> with a
                                            <strong> {formData.gracePeriodDays}-day grace period</strong> means payments received after
                                            Day {formData.paymentTermsDays + formData.gracePeriodDays} may incur a
                                            <strong> {formData.latePaymentRate}%</strong> interest charge.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center justify-center gap-2 px-10 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-slate-200"
                                    >
                                        {saving ? (
                                            <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                                        ) : (
                                            <><Save className="h-5 w-5" /> Save Configuration</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentTerms;
