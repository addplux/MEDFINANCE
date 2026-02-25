import React, { useState, useEffect } from 'react';
import { pharmacyAPI, patientAPI } from '../../services/apiService';
import { ShoppingCart, User, Plus, Trash2, Save, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPaymentStatusBadge } from '../../utils/statusBadges';

const Dispense = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedPatientName, setSelectedPatientName] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);
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
            setPatients(pRes.data.data || []);
            setMedications(mRes.data || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const fetchBatches = async (medId) => {
        try {
            const res = await pharmacyAPI.batches.getByMedication(medId);
            setBatches(res.data || []);
            if (res.data && res.data.length > 0) {
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
            <div className="lg:col-span-2 space-y-6 pr-2">
                <div className="card p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" /> Select Patient
                    </h2>

                    {/* Searchable patient combobox */}
                    <div className="relative">
                        {selectedPatient ? (
                            <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg border border-border-color">
                                <User className="w-4 h-4 text-primary" />
                                <span className="flex-1 font-medium">{selectedPatientName}</span>
                                <button
                                    onClick={() => { setSelectedPatient(''); setSelectedPatientName(''); setPatientSearch(''); }}
                                    className="text-text-secondary hover:text-error transition-colors text-lg leading-none"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    placeholder="Search patient by name or number..."
                                    value={patientSearch}
                                    onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                                    onFocus={() => setShowPatientList(true)}
                                />
                                {showPatientList && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-color rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {(patients || [])
                                            .filter(p =>
                                                !patientSearch ||
                                                `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                                (p.patientNumber || '').toLowerCase().includes(patientSearch.toLowerCase())
                                            )
                                            .slice(0, 20)
                                            .map(p => (
                                                <button
                                                    key={p.id}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-primary/10 text-sm flex items-center gap-2 transition-colors"
                                                    onMouseDown={() => {
                                                        setSelectedPatient(p.id);
                                                        setSelectedPatientName(`${p.patientNumber ? p.patientNumber + ' — ' : ''}${p.firstName} ${p.lastName}`);
                                                        setPatientSearch('');
                                                        setShowPatientList(false);
                                                    }}
                                                >
                                                    <span className="text-xs text-text-secondary w-20 shrink-0">{p.patientNumber}</span>
                                                    <span className="font-medium">{p.firstName} {p.lastName}</span>
                                                </button>
                                            ))}
                                        {patients.filter(p =>
                                            !patientSearch ||
                                            `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                            (p.patientNumber || '').toLowerCase().includes(patientSearch.toLowerCase())
                                        ).length === 0 && (
                                                <div className="px-4 py-3 text-sm text-text-secondary">No patients found</div>
                                            )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add Medication
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Medication</label>
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
                            <label className="form-label">Batch (Expiry)</label>
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
                            <label className="form-label">Quantity</label>
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

                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
                        <Activity className="w-4 h-4 inline-block mr-1" />
                        Once dispensed, these items will generate a bill with status: <strong>Unpaid</strong>.
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
