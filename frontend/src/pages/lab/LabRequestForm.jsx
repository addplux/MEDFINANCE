import React, { useState, useEffect } from 'react';
import { labAPI, patientAPI } from '../../services/apiService';
import { Save, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LabRequestForm = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedTests, setSelectedTests] = useState([]);
    const [priority, setPriority] = useState('routine');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [pRes, tRes] = await Promise.all([
                patientAPI.getAll(),
                labAPI.tests.getAll()
            ]);
            setPatients(pRes.data.data || []);
            setTests(tRes.data || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const toggleTest = (testId) => {
        if (selectedTests.includes(testId)) {
            setSelectedTests(selectedTests.filter(id => id !== testId));
        } else {
            setSelectedTests([...selectedTests, testId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient || selectedTests.length === 0) {
            alert('Please select a patient and at least one test.');
            return;
        }

        try {
            setLoading(true);
            await labAPI.requests.create({
                patientId: selectedPatient,
                testIds: selectedTests,
                priority,
                clinicalNotes
            });
            alert('Lab request created successfully!');
            navigate('/app/lab/dashboard');
        } catch (error) {
            console.error('Failed to create request:', error);
            alert('Failed to create lab request');
        } finally {
            setLoading(false);
        }
    };

    const filteredTests = (tests || []).filter(t =>
        (t.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (t.category || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/lab/dashboard')} className="btn btn-secondary">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">New Lab Request</h1>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label">Patient</label>
                        <select
                            className="form-select w-full"
                            value={selectedPatient}
                            onChange={e => setSelectedPatient(e.target.value)}
                            required
                        >
                            <option value="">-- Select Patient --</option>
                            {(patients || []).map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName || ''} {p.lastName || ''} {p.dateOfBirth ? `(${new Date(p.dateOfBirth).getFullYear()})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Priority</label>
                        <select
                            className="form-select w-full"
                            value={priority}
                            onChange={e => setPriority(e.target.value)}
                        >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="stat">STAT (Immediate)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Clinical Notes</label>
                    <textarea
                        className="form-textarea w-full"
                        rows="2"
                        value={clinicalNotes}
                        onChange={e => setClinicalNotes(e.target.value)}
                        placeholder="Reason for test, distinct symptoms..."
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="label">Select Tests</label>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tests..."
                                className="form-input pl-9 py-1 text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border border-border-color rounded-lg max-h-96 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-bg-tertiary sticky top-0">
                                <tr>
                                    <th className="p-3 text-left w-10"></th>
                                    <th className="p-3 text-left font-medium text-text-secondary">Test Name</th>
                                    <th className="p-3 text-left font-medium text-text-secondary">Category</th>
                                    <th className="p-3 text-right font-medium text-text-secondary">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color">
                                {filteredTests.map(test => (
                                    <tr
                                        key={test.id}
                                        className={`hover:bg-bg-tertiary/50 cursor-pointer ${selectedTests.includes(test.id) ? 'bg-primary-50' : ''}`}
                                        onClick={() => toggleTest(test.id)}
                                    >
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedTests.includes(test.id)}
                                                readOnly
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="p-3 font-medium">{test.name || 'Unnamed Test'}</td>
                                        <td className="p-3 text-sm text-text-secondary">{test.category || 'N/A'}</td>
                                        <td className="p-3 text-right">K{parseFloat(test.price || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-right text-sm text-text-secondary">
                        Selected: {selectedTests.length} tests
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border-color">
                    <button
                        type="submit"
                        disabled={loading || !selectedPatient || selectedTests.length === 0}
                        className="btn btn-primary"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LabRequestForm;
