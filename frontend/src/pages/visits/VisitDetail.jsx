import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { visitAPI, setupAPI } from '@/services/apiService';
import {
    ArrowLeft, User, RefreshCw, LogOut, Send, Activity,
    AlertCircle, FileText, CheckCircle, Clock, MapPin, Receipt,
    Stethoscope, ClipboardCheck, ArrowRight
} from 'lucide-react';

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
    const [submittingMov, setSubmittingMov] = useState(false);
    const [error, setError] = useState(null);

    const [movForm, setMovForm] = useState({ toDepartment: '', assignedDoctorId: '', notes: '' });
    const [doctors, setDoctors] = useState([]);

    const load = async () => {
        try {
            setLoading(true);
            const [visitRes, movRes, docsRes] = await Promise.allSettled([
                visitAPI.getById(id),
                visitAPI.getMovements(id),
                setupAPI.users.getAll()
            ]);

            if (visitRes.status === 'rejected') throw new Error('Failed to load visit details');

            setVisit(visitRes.value.data);
            setMovements(movRes.status === 'fulfilled' ? (movRes.value.data || []) : []);
            
            if (docsRes.status === 'fulfilled') {
                const allUsers = Array.isArray(docsRes.value.data?.data) ? docsRes.value.data.data : Array.isArray(docsRes.value.data) ? docsRes.value.data : [];
                setDoctors(allUsers.filter(u => ['doctor', 'specialist', 'clinician'].includes(u.role?.toLowerCase() || '')));
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleLogMovement = async (e) => {
        if (e) e.preventDefault();
        const dest = movForm.toDepartment || 'Consultation Complete';
        setSubmittingMov(true);
        try {
            await visitAPI.logMovement(visit.patientId, {
                toDepartment: dest,
                fromDepartment: visit.assignedDepartment || 'Admission',
                assignedDoctorId: movForm.assignedDoctorId || null,
                notes: movForm.notes || 'Routine routing'
            });
            await visitAPI.update(id, { 
                assignedDepartment: dest,
                queueStatus: dest === 'Pharmacy' ? 'waiting_doctor' : 'pending_triage'
            });
            setMovForm({ toDepartment: '', assignedDoctorId: '', notes: '' });
            // Redirect back to waiting room/encounters queue since patient has been routed
            navigate('/app/visits');
        } catch (err) {
            alert('Failed to route patient');
        } finally {
            setSubmittingMov(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-text-tertiary">Loading Patient Assignment Board...</div>;
    if (error || !visit) return <div className="p-20 text-center text-red-500">{error || 'Visit Error'}</div>;

    const p = visit.patient;
    const isPaid = visit.billingSummary?.status === 'paid' || visit.billingSummary?.status === 'none';

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in px-4 md:px-0">
            {/* 1. Header & Quick Info */}
            <div className="bg-bg-secondary rounded-3xl border border-border-color shadow-xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-text-primary tracking-tight leading-none mb-2">
                                {p?.firstName} {p?.lastName}
                            </h1>
                            <div className="flex items-center gap-3 text-sm font-bold text-text-tertiary">
                                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-tighter text-[10px]">{visit.visitNumber}</span>
                                <span>{p?.gender}</span>
                                <span className="w-1 h-1 rounded-full bg-border-color" />
                                <span>{p?.phone || 'No Phone'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-black text-xs uppercase tracking-widest ${
                            isPaid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                        }`}>
                            <Receipt className="w-4 h-4" /> {isPaid ? 'Fully Paid' : `Pending: K${visit.billingSummary.balance}`}
                        </div>
                        <button onClick={() => navigate('/app/visits')} className="p-3 bg-bg-tertiary hover:bg-white/5 rounded-2xl border border-border-color text-text-secondary transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Routing Ticket & Stepper */}
            {visit.assignedDepartment !== 'Consultation Complete' && visit.status !== 'discharged' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* The Routing Ticket Component */}
                        <div className="bg-bg-secondary rounded-3xl border border-border-color shadow-sm overflow-hidden border-t-4 border-t-primary">
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
                                        <ClipboardCheck className="w-6 h-6 text-primary" /> Current Assignment Ticket
                                    </h2>
                                    <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs font-bold text-text-tertiary border border-border-color">
                                        Encounter Active
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Destination Department</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <span className="text-2xl font-black text-text-primary tracking-tight uppercase italic">{visit.assignedDepartment || visit.department?.departmentName || 'Not Assigned'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Assigned Clinician</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                            <Stethoscope className="w-6 h-6" />
                                        </div>
                                        <span className="text-xl font-bold text-text-primary">
                                            {visit.assignedDoctor ? `Dr. ${visit.assignedDoctor.firstName} ${visit.assignedDoctor.lastName}` : 'Triage / Waiting'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Workflow Stepper */}
                            <div className="relative pt-6">
                                <div className="flex items-center justify-between relative z-10 text-center">
                                    {[
                                        { label: 'Registered', icon: CheckCircle, active: true },
                                        { label: 'Cashier', icon: Receipt, active: isPaid, current: !isPaid },
                                        { label: 'Process', icon: Activity, active: isPaid && visit.queueStatus !== 'waiting_doctor', current: isPaid },
                                        { label: 'Complete', icon: ClipboardCheck, active: false }
                                    ].map((step, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                                step.active ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 
                                                step.current ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 animate-pulse' : 
                                                'bg-bg-tertiary border-border-color text-text-tertiary'
                                            }`}>
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${step.active || step.current ? 'text-text-primary' : 'text-text-tertiary'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute top-[3.2rem] left-8 right-8 h-0.5 bg-border-color -z-0">
                                    <div className={`h-full bg-green-500 transition-all duration-1000`} style={{ width: isPaid ? '66%' : '15%' }} />
                                </div>
                            </div>
                        </div>

                        {/* Lock / Processing Actions */}
                        <div className="bg-bg-tertiary/50 p-6 border-t border-border-color flex flex-col md:flex-row items-center justify-between gap-4">
                            {!isPaid ? (
                                <div className="flex items-center gap-3 text-red-400 font-bold text-sm">
                                    <AlertCircle className="w-5 h-5" /> 
                                    Patient has pending bills. Redirect to Cashier before processing.
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-green-400 font-bold text-sm">
                                    <CheckCircle className="w-5 h-5" /> 
                                    Payment verified. Department may proceed with service dispensation.
                                </div>
                            )}

                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleLogMovement}
                                    disabled={!isPaid || submittingMov}
                                    className={`flex-1 md:flex-initial btn btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs ${
                                        !isPaid ? 'opacity-30 grayscale cursor-not-allowed' : 'shadow-xl shadow-primary/20'
                                    }`}
                                >
                                    {submittingMov ? 'Processing...' : 'Complete & Send'} <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Items / Orders Header */}
                    <div className="card p-6 border-border-color bg-green-500/5">
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-green-500" /> Services for this Destination
                        </h3>
                        {visit.assignedItems?.length > 0 ? (
                            <div className="space-y-2">
                                {visit.assignedItems.map(item => (
                                    <div key={item.id} className="p-3 bg-bg-secondary rounded-xl border border-border-color flex justify-between items-center">
                                        <span className="font-bold text-text-secondary">{item.name}</span>
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-bg-tertiary rounded text-text-tertiary uppercase">{item.type}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-text-tertiary italic">No specific items yet. Doctor orders will appear here.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Send Patient Widget (Mini version) */}
                    <div className="card p-6 border-border-color bg-bg-secondary">
                        <h3 className="font-black text-text-primary uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Send className="w-4 h-4" /> Transfer Dept
                        </h3>
                        <form onSubmit={handleLogMovement} className="space-y-4">
                            <select
                                value={movForm.toDepartment}
                                onChange={e => setMovForm(f => ({ ...f, toDepartment: e.target.value }))}
                                className="form-select text-sm py-3 rounded-xl bg-bg-tertiary border-border-color"
                            >
                                <option value="">Select Destination</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select
                                value={movForm.assignedDoctorId}
                                onChange={e => setMovForm(f => ({ ...f, assignedDoctorId: e.target.value }))}
                                className="form-select text-sm py-3 rounded-xl bg-bg-tertiary border-border-color"
                            >
                                <option value="">Assign Doctor (Optional)</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                            </select>
                            <button type="submit" disabled={submittingMov} className="w-full btn btn-secondary py-3 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                Queue Patient
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            ) : (
                <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-2">Encounter Complete</h2>
                    <p className="text-text-tertiary text-sm">The patient has been routed and this assignment is complete.</p>
                </div>
            )}
        </div>
    );
};

export default VisitDetail;
