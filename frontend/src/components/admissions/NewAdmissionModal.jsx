import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, User, Bed, Edit3, DollarSign, Activity, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NewAdmissionModal = ({ isOpen, onClose, onSuccess, initialPatient }) => {
    // Form State
    const [patientQuery, setPatientQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedWard, setSelectedWard] = useState('');
    const [selectedBed, setSelectedBed] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [admissionNotes, setAdmissionNotes] = useState('');

    // Options State
    const [wards, setWards] = useState([]);
    const [beds, setBeds] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch initial data (Wards and Doctors)
    useEffect(() => {
        if (isOpen) {
            fetchWards();
            fetchDoctors();
            resetForm();

            if (initialPatient) {
                console.log('Pre-filling Initial Patient:', initialPatient);
                setSelectedPatient(initialPatient);
                setPatientQuery(`${initialPatient.firstName || ''} ${initialPatient.lastName || ''} - ${initialPatient.patientNumber || ''}`);
                setSearchResults([]);
            }
        }
    }, [isOpen, initialPatient]);

    // Fetch beds when a ward is selected
    useEffect(() => {
        if (selectedWard) {
            fetchAvailableBeds(selectedWard);
            setSelectedBed(''); // Reset bed selection
        } else {
            setBeds([]);
        }
    }, [selectedWard]);

    const fetchWards = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/wards`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWards(response.data);
        } catch (error) {
            console.error('Error fetching wards:', error);
            toast.error('Failed to load wards');
        }
    };

    const fetchAvailableBeds = async (wardId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/wards/${wardId}/beds/available`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBeds(response.data);
        } catch (error) {
            console.error('Error fetching beds:', error);
            toast.error('Failed to load available beds');
        }
    };

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            // Depending on how users are fetched, you might need a specific endpoint
            // For now, let's assume /auth/users or /setup/users with a role filter works
            const response = await axios.get(`${API_URL}/setup/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter users to only include doctors and super admins
            const doctorList = response.data.filter(u =>
                ['doctor', 'superintendent', 'admin'].includes(u.role)
            );
            setDoctors(doctorList);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            // toast.error('Failed to load doctors');
            // Mock doctors if API fails for UI demonstration during dev
            setDoctors([
                { id: 1, firstName: 'John', lastName: 'Doe', role: 'doctor' },
                { id: 2, firstName: 'Sarah', lastName: 'Smith', role: 'doctor' }
            ]);
        }
    };

    // Patient Search Logic
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (patientQuery.length >= 2 && !selectedPatient) {
                searchPatients(patientQuery);
            } else {
                setSearchResults([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(debounceTimer);
    }, [patientQuery, selectedPatient]);

    const searchPatients = async (query) => {
        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/patients/search?q=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePatientSelect = (patient) => {
        console.log('Selected Patient Data:', patient);
        setSelectedPatient(patient);
        setPatientQuery(`${patient.firstName} ${patient.lastName} - ${patient.patientNumber}`);
        setSearchResults([]);
    };

    const clearPatientSelection = () => {
        setSelectedPatient(null);
        setPatientQuery('');
        setSearchResults([]);
        setDepositAmount('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedPatient) {
            toast.error('Please select a patient');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const pm = selectedPatient.paymentMethod || '';
            const isChargeDeducted = pm !== 'cash' && pm !== 'emergency' && pm !== '';
            const finalDeposit = isChargeDeducted ? 0 : (depositAmount ? parseFloat(depositAmount.toString().replace(/,/g, '')) : 0);

            const admissionData = {
                patientId: selectedPatient.id,
                wardId: selectedWard,
                bedId: selectedBed,
                admittingDoctorId: selectedDoctor,
                depositAmount: finalDeposit,
                notes: admissionNotes
            };

            const response = await axios.post(`${API_URL}/admissions/admit`, admissionData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Patient admitted successfully');
            if (onSuccess) onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error('Admission error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to admit patient. Please check all required fields.';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setPatientQuery('');
        setSelectedPatient(null);
        setSearchResults([]);
        setSelectedWard('');
        setSelectedBed('');
        setSelectedDoctor('');
        setDepositAmount('');
        setAdmissionNotes('');
    };

    if (!isOpen) return null;

    // Preset Deposit Amounts
    const presetAmounts = [2000, 5000, 10000, 15000, 25000];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:p-0 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Orange to match the screenshot) */}
                <div className="bg-[#f27a24] text-white p-5 flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-md border border-white/20 shadow-inner">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">New Inpatient Admission</h2>
                            <p className="text-white/80 text-sm font-medium mt-0.5">Admit patient to ward</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors text-white mt-1"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <form id="admission-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Patient Search Section */}
                        <div className="space-y-2 relative border-b border-gray-100 pb-6">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <User className="h-4 w-4 text-gray-400" />
                                Patient <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                {selectedPatient ? (
                                    <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 shadow-sm transition-all duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {selectedPatient.firstName} {selectedPatient.lastName}
                                                </div>
                                                <div className="text-xs text-blue-700/80 font-medium">
                                                    ID: {selectedPatient.patientNumber} {selectedPatient.phone && `| Tel: ${selectedPatient.phone}`}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearPatientSelection}
                                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 rounded-full transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={patientQuery}
                                            onChange={(e) => setPatientQuery(e.target.value)}
                                            placeholder="Search by name, NRC, or phone..."
                                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                                            autoComplete="off"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && !selectedPatient && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-64 overflow-y-auto">
                                        {searchResults.map((patient) => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                onClick={() => handlePatientSelect(patient)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 flex items-center justify-between group transition-colors focus:bg-gray-50 focus:outline-none"
                                            >
                                                <div>
                                                    <div className="font-semibold text-gray-800 text-sm">{patient.firstName} {patient.lastName}</div>
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        {patient.patientNumber} {patient.phone && `• ${patient.phone}`}
                                                    </div>
                                                </div>
                                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Search className="h-3 w-3" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ward and Bed Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Activity className="h-4 w-4 text-gray-400" />
                                    Ward <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={selectedWard}
                                    onChange={(e) => setSelectedWard(e.target.value)}
                                    className="w-full p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                                >
                                    <option value="" disabled className="font-normal text-gray-400">Select Ward</option>
                                    {wards.map(ward => (
                                        <option key={ward.id} value={ward.id}>{ward.name} ({ward.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Bed className="h-4 w-4 text-gray-400" />
                                    Bed <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={selectedBed}
                                    onChange={(e) => setSelectedBed(e.target.value)}
                                    disabled={!selectedWard}
                                    className="w-full p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 appearance-none disabled:bg-gray-100 disabled:text-gray-400 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                                >
                                    <option value="" disabled>Select Bed</option>
                                    {beds.map(bed => (
                                        <option key={bed.id} value={bed.id}>Bed {bed.bedNumber}</option>
                                    ))}
                                </select>
                                {selectedWard && beds.length === 0 && (
                                    <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                        No beds available in this ward
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Admitting Doctor */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <User className="h-4 w-4 text-gray-400" />
                                Admitting Doctor <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                className="w-full p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                            >
                                <option value="" disabled className="font-normal text-gray-400">Select Doctor</option>
                                {doctors.map(doctor => (
                                    <option key={doctor.id} value={doctor.id}>
                                        Dr. {doctor.firstName} {doctor.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Deposit Amount */}
                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                Deposit Amount (K) <span className="text-red-500">*</span>
                            </label>

                            {selectedPatient && selectedPatient.paymentMethod && selectedPatient.paymentMethod !== 'cash' && selectedPatient.paymentMethod !== 'emergency' ? (
                                <div className="w-full p-3.5 bg-green-50 border border-green-200 rounded-lg shadow-sm text-sm font-semibold text-green-700 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Charge Deducted ({selectedPatient.paymentMethod.replace('_', ' ').toUpperCase()})
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        required
                                        value={depositAmount}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            // Add commas for thousands
                                            if (val) {
                                                const cleanVal = val.split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                                setDepositAmount(cleanVal);
                                            } else {
                                                setDepositAmount('');
                                            }
                                        }}
                                        placeholder="e.g. 5,000"
                                        className="w-full p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                                    />

                                    {/* Preset Amount Badges */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {presetAmounts.map(amount => (
                                            <button
                                                key={amount}
                                                type="button"
                                                onClick={() => setDepositAmount(amount.toLocaleString())}
                                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                K{amount.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Admission Notes */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <FileText className="h-4 w-4 text-gray-400" />
                                Admission Notes
                            </label>
                            <textarea
                                rows="3"
                                value={admissionNotes}
                                onChange={(e) => setAdmissionNotes(e.target.value)}
                                placeholder="Reason for admission, special instructions..."
                                className="w-full p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm text-gray-800 placeholder:text-gray-400"
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="admission-form"
                        disabled={isSubmitting || !selectedPatient || !selectedWard || !selectedBed || !selectedDoctor || (selectedPatient && (selectedPatient.paymentMethod === 'cash' || selectedPatient.paymentMethod === 'emergency') && !depositAmount)}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-[#f27a24] border border-transparent rounded-lg hover:bg-[#d96b1c] focus:outline-none focus:ring-2 focus:ring-[#f27a24]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                Admitting...
                            </>
                        ) : (
                            'Confirm Admission'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewAdmissionModal;
