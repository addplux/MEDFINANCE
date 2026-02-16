import React, { useState, useEffect } from 'react';
import { pharmacyAPI, patientAPI } from '../../services/apiService';
import { ShoppingCart, User, Plus, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dispense = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedPatient, setSelectedPatient] = useState('');
    const [cart, setCart] = useState([]); // [{ medication, batchId, quantity, price, discount }]

    // Add Item Form State
    const [selectedMedication, setSelectedMedication] = useState('');
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedMedication) {
            fetchBatches(selectedMedication);
        } else {
            setBatches([]);
        }
    }, [selectedMedication]);

    const fetchInitialData = async () => {
        try {
            const [pRes, mRes] = await Promise.all([
                patientAPI.getAll(),
                pharmacyAPI.inventory.getAll()
            ]);
            setPatients(pRes.data);
            setMedications(mRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const fetchBatches = async (medId) => {
        try {
            const res = await pharmacyAPI.batches.getByMedication(medId);
            setBatches(res.data);
            if (res.data.length > 0) {
                setSelectedBatch(res.data[0].id); // Auto select first batch (FIFO)
            }
        } catch (error) {
            console.error('Failed to fetch batches:', error);
        }
    };

    const addToCart = () => {
        if (!selectedMedication || !selectedBatch || quantity <= 0) return;

        const med = medications.find(m => m.id == selectedMedication);
        const batch = batches.find(b => b.id == selectedBatch);

        if (!med || !batch) return;

        if (quantity > batch.quantityOnHand) {
            alert(`Insufficient stock! Available: ${batch.quantityOnHand}`);
            return;
        }

        const newItem = {
            medicationId: med.id,
            medicationName: med.name,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantity: parseInt(quantity),
            price: parseFloat(batch.sellingPrice),
            total: parseFloat(batch.sellingPrice) * parseInt(quantity)
        };

        setCart([...cart, newItem]);
        // Reset Item Form
        setSelectedMedication('');
        setBatches([]);
        setQuantity(1);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleDispense = async () => {
        if (!selectedPatient || cart.length === 0) return;

        try {
            setLoading(true);
            const payload = {
                patientId: selectedPatient,
                items: cart.map(item => ({
                    medicationId: item.medicationId,
                    batchId: item.batchId,
                    quantity: item.quantity,
                    discount: 0
                }))
            };

            await pharmacyAPI.dispense(payload);
            alert('Dispensed successfully!');
            navigate('/app/pharmacy/inventory');
        } catch (error) {
            console.error('Dispense failed:', error);
            alert('Failed to dispense medication');
        } finally {
            setLoading(false);
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Left Panel: Selection */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                <div className="card p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" /> Select Patient
                    </h2>
                    <select
                        className="form-select w-full"
                        value={selectedPatient}
                        onChange={e => setSelectedPatient(e.target.value)}
                    >
                        <option value="">-- Choose Patient --</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                    </select>
                </div>

                <div className="card p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add Medication
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Medication</label>
                            <select
                                className="form-select w-full"
                                value={selectedMedication}
                                onChange={e => setSelectedMedication(e.target.value)}
                            >
                                <option value="">-- Choose Medication --</option>
                                {medications.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} (Stock: {m.totalStock})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Batch (Expiry)</label>
                            <select
                                className="form-select w-full"
                                value={selectedBatch}
                                onChange={e => setSelectedBatch(e.target.value)}
                                disabled={!selectedMedication}
                            >
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.batchNumber} (Exp: {b.expiryDate}) - Qty: {b.quantityOnHand}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Quantity</label>
                            <input
                                type="number"
                                className="form-input"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                min="1"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={addToCart}
                                disabled={!selectedMedication || !selectedBatch}
                                className="btn btn-primary w-full"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Cart */}
            <div className="card p-6 flex flex-col h-full">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Dispensing Cart
                </h2>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
                            <div>
                                <div className="font-medium">{item.medicationName}</div>
                                <div className="text-xs text-text-secondary">
                                    Batch: {item.batchNumber} | Qty: {item.quantity} x K{item.price}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold">K{item.total.toFixed(2)}</span>
                                <button
                                    onClick={() => removeFromCart(index)}
                                    className="text-error hover:bg-error/10 p-1 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="text-center text-text-secondary py-10">
                            Cart is empty
                        </div>
                    )}
                </div>

                <div className="border-t border-border-color pt-4 mt-4 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Amount:</span>
                        <span>K{cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleDispense}
                        disabled={loading || cart.length === 0 || !selectedPatient}
                        className="btn btn-primary w-full py-3"
                    >
                        {loading ? 'Dispensing...' : 'Confirm Dispense'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dispense;
