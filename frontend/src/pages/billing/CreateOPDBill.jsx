import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, patientAPI, setupAPI } from '../../services/apiService';
import { ArrowLeft, Save, Plus } from 'lucide-react';

const CreateOPDBill = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        serviceId: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        billDate: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [patientsRes, servicesRes] = await Promise.all([
                patientAPI.getAll({ limit: 100 }),
                setupAPI.services.getAll({ category: 'opd' })
            ]);
            setPatients(patientsRes.data.data || []);
            setServices(servicesRes.data || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const handleServiceChange = (serviceId) => {
        const service = services.find(s => s.id === parseInt(serviceId));
        const patient = patients.find(p => p.id === parseInt(formData.patientId));

        let price = service?.price || 0;

        if (patient && service) {
            const tier = patient.paymentMethod;
            if (tier === 'cash' && service.cashPrice > 0) price = service.cashPrice;
            else if (tier === 'nhima' && service.nhimaPrice > 0) price = service.nhimaPrice;
            else if (tier === 'corporate' && service.corporatePrice > 0) price = service.corporatePrice;
            else if (tier === 'scheme' && service.schemePrice > 0) price = service.schemePrice;
            else if (tier === 'staff' && service.staffPrice > 0) price = service.staffPrice;
        }

        setFormData(prev => ({
            ...prev,
            serviceId,
            unitPrice: price
        }));
    };

    const calculateAmounts = () => {
        const grossAmount = formData.unitPrice * formData.quantity;
        const netAmount = grossAmount - (formData.discount || 0);
        return { grossAmount, netAmount };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (!formData.patientId) newErrors.patientId = 'Patient is required';
        if (!formData.serviceId) newErrors.serviceId = 'Service is required';
        if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const { grossAmount, netAmount } = calculateAmounts();

            await billingAPI.opd.create({
                ...formData,
                patientId: parseInt(formData.patientId),
                serviceId: parseInt(formData.serviceId),
                quantity: parseInt(formData.quantity),
                unitPrice: parseFloat(formData.unitPrice),
                grossAmount,
                discount: parseFloat(formData.discount) || 0,
                netAmount,
                status: 'pending'
            });

            navigate('/app/billing/opd');
        } catch (error) {
            console.error('Failed to create bill:', error);
            alert(error.response?.data?.error || 'Failed to create bill');
        } finally {
            setLoading(false);
        }
    };

    const { grossAmount, netAmount } = calculateAmounts();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/billing/opd')}
                    className="btn btn-secondary"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create OPD Bill</h1>
                    <p className="text-gray-600 mt-1">Generate a new outpatient bill</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Selection */}
                    <div className="form-group">
                        <label className="form-label">Patient *</label>
                        <select
                            value={formData.patientId}
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            className={`form-select ${errors.patientId ? 'border-red-500' : ''}`}
                            required
                        >
                            <option value="">Select Patient</option>
                            {patients.map(patient => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.patientNumber} - {patient.firstName} {patient.lastName}
                                </option>
                            ))}
                        </select>
                        {errors.patientId && (
                            <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>
                        )}
                    </div>

                    {/* Service Selection */}
                    <div className="form-group">
                        <label className="form-label">Service *</label>
                        <select
                            value={formData.serviceId}
                            onChange={(e) => handleServiceChange(e.target.value)}
                            className={`form-select ${errors.serviceId ? 'border-red-500' : ''}`}
                            required
                        >
                            <option value="">Select Service</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.serviceName} - K{service.price}
                                </option>
                            ))}
                        </select>
                        {errors.serviceId && (
                            <p className="text-red-500 text-sm mt-1">{errors.serviceId}</p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="form-group">
                        <label className="form-label">Quantity *</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    {/* Unit Price */}
                    <div className="form-group">
                        <label className="form-label">Unit Price (K) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.unitPrice}
                            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    {/* Discount */}
                    <div className="form-group">
                        <label className="form-label">Discount (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    {/* Bill Date */}
                    <div className="form-group">
                        <label className="form-label">Bill Date *</label>
                        <input
                            type="date"
                            value={formData.billDate}
                            onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div className="form-group md:col-span-2">
                        <label className="form-label">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="form-textarea"
                            rows="3"
                            placeholder="Additional notes..."
                        />
                    </div>
                </div>

                {/* Amount Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-sm text-gray-600">Gross Amount</div>
                            <div className="text-xl font-bold text-gray-900">K {grossAmount.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Discount</div>
                            <div className="text-xl font-bold text-orange-600">- K {(formData.discount || 0).toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Net Amount</div>
                            <div className="text-2xl font-bold text-primary-600">K {netAmount.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/app/billing/opd')}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Creating...' : 'Create Bill'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateOPDBill;
