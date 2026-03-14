import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordsAPI, patientAPI } from '../../services/apiService';
import {
    Search, FileText, UserPlus, Clock, CheckCircle2,
    AlertCircle, Filter, MoreHorizontal, ChevronRight,
    LayoutDashboard, Activity, Database, Users, Eye
} from 'lucide-react';

const RecordsDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalRequests: 0, pendingRequests: 0, fulfilledToday: 0, totalPatients: 0 });
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    const [searching, setSearching] = useState(false);
    const [patientsLoading, setPatientsLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, requestsRes, patientsRes] = await Promise.all([
                recordsAPI.fileRequests.getStats(),
                recordsAPI.fileRequests.getAll(),
                patientAPI.getAll({ limit: 10 })
            ]);
            setStats(statsRes.data);
            setRequests(requestsRes.data);
            setAllPatients(patientsRes.data.data || []);
        } catch (error) {
            console.error('Failed to load records data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            setSearching(true);
            try {
                const res = await patientAPI.getAll({ search: query, limit: 10 });
                setSearchResults(res.data.data || []);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleFulfill = async (requestId) => {
        const location = window.prompt('Enter file storage location (Shelf/Bay):');
        if (!location) return;
        try {
            await recordsAPI.fileRequests.fulfill(requestId, location);
            loadData();
        } catch (error) {
            alert('Fulfillment failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Database className="w-6 h-6 text-blue-400" />
                        </div>
                        Records Management
                    </h1>
                    <p className="text-sm text-white/50 mt-1 font-medium">Coordinate medical records and patient file requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/app/patients/registration')}
                        className="btn btn-primary bg-blue-600 hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)] border-none px-6"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        New Patient
                    </button>
                </div>
            </div>

            {/* Quick Search & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className={`w-5 h-5 transition-colors ${searching ? 'text-blue-400' : 'text-white/30'}`} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="Find patient by Name, NRC, or File Number..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                        />
                        {searching && <div className="absolute right-4 top-4 w-5 h-5 border-2 border-blue-500/50 border-t-transparent rounded-full animate-spin"></div>}

                        {/* Search Suggestions */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                                {searchResults.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => navigate(`/app/patients/${p.id}`)}
                                        className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                                                {p.firstName?.[0]}{p.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{p.firstName} {p.lastName}</p>
                                                <p className="text-xs text-white/40 font-mono">{p.patientNumber} · {p.nrc}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-all opacity-0 group-hover:opacity-100" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pending Requests List */}
                    <div className="card overflow-hidden border-white/5">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-400" />
                                Open File Requests
                            </h2>
                            <Filter className="w-4 h-4 text-white/30 cursor-pointer hover:text-white" />
                        </div>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="py-20 text-center space-y-3">
                                <FileText className="w-12 h-12 text-white/10 mx-auto" />
                                <p className="text-white/30 text-sm">No pending file requests found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {requests.map(req => (
                                    <div key={req.id} className="p-4 hover:bg-white/[0.02] flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`p-2 rounded-xl flex-shrink-0 ${req.urgency === 'emergency' ? 'bg-red-500/20 text-red-500 animate-pulse' :
                                                    req.urgency === 'urgent' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        onClick={() => navigate(`/app/patients/${req.patient?.id}`)}
                                                        className="font-bold text-white uppercase truncate hover:text-blue-400 cursor-pointer transition-colors"
                                                    >
                                                        {req.patient?.firstName} {req.patient?.lastName}
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                        req.urgency === 'emergency' ? 'bg-red-600 text-white' :
                                                        req.urgency === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                                        'bg-white/10 text-white/60'
                                                    }`}>
                                                        {req.urgency}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/40 mt-0.5">
                                                    Requested by <span className="text-white/70">{req.requestedBy?.firstName}</span> · {new Date(req.requestedAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {req.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleFulfill(req.id)}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5"
                                                >
                                                    Fulfill Request
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-xl text-xs font-bold">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {req.location}
                                                </div>
                                            )}
                                            <button className="p-2 text-white/30 hover:text-white transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* All Patients Registry */}
                    <div className="card overflow-hidden border-white/5">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-400" />
                                Patient Registry
                            </h2>
                            <button 
                                onClick={() => navigate('/app/patients')}
                                className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                            >
                                View All
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : allPatients.length === 0 ? (
                            <div className="py-16 text-center space-y-4">
                                <div className="p-4 bg-white/5 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                    <Users className="w-8 h-8 text-white/10" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white font-bold">No patients registered yet</p>
                                    <p className="text-white/30 text-xs">Start by adding your first patient to the registry</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/app/patients/registration')}
                                    className="btn btn-secondary border-none bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-6"
                                >
                                    Register Patient
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {allPatients.map(p => (
                                    <div key={p.id} className="p-4 hover:bg-white/[0.02] flex items-center justify-between group transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 group-hover:scale-105 transition-transform">
                                                {p.firstName?.[0]}{p.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white uppercase group-hover:text-blue-400 transition-colors">{p.firstName} {p.lastName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-white/40 font-mono tracking-tighter bg-white/5 px-1.5 py-0.5 rounded uppercase">
                                                        {p.patientNumber}
                                                    </span>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                                        p.paymentMethod === 'corporate' ? 'bg-purple-500/20 text-purple-400' :
                                                        p.paymentMethod === 'private_prepaid' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {p.paymentMethod}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/app/patients/${p.id}`)}
                                            className="p-2 bg-white/5 hover:bg-blue-600 text-white/40 hover:text-white rounded-xl transition-all border border-white/5"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="card p-5 bg-gradient-to-br from-blue-600 to-blue-800 border-none relative overflow-hidden group shadow-lg shadow-blue-500/20">
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Registered Patients</h4>
                            <p className="text-4xl font-black text-white mt-2">{(stats.totalPatients || 0).toLocaleString()}</p>
                            <p className="text-xs text-white/50 mt-1">Growth: +12% this month</p>
                        </div>

                        <div className="card p-5 bg-white/[0.03] border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                            <div>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active File Requests</h4>
                                <p className="text-2xl font-black text-white mt-1">{(stats.totalRequests || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                                <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>

                        <div className="card p-5 bg-white/[0.03] border-white/5 flex items-center justify-between">
                            <div>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pending Requests</h4>
                                <p className="text-2xl font-black text-orange-400 mt-1">{stats.pendingRequests}</p>
                            </div>
                            <div className="p-3 bg-orange-500/10 rounded-2xl">
                                <Clock className="w-6 h-6 text-orange-500" />
                            </div>
                        </div>

                        <div className="card p-5 bg-white/[0.03] border-white/5 flex items-center justify-between">
                            <div>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Fulfilled Today</h4>
                                <p className="text-2xl font-black text-green-400 mt-1">{stats.fulfilledToday}</p>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-2xl">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="card p-5 border-white/5">
                        <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-4">Registry Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5">
                                <div className="p-2 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-[10px] font-bold text-white tracking-widest">ARCHIVE</span>
                            </button>
                            <button className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5">
                                <div className="p-2 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-[10px] font-bold text-white tracking-widest">HISTORY</span>
                            </button>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-500 uppercase">Records Tip</span>
                        </div>
                        <p className="text-[11px] text-yellow-200/60 leading-relaxed font-medium">
                            Always ensure the "Current Location" is updated when pulling a physical file to prevent loss in transit.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordsDashboard;
