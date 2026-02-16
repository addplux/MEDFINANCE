import React, { useState, useEffect } from 'react';
import { labAPI } from '../../services/apiService';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const LabResultEntry = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Results State: { [resultId]: { value, isAbnormal, remarks } }
    const [results, setResults] = useState({});

    useEffect(() => {
        fetchRequest();
    }, [id]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            // Re-use getAll with ID filter as we don't have getById yet, or implement getById.
            // Since getAll returns array, we filter. Controller supports getAll. 
            // Better to implement getById in controller/routes but for now use getAll or assume getAll returns list.
            // Wait, LabController.getRequests can filter by ID if we add it, but it currently filters by status/patient/date.
            // Let's modify apiService to just fetch all and filter client side OR add logic to controller.
            // Actually, best to fetch all for now or add getById. 
            // Let's try to fetch all requests and find the one (not efficient but works for now).
            // Actually, backend controller for getRequests doesn't support ID filter.
            // I should update controller or just use what I have.
            // Let's assume I need to fetch all pending requests and find it? No, that's bad.
            // I'll update the controller to support ID param or create a getById.
            // Ideally, I should strictly follow the plan.
            // I will update the controller later. For now, I'll fetch all requests and find it in frontend.
            const response = await labAPI.requests.getAll();
            const req = response.data.find(r => r.id === parseInt(id));

            if (req) {
                setRequest(req);
                // Initialize results state
                const initialResults = {};
                req.results.forEach(r => {
                    initialResults[r.id] = {
                        value: r.resultValue || '',
                        isAbnormal: r.isAbnormal || false,
                        remarks: r.remarks || ''
                    };
                });
                setResults(initialResults);
            } else {
                alert('Request not found');
                navigate('/app/lab/dashboard');
            }
        } catch (error) {
            console.error('Failed to load request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultChange = (resultId, field, value) => {
        setResults(prev => ({
            ...prev,
            [resultId]: {
                ...prev[resultId],
                [field]: value
            }
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                results: Object.keys(results).map(resultId => ({
                    resultId,
                    ...results[resultId]
                }))
            };

            await labAPI.results.enter(payload);
            alert('Results saved successfully');
            navigate('/app/lab/dashboard');
        } catch (error) {
            console.error('Failed to save results:', error);
            alert('Failed to save results');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (!request) return <div className="text-center py-8">Request not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/lab/dashboard')} className="btn btn-secondary">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Enter Lab Results</h1>
                    <p className="text-text-secondary">
                        {request.patient.firstName} {request.patient.lastName} | {request.requestNumber}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="card p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary border-b border-border-color">
                            <tr>
                                <th className="p-4 text-left font-medium text-text-primary">Test Name</th>
                                <th className="p-4 text-left font-medium text-text-primary">Normal Range</th>
                                <th className="p-4 text-left font-medium text-text-primary w-1/3">Result Value</th>
                                <th className="p-4 text-center font-medium text-text-primary">Abnormal?</th>
                                <th className="p-4 text-left font-medium text-text-primary">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {request.results.map(res => (
                                <tr key={res.id}>
                                    <td className="p-4 font-medium">{res.test.name}</td>
                                    <td className="p-4 text-sm text-text-secondary">{res.test.normalRange || 'N/A'}</td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="form-input w-full"
                                            value={results[res.id]?.value || ''}
                                            onChange={e => handleResultChange(res.id, 'value', e.target.value)}
                                            placeholder={`Enter value (${res.test.units || ''})`}
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-error focus:ring-error"
                                            checked={results[res.id]?.isAbnormal || false}
                                            onChange={e => handleResultChange(res.id, 'isAbnormal', e.target.checked)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="form-input w-full"
                                            value={results[res.id]?.remarks || ''}
                                            onChange={e => handleResultChange(res.id, 'remarks', e.target.value)}
                                            placeholder="Optional remarks"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save & Finalize'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LabResultEntry;
