import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import { 
    Users, Activity, Beaker, Radio, Pill, 
    Stethoscope, Clock, CheckCircle, ArrowRight,
    ArrowUpRight, AlertCircle, Scissors
} from 'lucide-react';

const DoctorOrders = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await visitAPI.getAll({ queueStatus: 'waiting_doctor', status: 'active' });
            setVisits(res.data.visits || []);
        } catch (error) {
            console.error('Failed to fetch doctor queue', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoute = async (visitId, nextStatus, label) => {
        setProcessingId(visitId);
        try {
            await visitAPI.updateQueueStatus(visitId, nextStatus);
            addToast('success', `Patient routed to ${label}`);
            setVisits(visits.filter(v => v.id !== visitId));
        } catch (error) {
            addToast('error', `Failed to route patient.`);
        } finally {
            setProcessingId(null);
        }
    };

    const getWaitTime = (dateString) => {
        const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    return (
        <div className="min-h-screen bg-bg-primary p-6 lg:p-8 flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-color">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Clinical Decision Support</span>
                    </div>
                    <h1 className="text-5xl font-black text-text-primary tracking-tighter leading-none mb-2">Doctor's <span className="font-light text-text-tertiary">Orders</span></h1>
                    <p className="text-text-secondary font-medium text-sm">
                        Manage active consultations and route patients to specialized departments.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-color rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                    <Users className="w-3 h-3" />
                    {visits.length} Pending Consultation
                </div>
            </div>

            {/* Queue List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Synchronizing Queue...</p>
                    </div>
                ) : visits.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-bg-secondary/30 rounded-[3rem] border border-dashed border-border-color">
                        <Stethoscope className="w-12 h-12 text-text-tertiary/20 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-text-primary uppercase tracking-widest mb-1">Queue Empty</h3>
                        <p className="text-text-tertiary text-sm font-medium">All clinical consultations have been cleared.</p>
                    </div>
                ) : (
                    visits.map(visit => (
                        <div 
                            key={visit.id} 
                            className="bg-bg-secondary p-8 rounded-[2.5rem] border border-border-color shadow-sm hover:shadow-2xl hover:shadow-black/20 transition-all duration-500 group"
                        >
                            {/* Patient Info */}
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${visit.priority === 'urgent' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {visit.priority || 'Normal'}
                                        </span>
                                        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter">{getWaitTime(visit.createdAt)} Wait</span>
                                    </div>
                                    <h3 className="text-xl font-black text-text-primary tracking-tight leading-none group-hover:text-emerald-500 transition-colors uppercase">
                                        {visit.patient?.firstName} {visit.patient?.lastName}
                                    </h3>
                                    <p className="text-[10px] font-mono font-bold text-text-tertiary tracking-tighter uppercase mt-1">
                                        {visit.patient?.patientNumber} • {visit.reasonForVisit || 'General Consultation'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/app/visits/${visit.id}`)}
                                    className="p-3 bg-bg-tertiary text-text-tertiary hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"
                                >
                                    <ArrowUpRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Action Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    disabled={processingId === visit.id}
                                    onClick={() => handleRoute(visit.id, 'waiting_lab', 'Laboratory')}
                                    className="p-4 bg-bg-tertiary/50 border border-border-color rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all group/btn"
                                >
                                    <Beaker className="w-5 h-5 text-text-tertiary group-hover/btn:text-violet-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary group-hover/btn:text-violet-600">Laboratory</span>
                                </button>
                                
                                <button 
                                    disabled={processingId === visit.id}
                                    onClick={() => handleRoute(visit.id, 'waiting_radiology', 'Radiology')}
                                    className="p-4 bg-bg-tertiary/50 border border-border-color rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group/btn"
                                >
                                    <Radio className="w-5 h-5 text-text-tertiary group-hover/btn:text-indigo-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary group-hover/btn:text-indigo-600">Imaging</span>
                                </button>

                                <button 
                                    disabled={processingId === visit.id}
                                    onClick={() => handleRoute(visit.id, 'waiting_theatre', 'Theatre')}
                                    className="p-4 bg-bg-tertiary/50 border border-border-color rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group/btn"
                                >
                                    <Scissors className="w-5 h-5 text-text-tertiary group-hover/btn:text-rose-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary group-hover/btn:text-rose-600">Theatre</span>
                                </button>

                                <button 
                                    disabled={processingId === visit.id}
                                    onClick={() => handleRoute(visit.id, 'with_doctor', 'Clinical Unit')}
                                    className="p-4 bg-bg-tertiary/50 border border-border-color rounded-[1.5rem] flex flex-col items-center gap-2 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group/btn"
                                >
                                    <Activity className="w-5 h-5 text-text-tertiary group-hover/btn:text-blue-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary group-hover/btn:text-blue-600">Ward Order</span>
                                </button>

                                <button 
                                    disabled={processingId === visit.id}
                                    onClick={() => handleRoute(visit.id, 'ready_for_discharge', 'Pharmacy')}
                                    className="col-span-2 p-4 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                                >
                                    <Pill className="w-5 h-5" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Discharge / Rx</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DoctorOrders;
