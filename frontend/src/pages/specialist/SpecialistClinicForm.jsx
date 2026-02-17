import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { specialistClinicAPI, patientAPI } from '../../services/apiService';
import { ArrowLeft, Save, Search, User, Calendar, DollarSign, FileText } from 'lucide-react';

const SpecialistClinicForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Patient Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showResults, setShowResults] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        clinicType: 'cardiology',
        specialistName: '',
        consultationDate: new Date().toISOString().split('T')[0],
        consultationFees: 0,
        procedureFees: 0,
        diagnosticTests: 0,
        medications: 0,
        diagnosis: '',
        notes: '',
        followUpRequired: false,
        followUpDate: ''
    });

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 1) {
                setSearching(true);
                try {
                    const response = await patientAPI.getAll({ search: searchTerm, limit: 10 });
                    setPatients(response.data);
                    setShowResults(true);
                } catch (error) {
                    console.error('Search failed:', error);
                } finally {
                    setSearching(false);
                }
            } else {
                setPatients([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setSearchTerm('');
        setShowResults(false);
    };

    const calculateTotal = () => {
        return (
            parseFloat(formData.consultationFees || 0) +
            parseFloat(formData.procedureFees || 0) +
            parseFloat(formData.diagnosticTests || 0) +
            parseFloat(formData.medications || 0)
        ).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient) {
            alert('Please select a patient');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                patientId: selectedPatient.id,
                totalAmount: calculateTotal()
            };

            await specialistClinicAPI.bills.create(payload);
            navigate('/app/specialist-clinics');
        } catch (error) {
            console.error('Failed to create bill:', error);
            alert('Failed to create bill. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clinicTypes = [
        'cardiology', 'orthopedics', 'neurology', 'dermatology',
        'ophthalmology', 'ent', 'gynecology', 'urology',
        'pediatrics', 'psychiatry', 'other'
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/specialist-clinics')} className="btn btn-secondary">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Specialist Consultation</h1>
                    <p className="text-gray-500">Create a new bill for specialist services</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Patient Selection */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" />
                        Patient Details
                    </h2>

                    {!selectedPatient ? (
                        <div className="relative">
                            <label className="form-label">Search Patient</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    className="form-input pl-10"
                                    placeholder="Search by name or file number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                        Searching...
                                    </div>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && patients.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {patients.map(patient => (
                                        <button
                                            key={patient.id}
                                            type="button"
                                            onClick={() => handlePatientSelect(patient)}
                                            className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {patient.firstName} {patient.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {patient.gender} • {new Date(patient.dateOfBirth).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                {patient.patientNumber}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-indigo-900">
                                    {selectedPatient.firstName} {selectedPatient.lastName}
                                </h3>
                                <p className="text-indigo-700 text-sm mt-1">
                                    {selectedPatient.patientNumber} • {selectedPatient.gender} • {calculateAge(selectedPatient.dateOfBirth)} years
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-200">
                                        {selectedPatient.paymentMethod.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPatient(null)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Clinic Info */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        Consultation Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="form-group">
                            <label className="form-label">Clinic Type</label>
                            <select
                                className="form-select capitalize"
                                value={formData.clinicType}
                                onChange={(e) => setFormData({ ...formData, clinicType: e.target.value })}
                            >
                                {clinicTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Specialist Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Dr. Name"
                                value={formData.specialistName}
                                onChange={(e) => setFormData({ ...formData, specialistName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.consultationDate}
                                onChange={(e) => setFormData({ ...formData, consultationDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Financials */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-indigo-500" />
                        Billing & Fees
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="form-group">
                            <label className="form-label">Consultation Fees</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                step="0.01"
                                value={formData.consultationFees}
                                onChange={(e) => setFormData({ ...formData, consultationFees: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Procedure Fees</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                step="0.01"
                                value={formData.procedureFees}
                                onChange={(e) => setFormData({ ...formData, procedureFees: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Diagnostic Tests</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                step="0.01"
                                value={formData.diagnosticTests}
                                onChange={(e) => setFormData({ ...formData, diagnosticTests: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Medications</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                step="0.01"
                                value={formData.medications}
                                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-indigo-600">
                            ZK {calculateTotal()}
                        </span>
                    </div>
                </div>

                {/* 4. Clinical Notes */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        Clinical Notes
                    </h2>
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label">Diagnosis</label>
                            <textarea
                                className="form-textarea"
                                rows="2"
                                placeholder="Preliminary diagnosis..."
                                value={formData.diagnosis}
                                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Additional Notes</label>
                            <textarea
                                className="form-textarea"
                                rows="3"
                                placeholder="Treatment plan, instructions..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Follow Up */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            id="followUp"
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={formData.followUpRequired}
                            onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                        />
                        <label htmlFor="followUp" className="text-md font-medium text-gray-700">Follow-up appointment required</label>
                    </div>

                    {formData.followUpRequired && (
                        <div className="form-group max-w-xs">
                            <label className="form-label">Follow-up Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                required={formData.followUpRequired}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/app/specialist-clinics')}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary min-w-[120px]"
                    >
                        {loading ? 'Saving...' : 'Save Consultation'}
                    </button>
                </div>

            </form>
        </div>
    );
};

// Helper for age
const calculateAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export default SpecialistClinicForm;
