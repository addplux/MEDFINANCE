import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X, Loader2 } from 'lucide-react';
import { patientAPI } from '../../services/apiService';

/**
 * PatientSearchSelect Component
 * 
 * A reusable, searchable combobox for selecting patients.
 * 
 * Props:
 * @param {string} selectedId - Currently selected patient ID
 * @param {function} onSelect - Callback when a patient is selected (returns patient object)
 * @param {string} placeholder - Input placeholder
 * @param {boolean} required - Whether the field is required
 * @param {string} className - Optional container className
 */
const PatientSearchSelect = ({ 
    selectedId, 
    onSelect, 
    placeholder = "Search patient by name or number...", 
    required = false,
    className = ""
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const dropdownRef = useRef(null);

    // Initial load/Sync if selectedId changes externally
    useEffect(() => {
        if (selectedId && (!selectedPatient || selectedPatient.id !== selectedId)) {
            fetchPatientById(selectedId);
        } else if (!selectedId) {
            setSelectedPatient(null);
        }
    }, [selectedId]);

    // Handle outside clicks to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length > 1) {
                performSearch(searchTerm);
            } else if (searchTerm.trim().length === 0) {
                setPatients([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchPatientById = async (id) => {
        try {
            const res = await patientAPI.getById(id);
            const patient = res.data?.data || res.data;
            if (patient) {
                setSelectedPatient(patient);
            }
        } catch (err) {
            console.error('Failed to fetch patient by ID:', err);
        }
    };

    const performSearch = async (query) => {
        try {
            setSearching(true);
            const res = await patientAPI.getAll({ search: query, limit: 10 });
            setPatients(res.data?.data || res.data || []);
            setShowDropdown(true);
        } catch (err) {
            console.error('Patient search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSelect = (patient) => {
        setSelectedPatient(patient);
        setSearchTerm('');
        setShowDropdown(false);
        if (onSelect) onSelect(patient);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSelectedPatient(null);
        setSearchTerm('');
        if (onSelect) onSelect(null);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {selectedPatient ? (
                // Selected State UI
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20 group transition-all hover:border-primary/40">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                            {selectedPatient.firstName} {selectedPatient.lastName}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest font-black text-text-secondary">
                            {selectedPatient.patientNumber || 'No File No.'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1.5 hover:bg-error/10 text-text-secondary hover:text-error rounded-lg transition-colors"
                        title="Clear selection"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                // Search State UI
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </div>
                    <input
                        type="text"
                        className="form-input pl-10 w-full"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (!showDropdown) setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        required={required && !selectedPatient}
                    />
                    
                    {/* Dropdown Results */}
                    {showDropdown && (searchTerm.length > 1 || patients.length > 0) && (
                        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {patients.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {patients.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleSelect(p)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 border border-white/5">
                                                <User className="w-4 h-4 text-text-secondary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white truncate">
                                                    {p.firstName} {p.lastName}
                                                </div>
                                                <div className="text-[10px] uppercase tracking-widest font-black text-text-secondary">
                                                    {p.patientNumber || 'N/A'} • {p.gender || 'Unknown'}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : searchTerm.length > 1 && !searching ? (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                                        <Search className="w-6 h-6 text-text-secondary opacity-20" />
                                    </div>
                                    <p className="text-sm text-text-secondary font-medium">No patients found matches "{searchTerm}"</p>
                                    <p className="text-[10px] text-text-secondary/40 uppercase tracking-widest font-black mt-1">Try a different name or number</p>
                                </div>
                            ) : null}
                            
                            {searching && patients.length === 0 && (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Searching records...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatientSearchSelect;
