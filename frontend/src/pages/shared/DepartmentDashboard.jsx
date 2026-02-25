import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitAPI } from '../../services/apiService';
import {
    Users, Clock, DollarSign, Activity,
    ChevronRight, Search, RefreshCw, Filter,
    MoreHorizontal, Stethoscope, Beaker, Pill,
    Clipboard, Radio
} from 'lucide-react';

const DEPT_ICONS = {
    'Laboratory': Beaker,
    'Pharmacy': Pill,
    'Radiology': Radio,
    'OPD': Stethoscope,
    'Specialist': Clipboard
};

const DepartmentDashboard = ({ title, departmentId, type }) => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending_bill, high_frequency

    const Icon = DEPT_ICONS[title] || Activity;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch active visits for this department
            const res = await visitAPI.getAll({
                status: 'active',
                departmentId: departmentId,
                search: search
            });
            setVisits(res.data.visits || []);
        } catch (error) {
            console.error('Failed to load department data:', error);
        } finally {
            setLoading(false);
        }
    }, [departmentId, search]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [loadData]);

    const filteredVisits = visits.filter(v => {
        if (filter === 'pending_bill') return v.billingSummary?.status === 'pending';
        if (filter === 'high_frequency') return (v.dailyCheckInCount || 0) > 1;
        return true;
    });

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">{title} Queue</h1>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {visits.length} PATIENTS
                            </span>
                            <span className="flex items-center gap-1 text-primary">
                                <DollarSign className="w-3 h-3" /> {visits.filter(v => v.billingSummary?.status === 'pending').length} PENDING BILLS
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find patient..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-full text-xs focus:ring-2 focus:ring-primary/20 focus:bg-white/10 transition-all w-48 placeholder-white/20 font-bold text-white"
                        />
                    </div>
                    <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                        <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {(type === 'theatre' || type === 'maternity' || type === 'lab') && (
                        <button
                            onClick={() => navigate(type === 'lab' ? '/app/lab/request' : `/app/${type}/billing/new`)}
                            className="btn btn-primary ml-2 px-4 py-2 text-xs"
                        >
                            + New {title} Request
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 px-2">
                {[
                    { id: 'all', label: 'ALL QUEUE' },
                    { id: 'pending_bill', label: 'PENDING BILLS' },
                    { id: 'high_frequency', label: 'MULTIPLE VISITS' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f.id
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Compact Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredVisits.length === 0 ? (
                    <div className="h-64 glass-panel border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-white/20">
                        <Users className="w-12 h-12 mb-2 opacity-10" />
                        <p className="text-sm font-bold tracking-tight">Zero patients in queue</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {filteredVisits.map((v) => (
                            <div
                                key={v.id}
                                onClick={() => navigate(`/app/visits/${v.id}`)}
                                className="group relative glass-panel hover:bg-white/[0.04] p-4 border-white/5 hover:border-white/10 transition-all cursor-pointer rounded-[1.5rem]"
                            >
                                {/* Check-in Count Badge */}
                                {v.dailyCheckInCount > 1 && (
                                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-primary text-black text-[9px] font-black rounded-lg shadow-lg shadow-primary/20 animate-bounce-subtle">
                                        x{v.dailyCheckInCount} TODAY
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                                            <span className="text-[10px] font-black text-white/40 group-hover:text-primary transition-colors">
                                                {v.patient?.firstName?.charAt(0)}{v.patient?.lastName?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white tracking-tight leading-none mb-1">
                                                {v.patient?.firstName} {v.patient?.lastName}
                                            </h3>
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">
                                                {v.patient?.patientNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-white/40 flex items-center gap-1 justify-end uppercase">
                                            <Clock className="w-3 h-3" />
                                            {new Date(v.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Reason for visit */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 mb-3 group-hover:bg-white/[0.04] transition-all">
                                    <p className="text-[11px] font-semibold text-white/60 line-clamp-2 italic leading-relaxed">
                                        "{v.notes || 'No specific clinical notes added for this encounter.'}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    {/* Billing Status */}
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${v.billingSummary?.status === 'pending' ? 'bg-primary shadow-[0_0_8px_rgba(255,0,204,0.6)] animate-pulse' :
                                            v.billingSummary?.status === 'cleared' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                                'bg-white/10'
                                            }`} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${v.billingSummary?.status === 'pending' ? 'text-primary' :
                                            v.billingSummary?.status === 'cleared' ? 'text-green-500' :
                                                'text-white/20'
                                            }`}>
                                            {v.billingSummary?.status === 'pending' ? `K${v.billingSummary.totalAmount} UNPAID` :
                                                v.billingSummary?.status === 'cleared' ? 'BILL CLEARED' : 'NO BILL'}
                                        </span>
                                    </div>

                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                                        <ChevronRight className="w-4 h-4 text-white/40" />
                                    </div>
                                </div>

                                {/* Quick Actions for Theatre/Maternity */}
                                {(type === 'theatre' || type === 'maternity') && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Are you sure you want to mark this ${type} visit as complete? This will remove the patient from the queue.`)) {
                                                    visitAPI.update(v.id, { status: 'completed' })
                                                        .then(() => loadData())
                                                        .catch(err => alert('Failed to complete visit.'));
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-xs font-bold transition-colors border border-green-500/20"
                                        >
                                            Complete {type === 'theatre' ? 'Surgery' : 'Visit'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentDashboard;
