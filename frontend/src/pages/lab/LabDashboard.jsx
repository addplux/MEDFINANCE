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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Laboratory Dashboard</h1>
                    <p className="text-text-secondary">Manage lab requests and results</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/app/lab/tests')}
                        className="btn btn-secondary"
                    >
                        Test Catalog
                    </button>
                    <button
                        onClick={() => navigate('/app/lab/request')}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Activity className="w-4 h-4" />
                        New Request
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{requests.filter(r => r.status === 'requested').length}</div>
                        <div className="text-sm text-gray-500">Pending Collection</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{requests.filter(r => r.status === 'sample_collected' || r.status === 'in_progress').length}</div>
                        <div className="text-sm text-gray-500">In Progress</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{requests.filter(r => r.status === 'completed').length}</div>
                        <div className="text-sm text-gray-500">Completed (Today)</div>
                    </div>
                </div>
                {/* Placeholder for critical results */}
                <div className="card p-4 flex items-center gap-4 border-2 border-red-500/20 bg-red-50/10">
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-red-600">{requests.filter(r => r.paymentStatus === 'unpaid').length}</div>
                        <div className="text-sm font-semibold text-red-700/60 uppercase tracking-tight">Unpaid Requests</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'requested', 'sample_collected', 'in_progress', 'completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f
                            ? 'bg-primary-600 text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary border-b border-border-color">
                            <tr>
                                <th className="text-left p-4 font-medium text-text-secondary">Req #</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Date</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Patient</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Tests</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Lab Status</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Payment</th>
                                <th className="text-left p-4 font-medium text-text-secondary">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-bg-tertiary/50">
                                    <td className="p-4 font-medium">{req.requestNumber}</td>
                                    <td className="p-4 text-sm text-text-secondary">
                                        {new Date(req.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium">{req.patient.firstName} {req.patient.lastName}</div>
                                        <div className="text-xs text-text-secondary">
                                            {req.patient.gender}, {new Date().getFullYear() - new Date(req.patient.dateOfBirth).getFullYear()} yrs
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {req.results.map(res => (
                                                <span key={res.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                                    {res.test.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">{getStatusBadge(req.status)}</td>
                                    <td className="p-4">{getPaymentStatusBadge(req.paymentStatus)}</td>
                                    <td className="p-4">
                                        {req.status === 'requested' && (
                                            <button
                                                onClick={() => handleStatusUpdate(req.id, 'sample_collected')}
                                                disabled={req.paymentStatus === 'unpaid'}
                                                className={`btn btn-sm ${req.paymentStatus === 'unpaid' 
                                                    ? 'btn-ghost cursor-not-allowed opacity-50' 
                                                    : 'btn-outline-primary'}`}
                                                title={req.paymentStatus === 'unpaid' ? 'Payment required before sample collection' : 'Collect Sample'}
                                            >
                                                {req.paymentStatus === 'unpaid' && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                                                Collect Sample
                                            </button>
                                        )}
                                        {(req.status === 'sample_collected' || req.status === 'in_progress') && (
                                            <button
                                                onClick={() => navigate(`/app/lab/results/${req.id}`)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                Enter Results
                                            </button>
                                        )}
                                        {req.status === 'completed' && (
                                            <button
                                                onClick={() => navigate(`/app/lab/results/${req.id}`)}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                View Results
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-text-secondary">
                                        No requests found for this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LabDashboard;
