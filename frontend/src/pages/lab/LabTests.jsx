import React, { useState, useEffect } from 'react';
import { labAPI } from '../../services/apiService';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LabTests = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'Hematology',
        price: '',
        normalRange: '',
        units: ''
    });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const response = await labAPI.tests.getAll();
            setTests(response.data);
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await labAPI.tests.create(formData);
            setShowModal(false);
            setFormData({
                name: '',
                code: '',
                category: 'Hematology',
                price: '',
                normalRange: '',
                units: ''
            });
            fetchTests();
        } catch (error) {
            alert('Failed to create test');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/lab/dashboard')} className="btn btn-secondary">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Lab Test Catalog</h1>
                        <p className="text-text-secondary">Manage available laboratory tests</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Test
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary border-b border-border-color">
                            <tr>
                                <th className="text-left p-4 font-medium text-text-secondary">Code</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Name</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Category</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Range / Units</th>
                                <th className="text-right p-4 font-medium text-text-secondary">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {tests.map((test) => (
                                <tr key={test.id} className="hover:bg-bg-tertiary/50">
                                    <td className="p-4 text-text-secondary">{test.code}</td>
                                    <td className="p-4 font-medium text-text-primary">{test.name}</td>
                                    <td className="p-4 text-text-secondary">{test.category}</td>
                                    <td className="p-4 text-text-secondary">
                                        {test.normalRange} {test.units && `(${test.units})`}
                                    </td>
                                    <td className="p-4 text-right">K{parseFloat(test.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4">
                        <h2 className="text-xl font-bold">Add New Lab Test</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Name</label>
                                    <input
                                        className="form-input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Code</label>
                                    <input
                                        className="form-input"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Category</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Hematology</option>
                                        <option>Biochemistry</option>
                                        <option>Microbiology</option>
                                        <option>Serology</option>
                                        <option>Radiology</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Price (K)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Normal Range</label>
                                    <input
                                        className="form-input"
                                        value={formData.normalRange}
                                        onChange={e => setFormData({ ...formData, normalRange: e.target.value })}
                                        placeholder="e.g. 10-50"
                                    />
                                </div>
                                <div>
                                    <label className="label">Units</label>
                                    <input
                                        className="form-input"
                                        value={formData.units}
                                        onChange={e => setFormData({ ...formData, units: e.target.value })}
                                        placeholder="e.g. mg/dL"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Test</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTests;
