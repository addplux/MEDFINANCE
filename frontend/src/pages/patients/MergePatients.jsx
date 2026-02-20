import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/apiService';
import { ArrowLeft, Search, Merge, AlertTriangle, ArrowRight } from 'lucide-react';

const MergePatients = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Search states
    const [primarySearch, setPrimarySearch] = useState('');
    const [duplicateSearch, setDuplicateSearch] = useState('');
    const [primaryResults, setPrimaryResults] = useState([]);
    const [duplicateResults, setDuplicateResults] = useState([]);

    // Selection states
    const [primaryPatient, setPrimaryPatient] = useState(null);
    const [duplicatePatient, setDuplicatePatient] = useState(null);

    const searchPatients = async (query, setResults) => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }
        try {
            const response = await patientAPI.getAll({ search: query, limit: 5 });
            setResults(response.data.data);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleMerge = async () => {
        if (!primaryPatient || !duplicatePatient) return;

        if (!window.confirm(`Are you sure you want to merge ${duplicatePatient.firstName} ${duplicatePatient.lastName} INTO ${primaryPatient.firstName} ${primaryPatient.lastName}? This cation cannot be undone and the duplicate record will be deleted.`)) {
            return;
        }

        try {
            setLoading(true);
            await patientAPI.merge({
                primaryId: primaryPatient.id,
                duplicateId: duplicatePatient.id
            });
            alert('Patients merged successfully!');
            navigate(`/app/patients/${primaryPatient.id}`);
        } catch (error) {
            console.error('Merge failed:', error);
            alert(error.response?.data?.error || 'Failed to merge patients');
        } finally {
            setLoading(false);
        }
    };

    const PatientCard = ({ patient, type, onClear }) => {
        if (!patient) return null;
        return (
            <div className={`p-4 rounded-lg border-2 ${type === 'primary' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${type === 'primary' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {type === 'primary' ? 'PRIMARY (KEEP)' : 'DUPLICATE (DELETE)'}
                    </span>
                    <button onClick={onClear} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>
                <div className="flex gap-4">
                    {patient.photoUrl && (
                        <img src={`http://localhost:5000${patient.photoUrl}`} alt="Patient" className="w-16 h-16 rounded-full object-cover" />
                    )}
                    <div>
                        <h3 className="font-bold text-lg">{patient.firstName} {patient.lastName}</h3>
                        <p className="text-sm text-gray-600">{patient.patientNumber}</p>
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                            <p>DOB: {patient.dateOfBirth}</p>
                            <p>Gender: {patient.gender}</p>
                            <p>NRC: {patient.nrc || 'N/A'}</p>
                            <p>Phone: {patient.phone || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/patients')}
                    className="btn btn-secondary"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Merge Patients</h1>
                    <p className="text-gray-600 mt-1">Combine duplicate patient records into a single profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Primary Patient Selection */}
                <div className="card p-6 min-h-[400px]">
                    <h2 className="text-xl font-bold mb-4 text-green-700">1. Select Primary Record</h2>
                    <p className="text-sm text-gray-500 mb-4">This record will be KEPT. All data from the duplicate will be moved here.</p>

                    {!primaryPatient ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or NRC..."
                                className="form-input pl-10"
                                value={primarySearch}
                                onChange={(e) => {
                                    setPrimarySearch(e.target.value);
                                    searchPatients(e.target.value, setPrimaryResults);
                                }}
                            />
                            {primaryResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {primaryResults.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                if (duplicatePatient && duplicatePatient.id === p.id) {
                                                    alert('Cannot select same patient as duplicate');
                                                    return;
                                                }
                                                setPrimaryPatient(p);
                                                setPrimarySearch('');
                                                setPrimaryResults([]);
                                            }}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                        >
                                            <div className="font-medium">{p.firstName} {p.lastName}</div>
                                            <div className="text-xs text-gray-500">{p.patientNumber} | {p.nrc}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <PatientCard
                            patient={primaryPatient}
                            type="primary"
                            onClear={() => setPrimaryPatient(null)}
                        />
                    )}
                </div>

                {/* Duplicate Patient Selection */}
                <div className="card p-6 min-h-[400px]">
                    <h2 className="text-xl font-bold mb-4 text-red-700">2. Select Duplicate Record</h2>
                    <p className="text-sm text-gray-500 mb-4">This record will be DELETED after data transfer.</p>

                    {!duplicatePatient ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or NRC..."
                                className="form-input pl-10"
                                value={duplicateSearch}
                                onChange={(e) => {
                                    setDuplicateSearch(e.target.value);
                                    searchPatients(e.target.value, setDuplicateResults);
                                }}
                            />
                            {duplicateResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {duplicateResults.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                if (primaryPatient && primaryPatient.id === p.id) {
                                                    alert('Cannot select same patient as primary');
                                                    return;
                                                }
                                                setDuplicatePatient(p);
                                                setDuplicateSearch('');
                                                setDuplicateResults([]);
                                            }}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                        >
                                            <div className="font-medium">{p.firstName} {p.lastName}</div>
                                            <div className="text-xs text-gray-500">{p.patientNumber} | {p.nrc}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <PatientCard
                            patient={duplicatePatient}
                            type="duplicate"
                            onClear={() => setDuplicatePatient(null)}
                        />
                    )}
                </div>
            </div>

            {/* Merge Action */}
            <div className="flex justify-center mt-8">
                <button
                    onClick={handleMerge}
                    disabled={!primaryPatient || !duplicatePatient || loading}
                    className="btn btn-primary px-8 py-4 text-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="loading loading-spinner"></span>
                    ) : (
                        <>
                            <Merge className="w-6 h-6" />
                            Confirm Merge
                        </>
                    )}
                </button>
            </div>

            {primaryPatient && duplicatePatient && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 justify-center max-w-2xl mx-auto">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-bold">Warning: This action is irreversible.</p>
                        <p>All bills, payments, and history from <strong>{duplicatePatient.firstName} {duplicatePatient.lastName}</strong> will be moved to <strong>{primaryPatient.firstName} {primaryPatient.lastName}</strong>. The duplicate record will be permanently deleted.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MergePatients;
