import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maternityAPI, patientAPI } from '../../services/apiService';
import { ArrowLeft, Save, Search, User, Baby, DollarSign, FileText, Calendar, Activity } from 'lucide-react';

const MaternityBillForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Patient Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        admissionDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        deliveryType: 'normal',
        doctorName: '',
        nurseName: '',
        bedCharges: 0,
        deliveryCharges: 0,
        doctorFees: 0,
        nurseFees: 0,
        medications: 0,
        labTests: 0,
        notes: ''
    });

    // Baby Details (JSON field)
    const [babyDetails, setBabyDetails] = useState({
        name: '',
        gender: 'male',
        weight: '',
        timeOfBirth: '',
        status: 'healthy'
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
            parseFloat(formData.bedCharges || 0) +
            parseFloat(formData.deliveryCharges || 0) +
            parseFloat(formData.doctorFees || 0) +
            parseFloat(formData.nurseFees || 0) +
            parseFloat(formData.medications || 0) +
            parseFloat(formData.labTests || 0)
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
                totalAmount: calculateTotal(),
                babyDetails: babyDetails
            };

            await maternityAPI.bills.create(payload);
            navigate('/app/maternity');
        } catch (error) {
            console.error('Failed to create bill:', error);
            alert('Failed to create bill. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/maternity')} className="btn btn-secondary">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Maternity Bill</h1>
                    <p className="text-gray-500">Record delivery and associated charges</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Patient Selection */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-pink-500" />
                        Mother's Details
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
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Searching...</div>
                                )}
                            </div>

                            {/* Results */}
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
                                                <p className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
                                                <p className="text-sm text-gray-500">{patient.gender} • {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
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
                        <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-pink-900">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                                <p className="text-pink-700 text-sm mt-1">{selectedPatient.patientNumber}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPatient(null)}
                                className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Delivery Info */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-pink-500" />
                        Delivery Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label className="form-label">Delivery Type</label>
                            <select
                                className="form-select capitalize"
                                value={formData.deliveryType}
                                onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                            >
                                <option value="normal">Normal Delivery</option>
                                <option value="c-section">C-Section</option>
                                <option value="assisted">Assisted Delivery</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Admission Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.admissionDate}
                                onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Delivery Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Primary Doctor</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Dr. Name"
                                value={formData.doctorName}
                                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Baby Details */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Baby className="w-5 h-5 text-pink-500" />
                        Baby Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select
                                className="form-select"
                                value={babyDetails.gender}
                                onChange={(e) => setBabyDetails({ ...babyDetails, gender: e.target.value })}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Weight (kg)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 3.5"
                                value={babyDetails.weight}
                                onChange={(e) => setBabyDetails({ ...babyDetails, weight: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Time of Birth</label>
                            <input
                                type="time"
                                className="form-input"
                                value={babyDetails.timeOfBirth}
                                onChange={(e) => setBabyDetails({ ...babyDetails, timeOfBirth: e.target.value })}
                            />
                        </div>
                        <div className="form-group md:col-span-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={babyDetails.status}
                                onChange={(e) => setBabyDetails({ ...babyDetails, status: e.target.value })}
                            >
                                <option value="healthy">Healthy</option>
                                <option value="nicu">NICU Admission</option>
                                <option value="observation">Under Observation</option>
                                <option value="stillbirth">Stillbirth</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Financials */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-pink-500" />
                        Charges Breakdown
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="form-group">
                            <label className="form-label">Delivery Charges</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0" step="0.01"
                                value={formData.deliveryCharges}
                                onChange={(e) => setFormData({ ...formData, deliveryCharges: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bed/Ward Charges</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0" step="0.01"
                                value={formData.bedCharges}
                                onChange={(e) => setFormData({ ...formData, bedCharges: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Doctor Fees</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0" step="0.01"
                                value={formData.doctorFees}
                                onChange={(e) => setFormData({ ...formData, doctorFees: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nurse Fees</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0" step="0.01"
                                value={formData.nurseFees}
                                onChange={(e) => setFormData({ ...formData, nurseFees: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Medications</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0" step="0.01"
                                value={formData.medications}
                                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lab Tests</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0" step="0.01"
                                value={formData.labTests}
                                onChange={(e) => setFormData({ ...formData, labTests: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Bill Amount</span>
                        <span className="text-2xl font-bold text-pink-600">
                            ZK {calculateTotal()}
                        </span>
                    </div>
                </div>

                {/* 5. Notes */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-pink-500" />
                        Clinical Notes
                    </h2>
                    <textarea
                        className="form-textarea"
                        rows="4"
                        placeholder="Additional notes about delivery or recovery..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/app/maternity')}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary min-w-[120px] bg-pink-600 hover:bg-pink-700 border-pink-600"
                    >
                        {loading ? 'Saving...' : 'Save Maternity Bill'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default MaternityBillForm;
