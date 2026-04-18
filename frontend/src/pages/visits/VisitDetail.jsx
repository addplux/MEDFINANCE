import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { visitAPI, setupAPI } from '@/services/apiService';
import {
    ArrowLeft, User, RefreshCw, LogOut, Send, Activity,
    AlertCircle, FileText, CheckCircle, Clock, MapPin
} from 'lucide-react';
import TriageWidget from './components/TriageWidget';

const DEPARTMENTS = [
    'OPD', 'Male Ward', 'Female Ward', 'Pediatric Ward', 'ICU', 'Theatre',
    'Maternity', 'Casualty / Emergency', 'Radiology', 'Laboratory', 'Pharmacy'
];

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
    const [movForm, setMovForm] = useState({ toDepartment: '', assignedDoctorId: '', notes: '' });
    const [submittingMov, setSubmittingMov] = useState(false);
    const [doctors, setDoctors] = useState([]);

    const apiBase = import.meta.env.VITE_API_URL || '';

    const load = async () => {
        try {
            setLoading(true);
            const [visitRes, movRes, docsRes] = await Promise.allSettled([
                visitAPI.getById(id),
                visitAPI.getMovements(id),
                setupAPI.users.getAll({ isActive: true })
            ]);

            if (visitRes.status === 'rejected') throw new Error('Failed to load visit details');

            setVisit(visitRes.value.data);
            setMovements(movRes.status === 'fulfilled' ? (movRes.value.data || []) : []);

            if (docsRes.status === 'fulfilled') {
                setDoctors(docsRes.value.data?.filter(u => ['doctor', 'specialist', 'medical officer', 'consultant'].some(r => u.role?.name?.toLowerCase().includes(r))) || []);
            } else {
                setDoctors([]);
            }
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
            await visitAPI.logMovement(visit.patientId, {
                toDepartment: movForm.toDepartment,
                fromDepartment: visit.assignedDepartment || movements[movements.length - 1]?.toDepartment || '—',
                assignedDoctorId: movForm.assignedDoctorId || null,
                notes: movForm.notes
            });
            setMovForm({ toDepartment: '', assignedDoctorId: '', notes: '' });
            setMovLoading(true);
            const movRes = await visitAPI.getMovements(id);
            setMovements(movRes.data || []);
            await visitAPI.update(id, { assignedDepartment: movForm.toDepartment });
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send patient');
        } finally {
            setSubmittingMov(false);
            setMovLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-text-tertiary">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading encounter details...
        </div>
    );

    if (error || !visit) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-text-secondary">{error || 'Visit not found'}</p>
            <button onClick={() => navigate('/app/visits')} className="btn btn-secondary">Back to Visits</button>
        </div>
    );

    const p = visit.patient;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
            {/* Unified Page Header Component */}
            <div className="bg-bg-secondary rounded-2xl border border-border-color shadow-sm p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/visits')} className="p-2.5 bg-bg-tertiary hover:bg-white/10 rounded-xl transition-colors border border-border-color text-text-secondary">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            <h1 className="text-2xl font-black text-text-primary tracking-tight">
                                {p ? `${p.firstName} ${p.lastName}` : 'Unknown Patient'}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {visit.visitType}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                                visit.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                                {visit.status}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-text-tertiary mt-1 flex items-center gap-3">
                            <span className="font-mono">{visit.visitNumber}</span>
                            <span className="w-1 h-1 rounded-full bg-border-color"></span>
                            <span className="capitalize">{p?.gender || '—'}</span>
                            <span className="w-1 h-1 rounded-full bg-border-color"></span>
                            <span>{p?.phone || 'No Phone'}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {visit.billingSummary?.status === 'pending' ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold mr-2">
                            <AlertCircle className="w-4 h-4" /> UNPAID (ZK{visit.billingSummary.totalAmount})
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold mr-2">
                            <CheckCircle className="w-4 h-4" /> FULLY PAID
                        </div>
                    )}
                    
                    {p && (
                        <button onClick={() => navigate(`/app/patients/${p.id}`)} className="btn btn-secondary py-2 border-border-color shadow-sm">
                            <User className="w-4 h-4" /> View Record
                        </button>
                    )}
                    
                    {visit.status === 'active' && (
                        <button
                            onClick={handleDischarge}
                            disabled={discharging || visit.billingSummary?.status === 'pending'}
                            className={`btn py-2 shadow-sm ${visit.billingSummary?.status === 'pending' ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed border-border-color' : 'bg-orange-600 hover:bg-orange-500 text-white border-orange-500'}`}
                        >
                            <LogOut className="w-4 h-4" />
                            {discharging ? 'Discharging...' : 'Discharge'}
                        </button>
                    )}
                </div>
            </div>

            {/* Current Status Bar */}
            <div className="flex items-center gap-8 px-6 py-4 bg-bg-secondary/40 rounded-2xl border border-border-color/50 text-sm overflow-x-auto">
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <MapPin className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-secondary">Location:</span>
                    <strong className="text-text-primary uppercase tracking-wide">{visit.department?.departmentName || visit.assignedDepartment || 'Unknown'}</strong>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <Activity className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-secondary">Queue Status:</span>
                    <strong className="text-text-primary capitalize">{visit.queueStatus?.replace('_', ' ') || 'Normal'}</strong>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <Clock className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-secondary">Admitted:</span>
                    <strong className="text-text-primary">{visit.admissionDate ? new Date(visit.admissionDate).toLocaleString() : '—'}</strong>
                </div>
            </div>

            {/* Main Action Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Column 1: Triage & Notes */}
                <div className="space-y-6">
                    {visit.visitType === 'opd' && visit.status === 'active' && (
                        <TriageWidget visitId={visit.id} patientId={p?.id} queueStatus={visit.queueStatus} onVitalsSaved={load} />
                    )}
                    
                    {visit.notes && (
                        <div className="card p-5 border-border-color shadow-sm">
                            <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" /> Admission Notes
                            </h3>
                            <div className="p-4 bg-bg-tertiary/50 rounded-xl text-sm text-text-secondary italic leading-relaxed border border-border-color/50">
                                "{visit.notes}"
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Send Patient & Movement History */}
                <div className="space-y-6">
                    
                    {/* The Send Patient Widget */}
                    <div className="card p-6 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent relative overflow-hidden shadow-lg shadow-indigo-900/10">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        
                        <div className="mb-6">
                            <h2 className="text-lg font-black text-indigo-400 flex items-center gap-2 uppercase tracking-tight">
                                <Send className="w-5 h-5 text-indigo-500" /> Send to Another Department
                            </h2>
                            <p className="text-xs font-medium text-text-tertiary mt-1">
                                Transfer this patient to a specific ward, clinic, or diagnostic department.
                            </p>
                        </div>
                        
                        {visit.status === 'active' ? (
                            <form onSubmit={handleLogMovement} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Destination Department <span className="text-red-400">*</span></label>
                                    <select
                                        required
                                        value={movForm.toDepartment}
                                        onChange={e => setMovForm(f => ({ ...f, toDepartment: e.target.value }))}
                                        className="form-select bg-bg-secondary border-border-color hover:border-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all text-sm py-2.5"
                                    >
                                        <option value="">-- Select Destination --</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Assign Doctor <span className="text-text-tertiary font-normal">(Optional)</span></label>
                                    <select
                                        value={movForm.assignedDoctorId}
                                        onChange={e => setMovForm(f => ({ ...f, assignedDoctorId: e.target.value }))}
                                        className="form-select bg-bg-secondary border-border-color hover:border-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all text-sm py-2.5"
                                    >
                                        <option value="">-- Any Available Doctor --</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                                    </select>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Transfer Instructions / Notes</label>
                                    <textarea
                                        value={movForm.notes}
                                        onChange={e => setMovForm(f => ({ ...f, notes: e.target.value }))}
                                        className="form-textarea bg-bg-secondary border-border-color focus:border-indigo-500 placeholder-text-tertiary text-sm py-2.5"
                                        rows={2}
                                        placeholder="Reason for transfer, special handling..."
                                    />
                                </div>
                                
                                <button type="submit" disabled={submittingMov} className="w-full btn btn-primary bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-md shadow-indigo-600/20 py-3 mt-2 text-sm font-bold uppercase tracking-wider">
                                    <Send className="w-4 h-4 mr-2" />
                                    {submittingMov ? 'Processing Transfer...' : 'Confirm Transfer'}
                                </button>
                            </form>
                        ) : (
                            <div className="py-8 text-center bg-bg-tertiary/30 rounded-xl border border-dashed border-border-color">
                                <AlertCircle className="w-8 h-8 text-text-tertiary opacity-50 mx-auto mb-2" />
                                <p className="text-sm font-medium text-text-secondary">
                                    This visit is <strong className="text-text-primary capitalize">{visit.status}</strong>.<br/>Transfers are disabled.
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Simplified Movement History */}
                    <div className="card p-5 border-border-color shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4 text-text-secondary" /> Movement History
                            </h3>
                            <span className="text-xs font-black bg-bg-tertiary px-2 py-1 rounded text-text-secondary">{movements.length}</span>
                        </div>
                        
                        {movLoading ? (
                            <div className="py-6 text-center text-text-tertiary text-sm animate-pulse">Loading history...</div>
                        ) : movements.length === 0 ? (
                            <div className="py-8 text-center text-text-tertiary text-sm italic">No department transfers recorded yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {movements.map((m, i) => (
                                    <div key={m.id || i} className="flex gap-3 relative">
                                        {i !== movements.length - 1 && (
                                            <div className="absolute top-8 bottom-0 left-3.5 w-px bg-border-color/50 -z-10" />
                                        )}
                                        <div className="w-7 h-7 rounded-full bg-bg-tertiary border border-border-color flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                                            <Send className="w-3 h-3 text-text-secondary" />
                                        </div>
                                        <div className="flex-1 bg-bg-tertiary/20 border border-border-color/30 rounded-xl p-3">
                                            <p className="text-sm font-semibold text-text-primary">
                                                {m.fromDepartment ? <span className="text-text-tertiary font-normal">{m.fromDepartment} → </span> : ''}
                                                <span className="text-indigo-400">{m.toDepartment}</span>
                                            </p>
                                            {m.assignedDoctor && (
                                                <p className="text-xs font-medium text-blue-400 mt-1 flex items-center gap-1">
                                                    <User className="w-3 h-3" /> Dr. {m.assignedDoctor.firstName} {m.assignedDoctor.lastName}
                                                </p>
                                            )}
                                            {m.notes && <p className="text-xs text-text-secondary mt-1.5 italic">"{m.notes}"</p>}
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-2 flex justify-between items-center">
                                                <span>{m.movementDate ? new Date(m.movementDate).toLocaleString() : ''}</span>
                                                {m.admitter && <span className="opacity-70">By {m.admitter.firstName}</span>}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitDetail;
