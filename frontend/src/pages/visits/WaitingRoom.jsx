import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitAPI } from '../../services/apiService';
import { 
    Users, Activity, CreditCard, Stethoscope, 
    TestTube, ActivitySquare, Pill, Clock, AlertCircle, ArrowRight, UserPlus
} from 'lucide-react';

const QUEUE_STAGES = [
    { id: 'pending_triage', title: 'Triage', icon: Activity, color: 'text-orange-500', dot: 'bg-orange-500' },
    { id: 'pending_cashier', title: 'Cashier', icon: CreditCard, color: 'text-amber-500', dot: 'bg-amber-500' },
    { id: 'waiting_doctor', title: 'Doctor Unit', icon: Users, color: 'text-blue-500', dot: 'bg-blue-500' },
    { id: 'with_doctor', title: 'Treatment', icon: Stethoscope, color: 'text-emerald-500', dot: 'bg-emerald-500' },
    { id: 'waiting_lab', title: 'Laboratory', icon: TestTube, color: 'text-violet-500', dot: 'bg-violet-500' },
    { id: 'waiting_radiology', title: 'Imaging', icon: ActivitySquare, color: 'text-indigo-500', dot: 'bg-indigo-500' },
    { id: 'ready_for_discharge', title: 'Pharmacy', icon: Pill, color: 'text-teal-500', dot: 'bg-teal-500' }
];

const WaitingRoom = () => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        fetchVisits();
        const interval = setInterval(fetchVisits, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchVisits = async () => {
        try {
            const res = await visitAPI.getAll({ status: 'active' });
            setVisits(res.data.visits || []);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch waiting room data', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientClick = (patientId) => {
        navigate(`/app/patients/${patientId}`);
    };

    const getWaitTime = (dateString) => {
        const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 flex flex-col gap-8 animate-in fade-in-50 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80">Operational Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Patient Flow <span className="text-slate-400 font-light">Monitor</span></h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Real-time tracking • Synchronized at {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchVisits}
                        className="h-12 px-5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Activity className="w-4 h-4 text-slate-400" />
                        Refresh
                    </button>
                    <button 
                        onClick={() => navigate('/app/visits/new')}
                        className="h-12 px-8 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10"
                    >
                        <UserPlus className="w-4 h-4" />
                        New Intake
                    </button>
                </div>
            </div>

            {/* Kanban View */}
            <div className="flex-1 overflow-x-auto flex gap-6 pb-6 -mx-2 px-2 snap-x">
                {QUEUE_STAGES.map(stage => {
                    const stageVisits = visits.filter(v => v.queueStatus === stage.id);
                    return (
                        <div key={stage.id} className="w-[320px] flex-shrink-0 flex flex-col gap-4 snap-start">
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-6 rounded-full ${stage.dot}`} />
                                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">{stage.title}</h3>
                                </div>
                                {stageVisits.length > 0 && (
                                    <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                                        {stageVisits.length} Units
                                    </span>
                                )}
                            </div>

                            {/* List Container */}
                            <div className="flex-1 bg-slate-100/50 rounded-[2rem] p-3 space-y-3 min-h-[400px] border border-slate-200/40">
                                {stageVisits.length === 0 ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-center opacity-30 select-none">
                                        <div className="w-12 h-12 rounded-full border border-dashed border-slate-400 flex items-center justify-center mb-3">
                                            <stage.icon className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Station Clear</span>
                                    </div>
                                ) : (
                                    stageVisits.map(visit => (
                                        <div 
                                            key={visit.id} 
                                            onClick={() => handlePatientClick(visit.patientId)}
                                            className="group relative bg-white p-5 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:shadow-blue-900/5 border border-slate-100 transition-all duration-300 cursor-pointer overflow-hidden"
                                        >
                                            {/* Urgency Indicator */}
                                            {visit.priority === 'urgent' && (
                                                <div className="absolute top-0 right-0 p-3">
                                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                                </div>
                                            )}

                                            <div className="mb-4">
                                                <h4 className="font-black text-slate-900 text-sm tracking-tight leading-tight group-hover:text-blue-600 transition-colors uppercase leading-none mb-1">
                                                    {visit.patient?.firstName} {visit.patient?.lastName}
                                                </h4>
                                                <p className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter uppercase">{visit.patient?.patientNumber}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                        <Clock className={`w-3.5 h-3.5 ${getWaitTime(visit.updatedAt).includes('h') ? 'text-rose-500' : 'text-slate-400'}`} />
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-tight ${getWaitTime(visit.updatedAt).includes('h') ? 'text-rose-600' : 'text-slate-600'}`}>
                                                        {getWaitTime(visit.updatedAt)}
                                                    </span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                    <ArrowRight className="w-4 h-4 text-blue-600" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WaitingRoom;
