import React, { useState } from 'react';
import { billingAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import { X, DollarSign, AlertCircle, Save } from 'lucide-react';

const ManualChargeModal = ({ patient, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'others',
        notes: ''
    });

    const categories = [
        { value: 'consultation', label: 'Consultation' },
        { value: 'lab', label: 'Laboratory' },
        { value: 'pharmacy', label: 'Pharmacy' },
        { value: 'radiology', label: 'Radiology' },
        { value: 'procedure', label: 'Procedure / Surgery' },
        { value: 'nursing', label: 'Nursing Care' },
        { value: 'accommodation', label: 'Ward / Bed' },
        { value: 'others', label: 'Miscellaneous / Others' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.description || !formData.amount) {
            addToast('warning', 'Please fill in description and amount');
            return;
        }

        setLoading(true);
        try {
            await billingAPI.patient.createManualCharge({
                patientId: patient.id,
                ...formData,
                amount: parseFloat(formData.amount)
            });
            addToast('success', 'Manual charge recorded successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating manual charge:', error);
            addToast('error', error.response?.data?.error || 'Failed to record manual charge');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20">
                            <DollarSign className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Record Manual Charge</h3>
                            <p className="text-xs text-text-secondary">Recording charge for {patient.firstName} {patient.lastName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Charge Description</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Miscellaneous Consultation Fee"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Amount (K)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50 appearance-none"
                            >
                                {categories.map(c => (
                                    <option key={c.value} value={c.value} className="bg-[#0f172a]">{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Additional Notes (Optional)</label>
                        <textarea
                            rows="2"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50 resize-none"
                            placeholder="Provide any additional context..."
                        />
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-200/70 leading-relaxed">
                            This charge will be added to the patient's outstanding balance immediately. 
                            It will appear in their financial history as a manual adjustment.
                        </p>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-white/60 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 disabled:opacity-50"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Record Charge
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualChargeModal;
