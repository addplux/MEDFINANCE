import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitAPI } from '../../services/apiService';
import { 
    Users, Activity, CreditCard, Stethoscope, 
    TestTube, ActivitySquare, Pill, Clock, AlertCircle, ArrowRight, UserPlus, Scissors
} from 'lucide-react';

const QUEUE_STAGES = [
    { id: 'pending_triage', title: 'Triage', icon: Activity, dot: 'bg-orange-500' },
    { id: 'pending_cashier', title: 'Cashier', icon: CreditCard, dot: 'bg-amber-500' },
    { id: 'waiting_doctor', title: 'Consultation', icon: Users, dot: 'bg-blue-500' },
    { id: 'with_doctor', title: 'Clinical Unit', icon: Stethoscope, dot: 'bg-emerald-500' },
    { id: 'waiting_lab', title: 'Laboratory', icon: TestTube, dot: 'bg-violet-500' },
    { id: 'waiting_radiology', title: 'Imaging', icon: ActivitySquare, dot: 'bg-indigo-500' },
    { id: 'waiting_theatre', title: 'Theatre', icon: Scissors, dot: 'bg-rose-500' },
    { id: 'ready_for_discharge', title: 'Discharge/Rx', icon: Pill, dot: 'bg-teal-500' }
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
        <div className="min-h-screen bg-bg-primary p-6 lg:p-8 flex flex-col gap-8 animate-in fade-in duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-color">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600/80">Operational Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-black text-text-primary tracking-tighter leading-none mb-2">Patient <span className="font-light text-text-tertiary">Flow</span></h1>
                    <p className="text-text-secondary font-medium text-sm">
                        Enterprise throughput monitoring. <span className="text-text-tertiary/40 ml-2">Synced {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchVisits}
                        className="h-12 px-5 bg-bg-secondary border border-border-color text-text-secondary font-bold rounded-2xl hover:bg-bg-tertiary transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Clock className="w-4 h-4 text-text-tertiary" />
                    </button>
                    <button 
                        onClick={() => navigate('/app/visits/new')}
                        className="h-12 px-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 shadow-2xl shadow-black/20"
                    >
                        <UserPlus className="w-4 h-4" />
                        New Admission
                    </button>
                </div>
            </div>

            {/* Kanban View */}
            <div className="flex-1 overflow-x-auto flex gap-6 pb-12 -mx-4 px-4 snap-x hide-scrollbar">
                {QUEUE_STAGES.map(stage => {
                    const stageVisits = visits.filter(v => v.queueStatus === stage.id);
                    return (
                        <div key={stage.id} className="w-[305px] flex-shrink-0 flex flex-col gap-5 snap-start">
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-4 rounded-full ${stage.dot}`} />
                                    <h3 className="font-black text-text-primary text-[10px] uppercase tracking-[0.15em]">{stage.title}</h3>
                                </div>
                                {stageVisits.length > 0 && (
                                    <span className="text-[10px] font-black text-text-tertiary">
                                        {stageVisits.length}
                                    </span>
                                )}
                            </div>

                            {/* List Container */}
                            <div className="flex-1 bg-bg-secondary/50 rounded-[2.5rem] p-3 space-y-3 min-h-[500px] border border-border-color/30 group/column transition-all duration-500 hover:bg-bg-secondary/80">
                                {loading ? (
                                    <div className="h-40 flex items-center justify-center">
                                       <div className="w-4 h-4 rounded-full border-2 border-text-tertiary/20 border-t-text-tertiary animate-spin" />
                                    </div>
                                ) : stageVisits.length === 0 ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-center opacity-10 select-none">
                                        <stage.icon className="w-6 h-6 mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Idle</span>
                                    </div>
                                ) : (
                                    stageVisits.map(visit => (
                                        <div 
                                            key={visit.id} 
                                            onClick={() => handlePatientClick(visit.patientId)}
                                            className="group relative bg-bg-elevated p-6 rounded-[1.75rem] shadow-sm hover:shadow-2xl hover:shadow-black/20 border border-border-color transition-all duration-500 cursor-pointer overflow-hidden active:scale-95"
                                        >
                                            {/* Top Section */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h4 className="font-black text-text-primary text-sm tracking-tight group-hover:text-blue-500 transition-colors uppercase leading-none mb-1.5">
                                                        {visit.patient?.firstName} {visit.patient?.lastName}
                                                    </h4>
                                                    <p className="text-[10px] font-mono font-bold text-text-tertiary tracking-tighter uppercase">{visit.patient?.patientNumber}</p>
                                                </div>
                                                {visit.priority === 'urgent' && (
                                                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                                )}
                                            </div>

                                            {/* Bottom Section */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock className={`w-3 h-3 ${getWaitTime(visit.updatedAt).includes('h') ? 'text-rose-500' : 'text-text-tertiary'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${getWaitTime(visit.updatedAt).includes('h') ? 'text-rose-600' : 'text-text-secondary'}`}>
                                                        {getWaitTime(visit.updatedAt)}
                                                    </span>
                                                </div>
                                                <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                    Open Ref
                                                </div>
                                            </div>

                                            {/* Hover Glow */}
                                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
