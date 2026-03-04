import React, { useState } from 'react';
import { visitAPI } from '../../../services/apiService';
import { Stethoscope, ClipboardList, Send, CheckCircle } from 'lucide-react';

const DoctorWorkspace = ({ visitId, queueStatus, notes, onStatusChange }) => {
    const [loading, setLoading] = useState(false);
    const [clinicalNotes, setClinicalNotes] = useState(notes || '');

    const handleUpdateStatus = async (newStatus, assignedDepartment = null) => {
        setLoading(true);
        try {
            const updatePayload = { notes: clinicalNotes };
            if (assignedDepartment) updatePayload.assignedDepartment = assignedDepartment;
            await visitAPI.update(visitId, updatePayload);
            await visitAPI.updateQueueStatus(visitId, newStatus);
            if (onStatusChange) onStatusChange();
        } catch (err) {
            alert('Failed to update patient status');
        } finally {
            setLoading(false);
        }
    };

    if (queueStatus === 'pending_triage') return null;

    if (queueStatus === 'ready_for_discharge') {
        return (
            <div className="card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 mt-4">
                <h3 className="font-bold text-green-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" /> Patient Ready for Discharge / Billing
                </h3>
                <p className="text-sm text-green-700 mt-1">
                    The patient's consultation is complete. They must clear any pending bills before final discharge.
                </p>
            </div>
        );
    }

    return (
        <div className="card p-5 border border-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden mt-4">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />

            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-600" /> Doctor's Workspace
            </h3>

            <div className="space-y-4">
                <div className="form-group">
                    <label className="form-label text-xs font-semibold text-purple-900">Clinical Notes & Diagnosis</label>
                    <textarea
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        className="form-textarea text-sm min-h-[120px]"
                        placeholder="Enter patient complaints, examination findings, and diagnosis here..."
                    />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                    {queueStatus === 'waiting_doctor' && (
                        <button
                            onClick={() => handleUpdateStatus('with_doctor')}
                            disabled={loading}
                            className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600 text-sm py-1.5"
                        >
                            <Stethoscope className="w-4 h-4" /> Start Consultation
                        </button>
                    )}

                    {queueStatus === 'with_doctor' && (
                        <>
                            <button
                                onClick={() => handleUpdateStatus('pending_results')}
                                disabled={loading}
                                className="btn btn-secondary border-yellow-500 text-yellow-700 hover:bg-yellow-50 text-sm py-1.5"
                            >
                                <ClipboardList className="w-4 h-4 text-yellow-500" /> Awaiting Labs/X-Ray
                            </button>

                            <button
                                onClick={() => handleUpdateStatus('ready_for_discharge', 'Pharmacy')}
                                disabled={loading}
                                className="btn bg-green-500 hover:bg-green-600 text-white border-green-500 text-sm py-1.5"
                            >
                                <Send className="w-4 h-4" /> Send to Pharmacy
                            </button>

                            <button
                                onClick={() => handleUpdateStatus('ready_for_discharge')}
                                disabled={loading}
                                className="btn bg-orange-500 hover:bg-orange-600 text-white border-orange-500 text-sm py-1.5"
                            >
                                <Send className="w-4 h-4" /> Ready for Discharge
                            </button>
                        </>
                    )}

                    {queueStatus === 'pending_results' && (
                        <button
                            onClick={() => handleUpdateStatus('with_doctor')}
                            disabled={loading}
                            className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600 text-sm py-1.5"
                        >
                            <Stethoscope className="w-4 h-4" /> Resume Consultation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorWorkspace;
