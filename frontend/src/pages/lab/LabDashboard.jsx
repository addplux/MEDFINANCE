import React, { useState, useEffect } from 'react';
import { labAPI, visitAPI } from '../../services/apiService';
import { Activity, Clock, FileText, CheckCircle, AlertTriangle, DollarSign, Beaker, Users, RefreshCw, LogIn, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPaymentStatusBadge } from '../../utils/statusBadges';
import ServiceCatalogPanel from '../../components/shared/ServiceCatalogPanel';

const LabDashboard = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [queuedPatients, setQueuedPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, requested, sample_collected, completed, queue
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchRequests(), fetchQueue()]);
            setLoading(false);
        };
        loadData();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            const params = filter !== 'all' && filter !== 'queue' ? { status: filter } : {};
            const response = await labAPI.requests.getAll(params);
            setRequests(response.data || []);
        } catch (error) {
            console.error('Failed to fetch lab requests:', error);
        }
    };

    const fetchQueue = async () => {
        try {
            const response = await visitAPI.getDepartmentQueue('Laboratory');
            setQueuedPatients(response.data || []);
        } catch (error) {
            console.error('Failed to fetch department queue:', error);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await labAPI.requests.updateStatus(id, status);
            fetchRequests();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'requested': return <span className="badge badge-warning">Requested</span>;
            case 'sample_collected': return <span className="badge badge-info">Sample Collected</span>;
            case 'in_progress': return <span className="badge badge-primary">In Progress</span>;
            case 'completed': return <span className="badge badge-success">Completed</span>;
            default: return <span className="badge badge-neutral">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Beaker className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Laboratory Dashboard</h1>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {filter === 'queue' ? queuedPatients.length : requests.length} {filter === 'queue' ? 'WAITING' : 'TESTS'}
                            </span>
                            <span className="flex items-center gap-1 text-primary">
                                <DollarSign className="w-3 h-3" /> {requests.filter(r => r.paymentStatus === 'unpaid').length} UNPAID
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCatalogOpen(true)}
                        className="btn btn-secondary btn-sm border-white/10"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1 inline" />
                        Test Catalog
                    </button>
                    <button onClick={fetchRequests} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 ml-1">
                        <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => navigate('/app/lab/request')}
                        className="btn btn-primary ml-2 px-4 py-2 text-xs"
                    >
                        + New Request
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 px-2 pb-2">
                {[
                    { id: 'all', label: 'ALL REQUESTS' },
                    { id: 'queue', label: 'WAITING PATIENTS', count: queuedPatients.length },
                    { id: 'requested', label: 'REQUESTED' },
                    { id: 'sample_collected', label: 'SAMPLES IN' },
                    { id: 'in_progress', label: 'IN PROGRESS' },
                    { id: 'completed', label: 'COMPLETED' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`relative px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${filter === f.id
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                            }`}
                    >
                        {f.label}
                        {f.count > 0 && f.id !== 'all' && (
                            <span className={`flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black rounded-full shadow-md ${filter === f.id ? 'bg-primary text-white border border-primary/50' : 'bg-bg-tertiary text-white/80 border border-white/10'}`}>
                                {f.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="text-center py-8 text-sm text-white/70 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    Loading requests...
                </div>
            ) : (
                <div className="card overflow-hidden border border-border-color shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-bg-secondary border-b border-border-color">
                                {filter === 'queue' ? (
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Visit #</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Arrival Time</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Patient</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Priority</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Payment Status</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Action</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Req #</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Date</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Patient</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider w-1/4">Tests</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Payment</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Action</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-border-color bg-bg-primary text-text-primary">
                                {filter === 'queue' ? (
                                    queuedPatients.map((visit) => (
                                        <tr key={visit.id} className="hover:bg-bg-secondary transition-colors group">
                                            <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">{visit.visitNumber}</td>
                                            <td className="py-3 px-4 text-[13px] text-white/70 whitespace-nowrap">
                                                {new Date(visit.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-text-primary leading-snug">{visit.patient?.firstName} {visit.patient?.lastName}</div>
                                                <div className="text-[11px] text-white/70 font-bold uppercase tracking-tighter mt-0.5 whitespace-nowrap">
                                                    {visit.patient?.patientNumber} • {visit.patient?.paymentMethod}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                    visit.priority === 'urgent' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-bg-tertiary text-text-tertiary border border-border-color'
                                                }`}>
                                                    {visit.priority || 'Routine'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {getPaymentStatusBadge(visit.billingSummary?.status || 'none')}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/app/lab/request?visitId=${visit.id}`)}
                                                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group-hover:-translate-x-1"
                                                >
                                                    Create Order <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-bg-secondary transition-colors group">
                                            <td className="py-2.5 px-4 font-medium text-text-primary whitespace-nowrap">{req.requestNumber}</td>
                                            <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap">
                                                {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <div className="font-medium text-text-primary leading-snug">{req.patient.firstName} {req.patient.lastName}</div>
                                                <div className="text-[11px] text-white/70 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                                    <span className="capitalize">{req.patient.gender}</span>
                                                    <span>•</span>
                                                    <span>{new Date().getFullYear() - new Date(req.patient.dateOfBirth).getFullYear()} yrs</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {req.results.map(res => (
                                                        <span key={res.id} className="inline-flex px-1.5 py-0.5 bg-blue-900/40 text-blue-200 border border-blue-700/50 rounded text-[11px] font-medium leading-none whitespace-nowrap truncate max-w-[140px]" title={res.test.name}>
                                                            {res.test.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">{getPaymentStatusBadge(req.paymentStatus)}</td>
                                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                                {req.status === 'requested' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'sample_collected')}
                                                        disabled={req.paymentStatus === 'unpaid'}
                                                        className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${req.paymentStatus === 'unpaid'
                                                            ? 'bg-bg-tertiary text-text-muted cursor-not-allowed border border-border-color'
                                                            : 'bg-bg-secondary border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 shadow-sm'}`}
                                                        title={req.paymentStatus === 'unpaid' ? 'Payment required before sample collection' : 'Collect Sample'}
                                                    >
                                                        {req.paymentStatus === 'unpaid' && <AlertTriangle className="w-3 h-3 mr-1.5 inline" />}
                                                        Collect Sample
                                                    </button>
                                                )}
                                                {(req.status === 'sample_collected' || req.status === 'in_progress') && (
                                                    <button
                                                        onClick={() => navigate(`/app/lab/results/${req.id}`)}
                                                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all"
                                                    >
                                                        Enter Results
                                                    </button>
                                                )}
                                                {req.status === 'completed' && (
                                                    <button
                                                        onClick={() => navigate(`/app/lab/results/${req.id}`)}
                                                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-bg-secondary border border-border-color text-text-primary hover:bg-bg-tertiary shadow-sm transition-all"
                                                    >
                                                        View Results
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {(filter === 'queue' ? queuedPatients.length === 0 : requests.length === 0) && (
                                    <tr>
                                        <td colSpan="7" className="py-12 px-4 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                                                <FileText className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <h3 className="text-sm font-medium text-text-primary">No {filter === 'queue' ? 'waiting patients' : 'requests'} found</h3>
                                            <p className="mt-1 text-sm text-white/70">There are no {filter === 'queue' ? 'patients waiting for lab processing' : 'lab requests matching the selected filter'}.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ServiceCatalogPanel 
                isOpen={isCatalogOpen} 
                onClose={() => setIsCatalogOpen(false)} 
                department="Laboratory" 
            />
        </div>
    );
};

export default LabDashboard;





