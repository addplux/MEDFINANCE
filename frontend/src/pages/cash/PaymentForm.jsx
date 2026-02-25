import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Wallet, User, CheckCircle } from 'lucide-react';
import { cashAPI, patientAPI } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

const PaymentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { user } = useAuth();
    const isEdit = Boolean(id);

    // State passed from the Payments/Ledger page
    const statePatientId = location.state?.patientId ? String(location.state.patientId) : '';
    const stateBillsToPay = location.state?.billsToPay || [];

    // Derive bill type — null for multiple depts (allowNull: true in DB)
    const uniqueDepts = [...new Set(stateBillsToPay.map(b => b.department).filter(Boolean))];
    const derivedBillType = uniqueDepts.length === 1
        ? uniqueDepts[0].toLowerCase()
        : null;  // send null rather than 'multiple' to avoid ENUM constraint

    const prefilledAmount = stateBillsToPay
        .reduce((sum, b) => sum + Number(b.netAmount || b.totalAmount || 0), 0)
        .toString();

    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [formData, setFormData] = useState({
        patientId: statePatientId,
        amount: prefilledAmount,
        paymentMethod: 'cash',
        referenceNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        billType: derivedBillType,
        billId: stateBillsToPay.length === 1 ? stateBillsToPay[0].id : null,
        notes: ''
    });

    useEffect(() => {
        loadPatients();
        if (isEdit) fetchPayment();
    }, [id]);

    // When patients list loads, find the pre-selected patient and auto-fill method
    useEffect(() => {
        if (!patients.length || !formData.patientId) return;
        const found = patients.find(p => String(p.id) === String(formData.patientId));
        if (!found) return;
        setSelectedPatient(found);

        // Auto-select payment method if patient is on a corporate scheme
        if (found.schemeId || found.Scheme) {
            setFormData(prev => ({ ...prev, paymentMethod: 'insurance' }));
        }
    }, [patients, formData.patientId]);

    const loadPatients = async () => {
        try {
            const response = await patientAPI.getAll({ limit: 2000 });
            setPatients(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    };

    const fetchPayment = async () => {
        try {
            setLoading(true);
            const response = await cashAPI.payments.getById(id);
            const payment = response.data;
            setFormData({
                patientId: payment.patientId || '',
                amount: payment.amount || '',
                paymentMethod: payment.paymentMethod || 'cash',
                referenceNumber: payment.referenceNumber || '',
                paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
                billType: payment.billType || 'opd',
                billId: payment.billId || '',
                notes: payment.notes || ''
            });
        } catch (error) {
            console.error('Error fetching payment:', error);
            alert('Failed to load payment details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // When patient changes manually, look up scheme
        if (name === 'patientId') {
            const found = patients.find(p => String(p.id) === String(value));
            setSelectedPatient(found || null);
            if (found && (found.schemeId || found.Scheme)) {
                setFormData(prev => ({ ...prev, patientId: value, paymentMethod: 'insurance' }));
                return;
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.amount) {
            alert('Patient and amount are required');
            return;
        }
        try {
            setLoading(true);
            const paidBills = stateBillsToPay.map(b => ({ type: b.billType || b.department, id: b.id }));
            const payload = {
                ...formData,
                receivedBy: user?.id,
                paidBills: paidBills.length > 0 ? paidBills : undefined
            };
            if (isEdit) {
                await cashAPI.payments.update(id, payload);
                alert('Payment updated successfully');
            } else {
                await cashAPI.payments.create(payload);
                alert('Payment recorded successfully');
            }
            navigate('/app/cash/payments');
        } catch (error) {
            console.error('Error saving payment:', error);
            const errData = error.response?.data;
            const serverMsg = [errData?.detail || errData?.error, errData?.detail && errData?.error !== errData?.detail ? null : null]
                .filter(Boolean).join(': ')
                || errData?.error
                || error.message
                || 'Unknown error';
            const detailMsg = errData?.detail && errData.detail !== errData?.error ? `\n\nDetail: ${errData.detail}` : '';
            alert(`Failed to save payment:\n${errData?.error || error.message}${detailMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
    }

    const isFromLedger = stateBillsToPay.length > 0 && !isEdit;

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/cash/payments')} className="btn btn-secondary">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="page-title">{isEdit ? 'Edit Payment' : 'New Payment Receipt'}</h1>
                        <p className="page-subtitle">{isEdit ? 'Update payment information' : 'Record a new payment receipt'}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6">
                <div className="space-y-6">

                    {/* Bills Summary Banner */}
                    {isFromLedger && (
                        <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-white flex items-center gap-2">
                                    <CheckCircle size={16} className="text-accent" />
                                    <span className="bg-accent text-white text-xs font-black px-2 py-0.5 rounded-full">{stateBillsToPay.length}</span>
                                    Bills Selected for Settlement
                                </h4>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {uniqueDepts.map(d => (
                                        <span key={d} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">{d}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-white/50 uppercase tracking-widest">Total Settlement</div>
                                <div className="text-2xl font-black text-white">K {Number(prefilledAmount).toLocaleString()}</div>
                            </div>
                        </div>
                    )}

                    {/* Patient Info Banner (when pre-selected from ledger) */}
                    {selectedPatient && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                <User size={18} className="text-accent" />
                            </div>
                            <div>
                                <p className="font-black text-white">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                <p className="text-[10px] text-white/50 font-mono">{selectedPatient.patientNumber}
                                    {selectedPatient.schemeId || selectedPatient.Scheme
                                        ? <span className="ml-2 text-emerald-400 font-black uppercase tracking-widest">[Corporate Scheme Member]</span>
                                        : null}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                            <Wallet size={20} /> Payment Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Patient */}
                            <div className="form-group">
                                <label className="form-label">Patient <span className="text-error">*</span></label>
                                <select
                                    name="patientId"
                                    value={formData.patientId}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={String(p.id)}>
                                            {p.patientNumber} — {p.firstName} {p.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="form-group">
                                <label className="form-label">Amount (K) <span className="text-error">*</span></label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            {/* Payment Method — auto-set to insurance for scheme members */}
                            <div className="form-group">
                                <label className="form-label">Payment Method <span className="text-error">*</span></label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="mobile_money">Mobile Money</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="insurance">Corporate Scheme / Insurance</option>
                                </select>
                                {(selectedPatient?.schemeId || selectedPatient?.Scheme) && (
                                    <p className="text-[10px] text-emerald-400 mt-1">✓ Auto-set: patient is a corporate scheme member</p>
                                )}
                            </div>

                            {/* Reference Number */}
                            <div className="form-group">
                                <label className="form-label">Reference Number</label>
                                <input
                                    type="text"
                                    name="referenceNumber"
                                    value={formData.referenceNumber}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Transaction/Cheque number"
                                />
                            </div>

                            {/* Payment Date */}
                            <div className="form-group">
                                <label className="form-label">Payment Date <span className="text-error">*</span></label>
                                <input
                                    type="date"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            {/* Bill Type — auto-filled from ledger, editable for direct entry */}
                            <div className="form-group">
                                <label className="form-label">Bill Type</label>
                                {isFromLedger ? (
                                    <div className="form-input bg-white/5 border border-white/10 flex items-center gap-2 flex-wrap min-h-[42px]">
                                        {uniqueDepts.map(d => (
                                            <span key={d} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/20">{d}</span>
                                        ))}
                                        {uniqueDepts.length === 0 && <span className="text-white/30 text-xs">—</span>}
                                    </div>
                                ) : (
                                    <select
                                        name="billType"
                                        value={formData.billType}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="opd">OPD</option>
                                        <option value="ipd">IPD</option>
                                        <option value="pharmacy">Pharmacy</option>
                                        <option value="laboratory">Laboratory</option>
                                        <option value="radiology">Radiology</option>
                                        <option value="theatre">Theatre</option>
                                        <option value="maternity">Maternity</option>
                                        <option value="other">Other</option>
                                    </select>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="form-group md:col-span-2">
                                <label className="form-label">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Additional notes or remarks..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
                        <button type="button" onClick={() => navigate('/app/cash/payments')} className="btn btn-secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={18} className="mr-2" />
                            {loading ? 'Saving...' : isEdit ? 'Update Payment' : 'Record Payment'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PaymentForm;
