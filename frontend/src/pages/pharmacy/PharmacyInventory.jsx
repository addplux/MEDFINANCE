import React, { useState, useEffect } from 'react';
import { pharmacyAPI } from '../../services/apiService';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';

const PharmacyInventory = () => {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'Tablet',
        unitOfMeasure: 'Box',
        reorderLevel: 10,
        description: '',
        manufacturer: ''
    });

    useEffect(() => {
        fetchMedications();
    }, [searchTerm]);

    const fetchMedications = async () => {
        try {
            setLoading(true);
            const response = await pharmacyAPI.inventory.getAll({ search: searchTerm });
            setMedications(response.data);
        } catch (error) {
            console.error('Failed to fetch medications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await pharmacyAPI.inventory.create(formData);
            setShowModal(false);
            setFormData({
                name: '',
                code: '',
                category: 'Tablet',
                unitOfMeasure: 'Box',
                reorderLevel: 10,
                description: '',
                manufacturer: ''
            });
            fetchMedications();
        } catch (error) {
            alert('Failed to create medication');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Pharmacy Inventory</h1>
                    <p className="text-text-secondary">Manage medication list and stock levels</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Medication
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                />
            </div>

            {/* Inventory List */}
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary border-b border-border-color">
                            <tr>
                                <th className="text-left p-4 font-medium text-text-secondary">Name</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Code</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Category</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Stock</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {medications.map((med) => (
                                <tr key={med.id} className="hover:bg-bg-tertiary/50">
                                    <td className="p-4 font-medium text-text-primary">{med.name}</td>
                                    <td className="p-4 text-text-secondary">{med.code}</td>
                                    <td className="p-4 text-text-secondary">{med.category}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${med.totalStock <= med.reorderLevel ? 'text-error' : 'text-success'}`}>
                                                {med.totalStock} {med.unitOfMeasure}
                                            </span>
                                            {med.totalStock <= med.reorderLevel && (
                                                <AlertTriangle className="w-4 h-4 text-warning" title="Low Stock" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`badge ${med.isActive ? 'badge-success' : 'badge-error'}`}>
                                            {med.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {medications.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-secondary">
                                        No medications found. Add one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Medication Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-bg-secondary border border-border-color rounded-lg p-6 max-w-lg w-full space-y-4">
                        <h2 className="text-xl font-bold">Add New Medication</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Tablet</option>
                                        <option>Syrup</option>
                                        <option>Injection</option>
                                        <option>Consumable</option>
                                        <option>Cream</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Unit</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.unitOfMeasure}
                                        onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                                        placeholder="e.g. Box, Bottle"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Reorder Level</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.reorderLevel}
                                        onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Manufacturer</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.manufacturer}
                                        onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Medication</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyInventory;
