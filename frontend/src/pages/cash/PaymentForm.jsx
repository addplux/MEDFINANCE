import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Wallet } from 'lucide-react';
import { cashAPI, patientAPI } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

const PaymentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        amount: '',
        paymentMethod: 'cash',
        referenceNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        billType: 'opd',
        billId: '',
        notes: ''
    });

    useEffect(() => {
        loadPatients();
        if (isEdit) {
            fetchPayment();
        }
    }, [id]);

    const loadPatients = async () => {
        try {
            const response = await patientAPI.getAll();
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.patientId || !formData.amount) {
            alert('Patient and amount are required');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                receivedBy: user?.id
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
            alert('Failed to save payment');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/cash/payments')}
                        className="btn btn-secondary"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="page-title">
                            {isEdit ? 'Edit Payment' : 'New Payment Receipt'}
                        </h1>
                        <p className="page-subtitle">
                            {isEdit ? 'Update payment information' : 'Record a new payment receipt'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6">
                <div className="space-y-6">
                    {/* Payment Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Wallet size={20} />
                            Payment Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">
                                    Patient <span className="text-error">*</span>
                                </label>
                                <select
                                    name="patientId"
                                    value={formData.patientId}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select Patient</option>
                                    {(patients || []).map(patient => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.firstName || ''} {patient.lastName || ''}
                                            {patient.dateOfBirth ? ` (${new Date(patient.dateOfBirth).getFullYear()})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Amount (K) <span className="text-error">*</span>
                                </label>
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

                            <div className="form-group">
                                <label className="form-label">
                                    Payment Method <span className="text-error">*</span>
                                </label>
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
                                </select>
                            </div>

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

                            <div className="form-group">
                                <label className="form-label">
                                    Payment Date <span className="text-error">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bill Type</label>
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
                                    <option value="other">Other</option>
                                </select>
                            </div>

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
                        <button
                            type="button"
                            onClick={() => navigate('/app/cash/payments')}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
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
