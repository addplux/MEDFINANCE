import React, { useState, useEffect } from 'react';
import { pharmacyAPI } from '../../services/apiService';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GoodsReceivedNote = () => {
    const navigate = useNavigate();
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        medicationId: '',
        batchNumber: '',
        expiryDate: '',
        quantity: '',
        unitCost: '',
        sellingPrice: '',
        supplier: ''
    });

    useEffect(() => {
        fetchMedications();
    }, []);

    const fetchMedications = async () => {
        try {
            const response = await pharmacyAPI.inventory.getAll();
            setMedications(response.data);
        } catch (error) {
            console.error('Failed to fetch medications:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await pharmacyAPI.grn.receive(formData);
            alert('Stock received successfully');
            navigate('/app/pharmacy/inventory');
        } catch (error) {
            console.error('Failed to receive stock:', error);
            alert('Failed to receive stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/pharmacy/inventory')} className="btn btn-secondary">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Goods Received Note (GRN)</h1>
            </div>

            <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Medication</label>
                        <select
                            className="form-select"
                            value={formData.medicationId}
                            onChange={e => setFormData({ ...formData, medicationId: e.target.value })}
                            required
                        >
                            <option value="">Select Medication</option>
                            {medications.map(med => (
                                <option key={med.id} value={med.id}>{med.name} ({med.unitOfMeasure})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Batch Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.batchNumber}
                                onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Expiry Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="label">Quantity Received</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Unit Cost (K)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.unitCost}
                                onChange={e => setFormData({ ...formData, unitCost: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Selling Price (K)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.sellingPrice}
                                onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Supplier</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.supplier}
                            onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Processing...' : 'Receive Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoodsReceivedNote;
