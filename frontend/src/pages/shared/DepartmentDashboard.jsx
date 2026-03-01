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

    return (
        <div className="flex flex-col h-full space-y-3 animate-fade-in">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none">{title} Queue</h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50 mt-1">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {visits.length} PATIENTS
                            </span>
                            <span className="flex items-center gap-1 text-primary">
                                <DollarSign className="w-3 h-3" /> {visits.filter(v => v.billingSummary?.status === 'pending').length} PENDING BILLS
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="relative group">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find patient..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-md text-xs focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all w-40 placeholder-white/30 font-medium text-white"
                        />
                    </div>
                    <button onClick={loadData} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-all border border-white/10">
                        <RefreshCw className={`w-3.5 h-3.5 text-white/70 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {(['theatre', 'maternity', 'lab', 'radiology'].includes(type)) && (
                        <button
                            onClick={() => {
                                if (type === 'lab') navigate('/app/lab/request');
                                else if (type === 'radiology') navigate('/app/radiology/request');
                                else navigate(`/app/${type}/billing/new`);
                            }}
                            className="btn btn-primary ml-1 px-3 py-1.5 text-xs rounded-md shadow-sm"
                        >
                            + New Request
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 px-1 pb-1">
                {[
                    { id: 'all', label: 'ALL QUEUE' },
                    { id: 'pending_bill', label: 'PENDING BILLS' },
                    { id: 'high_frequency', label: 'MULTIPLE VISITS' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition-all border ${filter === f.id
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Compact Grid */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {filteredVisits.length === 0 ? (
                    <div className="h-48 glass-panel border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30">
                        <Users className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">Zero patients in queue</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {filteredVisits.map((v) => (
                            <div
                                key={v.id}
                                onClick={() => navigate(`/app/visits/${v.id}`)}
                                className="group relative glass-panel bg-white/[0.02] hover:bg-white/[0.05] p-3 border border-white/10 hover:border-white/20 transition-all cursor-pointer rounded-lg flex flex-col"
                            >
                                {/* Check-in Count Badge */}
                                {v.dailyCheckInCount > 1 && (
                                    <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-primary text-black text-[9px] font-black rounded shadow-sm">
                                        x{v.dailyCheckInCount}
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-2.5">
                                    <div className="flex gap-2.5 items-center">
                                        <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-colors shrink-0">
                                            <span className="text-xs font-bold text-white/60 group-hover:text-primary">
                                                {v.patient?.firstName?.charAt(0) || '?'}{v.patient?.lastName?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-white truncate leading-tight mb-0.5">
                                                {v.patient?.firstName} {v.patient?.lastName}
                                            </h3>
                                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-none truncate">
                                                {v.patient?.patientNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-white/30 flex items-center gap-1 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                                        <Clock className="w-3 h-3" />
                                        {new Date(v.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {/* Reason for visit */}
                                <div className="bg-black/20 rounded p-2 mb-2.5 border border-white/5">
                                    <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                                        {v.notes || 'No clinical notes provided.'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-1">
                                    {/* Billing Status */}
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${v.billingSummary?.status === 'pending' ? 'bg-primary shadow-[0_0_5px_rgba(255,0,204,0.5)] animate-pulse' :
                                            v.billingSummary?.status === 'cleared' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' :
                                                'bg-white/20'
                                            }`} />
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${v.billingSummary?.status === 'pending' ? 'text-primary' :
                                            v.billingSummary?.status === 'cleared' ? 'text-green-500' :
                                                'text-white/40'
                                            }`}>
                                            {v.billingSummary?.status === 'pending' ? `K${v.billingSummary.totalAmount} UNPAID` :
                                                v.billingSummary?.status === 'cleared' ? 'CLEARED' : 'NO BILL'}
                                        </span>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all">
                                        <ChevronRight className="w-4 h-4 text-white/50" />
                                    </div>
                                </div>

                                {/* Quick Actions for Theatre/Maternity */}
                                {(type === 'theatre' || type === 'maternity') && (
                                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Complete this ${type} visit?`)) {
                                                    visitAPI.update(v.id, { status: 'completed' })
                                                        .then(() => loadData())
                                                        .catch(err => alert('Failed to complete visit.'));
                                                }
                                            }}
                                            className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-[10px] font-bold transition-colors border border-green-500/20"
                                        >
                                            Complete
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
