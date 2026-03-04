import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { visitAPI } from '../../services/apiService';
import {
    ArrowLeft, User, RefreshCw, LogOut, Move,
    Stethoscope, BedDouble, Baby, Siren, ClipboardList,
    Phone, Shield, Calendar, MapPin, AlertCircle, AlertTriangle
} from 'lucide-react';
import TriageWidget from './components/TriageWidget';
import DoctorWorkspace from './components/DoctorWorkspace';

const TYPE_MAP = {
    opd: { label: 'OPD', icon: Stethoscope, bg: 'bg-blue-900/40', text: 'text-blue-300' },
    inpatient: { label: 'Inpatient', icon: BedDouble, bg: 'bg-purple-900/40', text: 'text-purple-300' },
    maternity: { label: 'Maternity', icon: Baby, bg: 'bg-pink-900/40', text: 'text-pink-300' },
    emergency: { label: 'Emergency', icon: Siren, bg: 'bg-red-900/40', text: 'text-red-300' },
};

const STATUS_COLORS = {
    active: 'bg-green-900/40 text-green-300',
    discharged: 'bg-gray-800 text-gray-400',
    transferred: 'bg-yellow-900/40 text-yellow-300',
    cancelled: 'bg-red-900/40 text-red-400',
};

const DEPARTMENTS = [
    'OPD', 'Male Ward', 'Female Ward', 'Pediatric Ward', 'ICU', 'Theatre',
    'Maternity', 'Casualty / Emergency', 'Radiology', 'Laboratory', 'Pharmacy'
];

const InfoRow = ({ icon: Icon, label, value }) => value ? (
    <div className="flex items-start gap-2 py-1.5">
        <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium text-white">{value}</p>
        </div>
    </div>
) : null;

const VisitDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [visit, setVisit] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [movLoading, setMovLoading] = useState(false);
    const [discharging, setDischarging] = useState(false);
    const [error, setError] = useState(null);

    // New movement form state
    const [movForm, setMovForm] = useState({ toDepartment: '', notes: '' });
    const [submittingMov, setSubmittingMov] = useState(false);

    const apiBase = import.meta.env.VITE_API_URL || '';

    const load = async () => {
        try {
            setLoading(true);
            const [visitRes, movRes] = await Promise.all([
                visitAPI.getById(id),
                visitAPI.getMovements(id)
            ]);
            setVisit(visitRes.data);
            setMovements(movRes.data || []);
        } catch (e) {
            setError('Failed to load visit details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleDischarge = async () => {
        if (visit.billingSummary?.status === 'pending') {
            alert('Cannot discharge patient: There are unpaid bills that must be cleared first.');
            return;
        }
        if (!window.confirm('Discharge this patient from the visit?')) return;
        setDischarging(true);
        try {
            await visitAPI.discharge(id);
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to discharge');
        } finally {
            setDischarging(false);
        }
    };

    const handleLogMovement = async (e) => {
        e.preventDefault();
        if (!movForm.toDepartment) { alert('Select destination department'); return; }
        setSubmittingMov(true);
        try {
            // Use the patient-movements endpoint via visitAPI
            await visitAPI.logMovement(visit.patientId, {
                toDepartment: movForm.toDepartment,
                fromDepartment: visit.assignedDepartment || movements[movements.length - 1]?.toDepartment || '—',
                notes: movForm.notes
            });
            setMovForm({ toDepartment: '', notes: '' });
            // Refresh movements
            setMovLoading(true);
            const movRes = await visitAPI.getMovements(id);
            setMovements(movRes.data || []);
            // Also update the visit's department display
            await visitAPI.update(id, { assignedDepartment: movForm.toDepartment });
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to log movement');
        } finally {
            setSubmittingMov(false);
            setMovLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading visit…
        </div>
    );

    if (error || !visit) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-600">{error || 'Visit not found'}</p>
            <button onClick={() => navigate('/app/visits')} className="btn btn-secondary">Back to Visits</button>
        </div>
    );

    const typeCfg = TYPE_MAP[visit.visitType] || { label: visit.visitType, icon: ClipboardList, bg: 'bg-gray-100', text: 'text-gray-700' };
    const TypeIcon = typeCfg.icon;
    const p = visit.patient;

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => navigate('/app/visits')} className="btn btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold font-mono text-indigo-300">{visit.visitNumber}</h1>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${typeCfg.bg} ${typeCfg.text}`}>
                            <TypeIcon className="w-4 h-4" />{typeCfg.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[visit.status] || ''}`}>
                            {visit.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Admitted: {visit.admissionDate ? new Date(visit.admissionDate).toLocaleString() : '—'}
                        {visit.dischargeDate && ` · Discharged: ${new Date(visit.dischargeDate).toLocaleString()}`}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    {visit.billingSummary?.status === 'pending' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold mr-2">
                            <AlertTriangle className="w-4 h-4" /> Unpaid Bills (K{visit.billingSummary.totalAmount})
                        </div>
                    )}
                    {p && (
                        <button onClick={() => navigate(`/app/patients/${p.id}`)} className="btn btn-secondary">
                            <User className="w-4 h-4" /> Patient Record
                        </button>
                    )}
                    {visit.status === 'active' && (
                        <button
                            onClick={handleDischarge}
                            disabled={discharging || visit.billingSummary?.status === 'pending'}
                            className={`btn ${visit.billingSummary?.status === 'pending' ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300' : 'btn-primary bg-orange-500 hover:bg-orange-600 border-orange-500'}`}
                            title={visit.billingSummary?.status === 'pending' ? 'Clear bills before discharge' : 'Discharge Patient'}
                        >
                            <LogOut className="w-4 h-4" />
                            {discharging ? 'Discharging…' : 'Discharge Patient'}
                        </button>
                    )}
                </div>
            </div>

            {/* Real-World OPD Widgets */}
            {visit.visitType === 'opd' && visit.status === 'active' && (
                <div className="space-y-4">
                    <TriageWidget visitId={visit.id} patientId={p?.id} queueStatus={visit.queueStatus} onVitalsSaved={load} />
                    <DoctorWorkspace visitId={visit.id} queueStatus={visit.queueStatus} notes={visit.notes} onStatusChange={load} />
                </div>
            )}

            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Patient Info */}
                <div className="card p-5 md:col-span-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Patient</h3>
                    {p ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 mb-3">
                                {p.photoUrl ? (
                                    <img src={`${apiBase}${p.photoUrl}`} alt={p.firstName} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {p.firstName?.[0]}{p.lastName?.[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-white">{p.firstName} {p.lastName}</p>
                                    <p className="text-xs font-mono text-gray-400">{p.patientNumber}</p>
                                </div>
                            </div>
                            <InfoRow icon={Phone} label="Phone" value={p.phone} />
                            <InfoRow icon={Shield} label="Patient Type" value={p.paymentMethod?.toUpperCase()} />
                            <InfoRow icon={User} label="NRC" value={p.nrc} />
                            <InfoRow icon={User} label="Gender" value={p.gender} />
                        </div>
                    ) : <p className="text-sm text-gray-400">No patient data</p>}
                </div>

                {/* Visit Details */}
                <div className="card p-5 md:col-span-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visit Details</h3>
                    <div className="space-y-1">
                        <InfoRow icon={MapPin} label="Department" value={visit.department?.departmentName || visit.assignedDepartment} />
                        <InfoRow icon={Shield} label="Scheme" value={visit.scheme?.schemeName} />
                        <InfoRow icon={User} label="Admitted By" value={visit.admitter ? `${visit.admitter.firstName} ${visit.admitter.lastName}` : undefined} />
                        <InfoRow icon={Calendar} label="Admission" value={visit.admissionDate ? new Date(visit.admissionDate).toLocaleString() : undefined} />
                        {visit.dischargeDate && (
                            <InfoRow icon={Calendar} label="Discharged" value={new Date(visit.dischargeDate).toLocaleString()} />
                        )}
                    </div>
                    {visit.notes && (
                        <div className="mt-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-300">{visit.notes}</p>
                        </div>
                    )}
                </div>

                {/* Log Movement */}
                <div className="card p-5 md:col-span-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Log Movement</h3>
                    {visit.status === 'active' ? (
                        <form onSubmit={handleLogMovement} className="space-y-3">
                            <div className="form-group">
                                <label className="form-label">Transfer To</label>
                                <select
                                    value={movForm.toDepartment}
                                    onChange={e => setMovForm(f => ({ ...f, toDepartment: e.target.value }))}
                                    className="form-select"
                                >
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes (optional)</label>
                                <textarea
                                    value={movForm.notes}
                                    onChange={e => setMovForm(f => ({ ...f, notes: e.target.value }))}
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Reason for transfer…"
                                />
                            </div>
                            <button type="submit" disabled={submittingMov} className="btn btn-primary w-full">
                                <Move className="w-4 h-4" />
                                {submittingMov ? 'Logging…' : 'Log Movement'}
                            </button>
                        </form>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Visit is {visit.status} — movements cannot be logged.</p>
                    )}
                </div>
            </div>

            {/* Movement Log */}
            <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Patient Movement Log</h3>
                    <span className="text-xs text-gray-400">{movements.length} entries</span>
                </div>
                {movLoading ? (
                    <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
                ) : movements.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">No movements recorded yet.</div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {movements.map((m, i) => (
                            <div key={m.id ?? i} className="flex gap-4 px-5 py-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center">
                                        <Move className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    {i < movements.length - 1 && <div className="w-0.5 bg-gray-700 flex-1 mt-1" />}
                                </div>
                                <div className="flex-1 pb-2">
                                    <p className="text-sm font-semibold text-gray-200">
                                        {m.fromDepartment ? <><span className="text-gray-500">{m.fromDepartment}</span> → </> : ''}
                                        <span className="text-indigo-400">{m.toDepartment}</span>
                                    </p>
                                    {m.notes && <p className="text-xs text-gray-500 mt-0.5 italic">"{m.notes}"</p>}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {m.movementDate ? new Date(m.movementDate).toLocaleString() : ''}
                                        {m.admitter && ` · by ${m.admitter.firstName} ${m.admitter.lastName}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisitDetail;
