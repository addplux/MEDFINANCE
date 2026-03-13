import React, { useState, useEffect } from 'react';
import { radiologyAPI } from '../../services/apiService';
import { Radio, Clock, CheckCircle, AlertTriangle, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPaymentStatusBadge } from '../../utils/statusBadges';
import ServiceCatalogPanel from '../../components/shared/ServiceCatalogPanel';

const RadiologyDashboard = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await radiologyAPI.requests.getAll(params);
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch radiology requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await radiologyAPI.requests.updateStatus(id, status);
            fetchRequests();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert(error.response?.data?.detail || error.response?.data?.error || 'Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider border whitespace-nowrap";
        switch (status) {
            case 'pending': return <span className={`${baseClasses} bg-yellow-900/40 text-yellow-200 border-yellow-700/50`}>Pending</span>;
            case 'in_progress': return <span className={`${baseClasses} bg-blue-900/40 text-blue-200 border-blue-700/50`}>In Progress</span>;
            case 'completed': return <span className={`${baseClasses} bg-green-900/40 text-green-200 border-green-700/50`}>Completed</span>;
            case 'reported': return <span className={`${baseClasses} bg-primary/20 text-primary border-primary/30`}>Reported</span>;
            default: return <span className={`${baseClasses} bg-gray-50 text-text-primary border-gray-200`}>{status}</span>;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Radio className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Radiology Dashboard</h1>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                            <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" /> {requests.length} SCANS
                            </span>
                            <span className="flex items-center gap-1 text-primary">
                                <AlertTriangle className="w-3 h-3" /> {requests.filter(r => r.paymentStatus === 'unpaid').length} UNPAID
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
                        Scan Catalog
                    </button>
                    <button onClick={fetchRequests} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 ml-1">
                        <Activity className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => navigate('/app/radiology/request')}
                        className="btn btn-primary ml-2 px-4 py-2 text-xs"
                    >
                        + New Request
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 px-2 pb-2">
                {[
                    { id: 'all', label: 'ALL REQUESTS', count: requests.length },
                    { id: 'pending', label: 'PENDING', count: requests.filter(r => r.status === 'pending').length },
                    { id: 'in_progress', label: 'IN PROGRESS', count: requests.filter(r => r.status === 'in_progress').length },
                    { id: 'completed', label: 'COMPLETED', count: requests.filter(r => r.status === 'completed').length },
                    { id: 'reported', label: 'REPORTED', count: requests.filter(r => r.status === 'reported').length }
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
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Bill #</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Date</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Patient</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider w-1/4">Scan(s)</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Payment</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color bg-bg-primary text-text-primary">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-bg-secondary transition-colors group">
                                        <td className="py-2.5 px-4 font-medium text-text-primary whitespace-nowrap">{req.billNumber}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap">
                                            {new Date(req.billDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <div className="font-medium text-text-primary leading-snug">{req.patient.firstName} {req.patient.lastName}</div>
                                            <div className="text-[11px] text-white/70 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                                <span className="font-bold tracking-widest uppercase">{req.patient.hospitalNumber}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <div className="inline-flex px-1.5 py-0.5 bg-blue-900/40 text-blue-200 border border-blue-700/50 rounded text-[11px] font-medium leading-none whitespace-nowrap truncate max-w-[200px]" title={req.scanType}>
                                                {req.scanType}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                                        <td className="py-2.5 px-4 whitespace-nowrap">{getPaymentStatusBadge(req.paymentStatus)}</td>
                                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                            {req.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'in_progress')}
                                                    disabled={req.paymentStatus === 'unpaid'}
                                                    className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${req.paymentStatus === 'unpaid'
                                                        ? 'bg-bg-tertiary text-text-muted cursor-not-allowed border border-border-color'
                                                        : 'bg-bg-secondary border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 shadow-sm'}`}
                                                >
                                                    {req.paymentStatus === 'unpaid' && <AlertTriangle className="w-3 h-3 mr-1.5 inline" />}
                                                    Start Scan
                                                </button>
                                            )}
                                            {req.status === 'in_progress' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'completed')}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all"
                                                >
                                                    Complete Scan
                                                </button>
                                            )}
                                            {(req.status === 'completed' || req.status === 'reported') && (
                                                <button
                                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-bg-secondary border border-border-color text-text-primary hover:bg-bg-tertiary shadow-sm transition-all"
                                                >
                                                    Results
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-12 px-4 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                                                <FileText className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <h3 className="text-sm font-medium text-text-primary">No requests found</h3>
                                            <p className="mt-1 text-sm text-white/70">There are no radiology requests matching the selected filter.</p>
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
                department="Radiology" 
            />
        </div>
    );
};

export default RadiologyDashboard;




