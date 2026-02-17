import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theatreAPI, patientAPI } from '../../services/apiService';
import { Save, X } from 'lucide-react';

const TheatreBillForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patientId: '',
        procedureType: '',
        surgeonName: '',
        anesthetistName: '',
        procedureDate: new Date().toISOString().split('T')[0],
        theatreCharges: 0,
        surgeonFees: 0,
        anesthetistFees: 0,
        consumables: 0,
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await theatreAPI.bills.create(formData);
            navigate('/app/theatre/billing');
        } catch (error) {
            console.error('Error creating theatre bill:', error);
            alert('Failed to create theatre bill');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = parseFloat(formData.theatreCharges || 0) +
        parseFloat(formData.surgeonFees || 0) +
        parseFloat(formData.anesthetistFees || 0) +
        parseFloat(formData.consumables || 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">New Theatre Bill</h1>
                    <p className="text-text-secondary">Create a new surgical procedure bill</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="label">Patient ID *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.patientId}
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Procedure Date *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.procedureDate}
                            onChange={(e) => setFormData({ ...formData, procedureDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group md:col-span-2">
                        <label className="label">Procedure Type *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.procedureType}
                            onChange={(e) => setFormData({ ...formData, procedureType: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Surgeon Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.surgeonName}
                            onChange={(e) => setFormData({ ...formData, surgeonName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Anesthetist Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.anesthetistName}
                            onChange={(e) => setFormData({ ...formData, anesthetistName: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Theatre Charges (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.theatreCharges}
                            onChange={(e) => setFormData({ ...formData, theatreCharges: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Surgeon Fees (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.surgeonFees}
                            onChange={(e) => setFormData({ ...formData, surgeonFees: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Anesthetist Fees (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.anesthetistFees}
                            onChange={(e) => setFormData({ ...formData, anesthetistFees: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Consumables (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.consumables}
                            onChange={(e) => setFormData({ ...formData, consumables: e.target.value })}
                        />
                    </div>

                    <div className="form-group md:col-span-2">
                        <label className="label">Notes</label>
                        <textarea
                            className="form-textarea"
                            rows="3"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Amount:</span>
                        <span className="text-2xl font-bold text-primary-600">K{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/app/theatre/billing')}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Bill'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TheatreBillForm;
