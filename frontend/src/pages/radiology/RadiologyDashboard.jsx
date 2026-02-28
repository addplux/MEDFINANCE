import React, { useState, useEffect } from 'react';
import { radiologyAPI } from '../../services/apiService';
import { Radio, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPaymentStatusBadge } from '../../utils/statusBadges';

const RadiologyDashboard = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

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
        switch (status) {
            case 'pending': return <span className="badge badge-warning">Pending</span>;
            case 'in_progress': return <span className="badge badge-info">In Progress</span>;
            case 'completed': return <span className="badge badge-success">Completed</span>;
            case 'reported': return <span className="badge badge-primary">Reported</span>;
            default: return <span className="badge badge-neutral">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Radiology Dashboard</h1>
                    <p className="text-text-secondary">Manage radiology requests and scans</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/app/radiology/request')}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Radio className="w-4 h-4" />
                        New Radiology Request
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
                        <div className="text-xl font-bold">{requests.filter(r => r.status === 'pending').length}</div>
                        <div className="text-sm text-gray-500">Pending Scans</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{requests.filter(r => r.status === 'in_progress').length}</div>
                        <div className="text-sm text-gray-500">In Progress</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{requests.filter(r => r.status === 'completed').length}</div>
                        <div className="text-sm text-gray-500">Completed</div>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{requests.filter(r => r.status === 'reported').length}</div>
                        <div className="text-sm text-gray-500">Reported</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'pending', 'in_progress', 'completed', 'reported'].map(f => (
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
                <div className="text-center py-8 text-text-secondary">Loading...</div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary border-b border-border-color">
                            <tr>
                                <th className="text-left p-4 font-medium text-text-secondary text-xs uppercase tracking-wider">Bill #</th>
                                <th className="text-left p-4 font-medium text-text-secondary text-xs uppercase tracking-wider">Date</th>
                                <th className="text-left p-4 font-medium text-text-secondary text-xs uppercase tracking-wider">Patient</th>
                                <th className="text-left p-4 font-medium text-text-secondary text-xs uppercase tracking-wider">Scan(s)</th>
                                <th className="text-left p-4 font-medium text-text-secondary text-xs uppercase tracking-wider">Status</th>
                                <th className="text-left p-4 font-medium text-text-secondary text-xs uppercase tracking-wider">Payment</th>
                                <th className="text-left p-4 font-medium text-text-secondary text-xs uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="p-4 font-semibold text-sm">{req.billNumber}</td>
                                    <td className="p-4 text-xs text-text-secondary font-medium">
                                        {new Date(req.billDate).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-sm">{req.patient.firstName} {req.patient.lastName}</div>
                                        <div className="text-[10px] text-text-secondary font-black tracking-widest uppercase">
                                            {req.patient.hospitalNumber}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-semibold text-text-secondary max-w-xs truncate">
                                            {req.scanType}
                                        </div>
                                    </td>
                                    <td className="p-4">{getStatusBadge(req.status)}</td>
                                    <td className="p-4">{getPaymentStatusBadge(req.paymentStatus)}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {req.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'in_progress')}
                                                    disabled={req.paymentStatus === 'unpaid'}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${req.paymentStatus === 'unpaid' 
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                                        : 'bg-primary-50 text-primary hover:bg-primary-100 border border-primary-200'}`}
                                                    title={req.paymentStatus === 'unpaid' ? 'Payment required' : 'Mark as In Progress'}
                                                >
                                                    {req.paymentStatus === 'unpaid' && <AlertTriangle className="w-3 h-3" />}
                                                    Start Scan
                                                </button>
                                            )}
                                            {req.status === 'in_progress' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'completed')}
                                                    className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Complete Scan
                                                </button>
                                            )}
                                            {(req.status === 'completed' || req.status === 'reported') && (
                                                <button
                                                    className="px-3 py-1.5 bg-white text-text-primary hover:bg-gray-50 border border-border-color rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Results
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-text-secondary italic">
                                        No radiology requests found.
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

export default RadiologyDashboard;
