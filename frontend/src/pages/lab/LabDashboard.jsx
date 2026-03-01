import React, { useState, useEffect } from 'react';
import { labAPI } from '../../services/apiService';
import { Activity, Clock, FileText, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPaymentStatusBadge } from '../../utils/statusBadges';

const LabDashboard = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, requested, sample_collected, completed

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await labAPI.requests.getAll(params);
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch lab requests:', error);
        } finally {
            setLoading(false);
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Laboratory Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage lab requests and results</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/app/lab/tests')}
                        className="btn btn-secondary btn-sm border-border-color"
                    >
                        Test Catalog
                    </button>
                    <button
                        onClick={() => navigate('/app/lab/request')}
                        className="btn btn-primary btn-sm flex items-center gap-1.5"
                    >
                        <Activity className="w-3.5 h-3.5" />
                        New Request
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="card p-3 flex items-center gap-3 border border-border-color shadow-sm">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold leading-none mb-1 text-gray-900">{requests.filter(r => r.status === 'requested').length}</div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</div>
                    </div>
                </div>
                <div className="card p-3 flex items-center gap-3 border border-border-color shadow-sm">
                    <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold leading-none mb-1 text-gray-900">{requests.filter(r => r.status === 'sample_collected' || r.status === 'in_progress').length}</div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Progress</div>
                    </div>
                </div>
                <div className="card p-3 flex items-center gap-3 border border-border-color shadow-sm">
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold leading-none mb-1 text-gray-900">{requests.filter(r => r.status === 'completed').length}</div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</div>
                    </div>
                </div>
                {/* Placeholder for critical results */}
                <div className="card p-3 flex items-center gap-3 border-l-4 border-l-red-500 border-y border-r border-border-color bg-gradient-to-r from-red-50/50 to-transparent shadow-sm">
                    <div className="p-2 rounded-lg bg-red-100 text-red-600">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold leading-none mb-1 text-red-600">{requests.filter(r => r.paymentStatus === 'unpaid').length}</div>
                        <div className="text-xs font-bold text-red-700/80 uppercase tracking-wider">Unpaid Requests</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
                {['all', 'requested', 'sample_collected', 'in_progress', 'completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors border ${filter === f
                            ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
                            : 'bg-white border-border-color text-gray-500 hover:bg-bg-secondary'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    Loading requests...
                </div>
            ) : (
                <div className="card overflow-hidden border border-border-color shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm hover:table-fixed">
                            <thead className="bg-bg-secondary border-b border-border-color">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Req #</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Tests</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color bg-white text-gray-900">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-bg-secondary/50 transition-colors group">
                                        <td className="py-2.5 px-4 font-medium text-gray-900 whitespace-nowrap">{req.requestNumber}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-gray-500 whitespace-nowrap">
                                            {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <div className="font-medium text-gray-900 leading-snug">{req.patient.firstName} {req.patient.lastName}</div>
                                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                                <span className="capitalize">{req.patient.gender}</span>
                                                <span>•</span>
                                                <span>{new Date().getFullYear() - new Date(req.patient.dateOfBirth).getFullYear()} yrs</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {req.results.map(res => (
                                                    <span key={res.id} className="inline-flex px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[11px] font-medium leading-none whitespace-nowrap truncate max-w-[140px]" title={res.test.name}>
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
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                        : 'bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 shadow-sm'}`}
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
                                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                                                >
                                                    View Results
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
                                            <h3 className="text-sm font-medium text-gray-900">No requests found</h3>
                                            <p className="mt-1 text-sm text-gray-500">There are no lab requests matching the selected filter.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabDashboard;
