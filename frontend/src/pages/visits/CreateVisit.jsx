import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, receivablesAPI, visitAPI } from '../../services/apiService';
import { ArrowLeft, Search, Stethoscope, BedDouble, Baby, Siren, CheckCircle } from 'lucide-react';

const VISIT_TYPES = [
    { key: 'opd', label: 'OPD', icon: Stethoscope, desc: 'Outpatient Department', color: 'border-blue-500 bg-blue-900/30 text-blue-300' },
    { key: 'inpatient', label: 'Inpatient', icon: BedDouble, desc: 'Admitted / Ward stay', color: 'border-purple-500 bg-purple-900/30 text-purple-300' },
    { key: 'maternity', label: 'Maternity', icon: Baby, desc: 'Maternity / Obstetrics', color: 'border-pink-500 bg-pink-900/30 text-pink-300' },
    { key: 'emergency', label: 'Emergency', icon: Siren, desc: 'Emergency / Casualty', color: 'border-red-500 bg-red-900/30 text-red-300' },
];

const DEPARTMENTS = [
    'OPD', 'Male Ward', 'Female Ward', 'Pediatric Ward', 'ICU', 'Theatre',
    'Maternity', 'Casualty / Emergency', 'Radiology', 'Laboratory', 'Pharmacy'
];

const CreateVisit = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState([]);
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [schemes, setSchemes] = useState([]);

    const [form, setForm] = useState({
        patientId: '',
        patientDisplay: '',
        visitType: 'opd',
        assignedDepartment: '',
        schemeId: '',
        admissionDate: new Date().toISOString().slice(0, 16),
        notes: ''
    });
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        receivablesAPI.schemes.getAll().then(r => {
            const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
            setSchemes(list);
        }).catch(() => { });
    }, []);

    // Load recent patients on mount or focus when search is empty
    useEffect(() => {
        if (isFocused && patientSearch.length === 0) {
            patientAPI.getAll({ limit: 50 }).then(res => {
                const results = res.data?.data || res.data?.patients || [];
                setPatientResults(Array.isArray(results) ? results : []);
            }).catch(() => { });
        }
    }, [isFocused, patientSearch]);

    // Typeahead Search
    useEffect(() => {
        if (!isFocused) return;
        if (patientSearch.length === 0) return; // Handled by standard load

        const t = setTimeout(async () => {
            setSearchingPatient(true);
            try {
                const res = await patientAPI.getAll({ search: patientSearch });
                const results = res.data?.data || res.data?.patients || [];
                setPatientResults(Array.isArray(results) ? results : []);
            } catch { setPatientResults([]); }
            finally { setSearchingPatient(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [patientSearch, isFocused]);

    const selectPatient = (p) => {
        setSelectedPatient(p);

        // 1. Use the patient's directly-linked schemeId if available
        let resolvedSchemeId = p.schemeId || '';

        // 2. Fallback: try to find a scheme that matches the patient's paymentMethod
        if (!resolvedSchemeId && p.paymentMethod && schemes.length > 0) {
            const keyword = p.paymentMethod.toLowerCase().replace(/_/g, ' ');
            // Map payment methods to scheme keywords to search for
            const METHOD_KEYWORDS = {
                'private prepaid': ['prepaid', 'private prepaid'],
                'scheme': ['scheme', 'insurance'],
                'corporate': ['corporate'],
                'staff': ['staff medical'],
                'government': ['government', 'moh', 'nhima'],
            };
            const searchTerms = METHOD_KEYWORDS[keyword] || [keyword];

            const matched = schemes.find(s => {
                const name = (s.schemeName || '').toLowerCase();
                const type = (s.schemeType || '').toLowerCase();
                return searchTerms.some(term => name.includes(term) || type.includes(term));
            });
            if (matched) resolvedSchemeId = matched.id;  // keep as integer
        }

        setForm(f => ({
            ...f,
            patientId: p.id,
            schemeId: resolvedSchemeId
        }));
        setPatientSearch(`${p.firstName} ${p.lastName} (${p.patientNumber})`);
        setPatientResults([]);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.patientId) { alert('Please select a patient'); return; }
        setLoading(true);
        try {
            const res = await visitAPI.create({
                patientId: form.patientId,
                visitType: form.visitType,
                assignedDepartment: form.assignedDepartment,
                schemeId: form.schemeId ? parseInt(form.schemeId, 10) : undefined,
                admissionDate: form.admissionDate,
                notes: form.notes
            });
            navigate(`/app/visits/${res.data.id}`);
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to create visit';
            const detail = err.response?.data?.details || '';
            console.error('Visit creation error:', err.response?.data);
            alert(`${msg}${detail ? '\n\nDetail: ' + detail : ''}`);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5 pb-10 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/app/visits')} className="btn btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Register New Visit</h1>
                    <p className="text-sm text-gray-400">A unique visit number will be generated automatically</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Patient Search */}
                <div className="card p-5 space-y-3 !overflow-visible">
                    <h3 className="font-semibold text-white">Patient</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={patientSearch}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null); setForm(f => ({ ...f, patientId: '' })); }}
                            placeholder="Select or search by name, patient number or phone…"
                            className="form-input pl-9 cursor-pointer"
                            autoComplete="off"
                        />
                        {isFocused && (patientResults.length > 0 || searchingPatient) && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                {searchingPatient && (
                                    <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
                                )}
                                {!searchingPatient && patientResults.length === 0 && patientSearch.length > 0 && (
                                    <div className="px-4 py-3 text-sm text-gray-400">No patients found.</div>
                                )}
                                {patientResults.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className="w-full text-left px-4 py-3 hover:bg-gray-800 border-b border-gray-800 last:border-0 flex gap-3 items-center transition-colors"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            selectPatient(p);
                                        }}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                                            {p.firstName?.[0]}{p.lastName?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white text-sm">{p.firstName} {p.lastName}</div>
                                            <div className="text-xs text-gray-400">{p.patientNumber} · {p.phone || '—'} · <span className="capitalize text-white font-medium">{p.paymentMethod}</span></div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Add New Patient shortcut */}
                    {!selectedPatient && (
                        <div className="flex justify-end mt-1">
                            <span className="text-xs text-gray-400">Not in the list?</span>
                            <button type="button" onClick={() => navigate('/app/patients')} className="text-xs text-indigo-400 hover:text-indigo-300 ml-1 font-medium transition-colors">
                                Register new patient &rarr;
                            </button>
                        </div>
                    )}

                    {selectedPatient && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-green-800">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                <p className="text-xs text-green-600">{selectedPatient.patientNumber} · {selectedPatient.phone} · <span className="capitalize">{selectedPatient.paymentMethod}</span></p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Visit Type */}
                <div className="card p-5">
                    <h3 className="font-semibold text-white mb-3">Visit Type</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {VISIT_TYPES.map(t => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setForm(f => ({ ...f, visitType: t.key }))}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${form.visitType === t.key
                                    ? `${t.color} border-opacity-100 shadow-sm`
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                                    }`}
                            >
                                <t.icon className={`w-7 h-7 ${form.visitType === t.key ? 'text-current' : 'text-gray-400'}`} />
                                <span className={`font-semibold text-sm ${form.visitType === t.key ? 'text-current' : 'text-gray-300'}`}>{t.label}</span>
                                <span className={`text-xs text-center leading-tight ${form.visitType === t.key ? 'text-current opacity-80' : 'text-gray-400'}`}>{t.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Department, Scheme, Date, Notes */}
                <div className="card p-5">
                    <h3 className="font-semibold text-white mb-4">Assignment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Assigned Department</label>
                            <select
                                value={form.assignedDepartment}
                                onChange={e => setForm(f => ({ ...f, assignedDepartment: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Link to Scheme (optional)</label>
                            <select
                                value={form.schemeId}
                                onChange={e => setForm(f => ({ ...f, schemeId: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">No Scheme / Cash</option>
                                {schemes.map(s => <option key={s.id} value={s.id}>{s.schemeName}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Admission Date & Time</label>
                            <input
                                type="datetime-local"
                                value={form.admissionDate}
                                onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group md:col-span-2">
                            <label className="form-label">Notes (optional)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="form-textarea"
                                rows={3}
                                placeholder="Chief complaint, reason for visit, additional notes…"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => navigate('/app/visits')} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={loading || !form.patientId} className="btn btn-primary">
                        {loading ? 'Registering…' : 'Register Visit & Generate Number'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateVisit;
