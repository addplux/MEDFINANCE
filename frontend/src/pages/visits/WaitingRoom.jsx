import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitAPI, patientAPI } from '../../services/apiService';
import { 
    Users, Activity, CreditCard, Stethoscope, 
    TestTube, ActivitySquare, Pill, Clock, AlertTriangle, ArrowRight, UserPlus, Filter 
} from 'lucide-react';

const QUEUE_STAGES = [
    { id: 'pending_triage', title: 'Triage / Vitals', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'pending_cashier', title: 'Cashier / Billing', icon: CreditCard, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'waiting_doctor', title: 'Waiting for Doctor', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'with_doctor', title: 'With Doctor', icon: Stethoscope, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'waiting_lab', title: 'Laboratory', icon: TestTube, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'waiting_radiology', title: 'Radiology', icon: ActivitySquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'ready_for_discharge', title: 'Discharge / Pharmacy', icon: Pill, color: 'text-teal-500', bg: 'bg-teal-500/10' }
];

const WaitingRoom = () => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        fetchVisits();
        const interval = setInterval(fetchVisits, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchVisits = async () => {
        try {
            // Fetch all ACTIVE visits
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
        const diff = Math.floor((new Date() - new Date(dateString)) / 60000); // in minutes
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        Live Waiting Room
                    </h1>
                    <p className="text-sm text-text-secondary mt-1 font-medium">
                        Real-time tracking of patient flow and wait times • Updated at {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchVisits} className="btn btn-secondary px-4 glass-panel">
                        <Activity className="w-4 h-4 mr-2" />
                        Refresh Live
                    </button>
                    <button onClick={() => navigate('/app/visits/new')} className="btn btn-primary bg-blue-600 hover:bg-blue-700 shadow-lg px-6">
                        <UserPlus className="w-4 h-4 mr-2" />
                        New Walk-in
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto flex gap-6 pb-4 snap-x">
                {QUEUE_STAGES.map(stage => {
                    const stageVisits = visits.filter(v => v.queueStatus === stage.id);
                    const StageIcon = stage.icon;
                    return (
                        <div key={stage.id} className="w-80 flex-shrink-0 flex flex-col bg-bg-secondary rounded-2xl border border-border-color shadow-sm snap-center h-full">
                            {/* Column Header */}
                            <div className="p-4 border-b border-border-color flex items-center justify-between bg-bg-tertiary/50 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stage.bg}`}>
                                        <StageIcon className={`w-5 h-5 ${stage.color}`} />
                                    </div>
                                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">{stage.title}</h3>
                                </div>
                                <div className="text-xs font-black bg-bg-elevated px-2.5 py-1 rounded-md text-text-secondary shadow-sm">
                                    {stageVisits.length}
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {loading && stageVisits.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </div>
                                ) : stageVisits.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                                        <StageIcon className="w-10 h-10 mb-3 text-text-tertiary" />
                                        <p className="text-sm font-medium text-text-tertiary">Queue empty</p>
                                    </div>
                                ) : (
                                    stageVisits.map(visit => (
                                        <div 
                                            key={visit.id} 
                                            onClick={() => handlePatientClick(visit.patientId)}
                                            className="bg-bg-elevated p-4 rounded-xl border border-border-color shadow-sm hover:shadow-md hover:border-blue-400 group cursor-pointer transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-bold text-text-primary text-sm group-hover:text-blue-600 transition-colors uppercase truncate max-w-[180px]">
                                                        {visit.patient?.firstName} {visit.patient?.lastName}
                                                    </h4>
                                                    <p className="text-[10px] font-mono text-text-tertiary mt-0.5">{visit.patient?.patientNumber}</p>
                                                </div>
                                                {visit.priority === 'urgent' && (
                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                                        <AlertTriangle className="w-3 h-3" /> Urgent
                                                    </span>
                                                )}
                                            </div>

                                            <div className="bg-bg-tertiary/50 p-2 rounded-lg mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className={getWaitTime(visit.updatedAt).includes('h') ? 'text-orange-500 font-bold' : ''}>
                                                        Wait: {getWaitTime(visit.updatedAt)}
                                                    </span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
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
