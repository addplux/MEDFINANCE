import React, { useState, useEffect } from 'react';
import { radiologyAPI, patientAPI, setupAPI } from '../../services/apiService';
import { Save, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RadiologyRequestForm = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedScans, setSelectedScans] = useState([]);
    const [priority, setPriority] = useState('routine');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Let's assume Radiology services have department 'Radiology' or just fetch all services for now
            const [pRes, sRes] = await Promise.all([
                patientAPI.getAll(),
                setupAPI.services.getAll()
            ]);
            setPatients(pRes.data.data || []);

            // Filter services that belong to the Radiology department
            const allServices = sRes.data || [];
            const rScans = allServices.filter(s =>
                s.department?.departmentName?.toLowerCase().includes('radiology') ||
                s.category?.toLowerCase() === 'radiology' ||
                (s.departmentId === 3) // Hardcoded 3 based on earlier checks just in case
            );

            setScans(rScans.length > 0 ? rScans : allServices); // Fallback to all if filtering fails
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const toggleScan = (scanId) => {
        if (selectedScans.includes(scanId)) {
            setSelectedScans(selectedScans.filter(id => id !== scanId));
        } else {
            setSelectedScans([...selectedScans, scanId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient || selectedScans.length === 0) {
            alert('Please select a patient and at least one scan procedure.');
            return;
        }

        try {
            setLoading(true);
            await radiologyAPI.requests.create({
                patientId: selectedPatient,
                serviceIds: selectedScans,
                priority,
                clinicalNotes
            });
            alert('Radiology request created successfully!');
            navigate('/app/radiology/dashboard');
        } catch (error) {
            console.error('Failed to create request:', error);
            const detailMsg = error.response?.data?.details ? `: ${error.response.data.details}` : '';
            alert(`Failed to create radiology request${detailMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredScans = (scans || []).filter(s =>
        (s.serviceName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (s.category || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/radiology/dashboard')} className="btn btn-secondary">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">New Radiology Request</h1>
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
                    <label className="label">Clinical/Imaging Notes</label>
                    <textarea
                        className="form-textarea w-full"
                        rows="2"
                        value={clinicalNotes}
                        onChange={e => setClinicalNotes(e.target.value)}
                        placeholder="Reason for scan, area of interest, distinct symptoms..."
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="label">Select Scans / Procedures</label>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search scans..."
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
                                    <th className="p-3 text-left font-medium text-text-secondary">Procedure Name</th>
                                    <th className="p-3 text-left font-medium text-text-secondary">Category</th>
                                    <th className="p-3 text-right font-medium text-text-secondary">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color">
                                {filteredScans.map(scan => (
                                    <tr
                                        key={scan.id}
                                        className={`hover:bg-bg-tertiary/50 cursor-pointer ${selectedScans.includes(scan.id) ? 'bg-primary-50' : ''}`}
                                        onClick={() => toggleScan(scan.id)}
                                    >
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedScans.includes(scan.id)}
                                                readOnly
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="p-3 font-medium">{scan.serviceName || 'Unnamed Scan'}</td>
                                        <td className="p-3 text-sm text-text-secondary">{scan.category || 'N/A'}</td>
                                        <td className="p-3 text-right">K{parseFloat(scan.price || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-right text-sm text-text-secondary">
                        Selected: {selectedScans.length} scans
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border-color">
                    <button
                        type="submit"
                        disabled={loading || selectedScans.length === 0}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RadiologyRequestForm;
