import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI } from '../../services/apiService';
import { ArrowLeft, User, RefreshCw, AlertCircle, FileText, Activity } from 'lucide-react';

const TYPE_COLORS = {
    OPD: { bg: 'bg-blue-100', text: 'text-blue-800' },
    IPD: { bg: 'bg-purple-100', text: 'text-purple-800' },
    Pharmacy: { bg: 'bg-green-100', text: 'text-green-800' },
    Laboratory: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    Radiology: { bg: 'bg-orange-100', text: 'text-orange-800' },
    Theatre: { bg: 'bg-red-100', text: 'text-red-800' },
    Maternity: { bg: 'bg-pink-100', text: 'text-pink-800' },
    'Specialist Clinic': { bg: 'bg-teal-100', text: 'text-teal-800' },
};

const VisitTypeBadge = ({ type }) => {
    const cfg = TYPE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {type}
        </span>
    );
};

const getAmount = (visit) => {
    const candidates = [
        'totalAmount', 'totalBill', 'grandTotal', 'amount', 'totalCost',
        'billTotal', 'netAmount', 'total'
    ];
    for (const k of candidates) {
        if (visit[k] !== undefined && visit[k] !== null) return parseFloat(visit[k]);
    }
    return null;
};

const getDescription = (visit) => {
    const candidates = ['diagnosis', 'description', 'notes', 'billNumber', 'billNo', 'receiptNumber', 'consultationReason'];
    for (const k of candidates) {
        if (visit[k]) return visit[k];
    }
    return '—';
};

const getStatus = (visit) => {
    return visit.status || visit.paymentStatus || '—';
};

const statusColors = {
    paid: 'text-green-700 bg-green-50',
    unpaid: 'text-red-700 bg-red-50',
    pending: 'text-yellow-700 bg-yellow-50',
    partial: 'text-orange-700 bg-orange-50',
    cancelled: 'text-gray-500 bg-gray-50',
};

const PatientVisitHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await patientAPI.getVisitHistory(id);
            setData(res.data);
        } catch (err) {
            setError('Failed to load visit history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const visits = data?.visits || [];
    const filtered = typeFilter ? visits.filter(v => v.visitType === typeFilter) : visits;
    const types = [...new Set(visits.map(v => v.visitType))].sort();

    const totalSpend = visits.reduce((acc, v) => acc + (getAmount(v) || 0), 0);

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => navigate(`/app/patients/${id}`)} className="btn btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    {data?.patient && (
                        <h1 className="text-2xl font-bold text-gray-900">
                            {data.patient.firstName} {data.patient.lastName}
                        </h1>
                    )}
                    <p className="text-sm text-gray-500">
                        {data?.patient?.patientNumber} &mdash; Full Visit History
                    </p>
                </div>
                <button onClick={load} className="btn btn-secondary" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-4 text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Visits</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{visits.length}</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Visit Types</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{types.length}</p>
                    </div>
                    <div className="card p-4 text-center col-span-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Amount</p>
                        <p className="text-3xl font-bold text-indigo-700 mt-1">
                            ZMW {totalSpend.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            )}

            {/* Filter */}
            {types.length > 1 && (
                <div className="card p-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Filter by type:</span>
                    <button
                        onClick={() => setTypeFilter('')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${typeFilter === '' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}
                    >
                        All ({visits.length})
                    </button>
                    {types.map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${typeFilter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}
                        >
                            {t} ({visits.filter(v => v.visitType === t).length})
                        </button>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        Loading visit history…
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <p className="text-gray-600">{error}</p>
                        <button onClick={load} className="btn btn-secondary">Retry</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                        <Activity className="w-10 h-10" />
                        <p className="text-sm">No visit records found{typeFilter ? ` for ${typeFilter}` : ''}.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Description / Notes</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Amount (ZMW)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((visit, i) => {
                                        const amount = getAmount(visit);
                                        const status = getStatus(visit);
                                        const statusCls = statusColors[status?.toLowerCase()] || 'text-gray-500 bg-gray-50';
                                        return (
                                            <tr key={`${visit.visitType}-${visit.id ?? i}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <VisitTypeBadge type={visit.visitType} />
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                                    {getDescription(visit)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusCls}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                                                    {amount !== null ? amount.toLocaleString('en-ZM', { minimumFractionDigits: 2 }) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan="4" className="px-4 py-3 text-sm font-bold text-gray-700">
                                            Total ({filtered.length} records)
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-indigo-700">
                                            {filtered.reduce((a, v) => a + (getAmount(v) || 0), 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filtered.map((visit, i) => {
                                const amount = getAmount(visit);
                                const status = getStatus(visit);
                                const statusCls = statusColors[status?.toLowerCase()] || 'text-gray-500 bg-gray-50';
                                return (
                                    <div key={`${visit.visitType}-${visit.id ?? i}`} className="p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <VisitTypeBadge type={visit.visitType} />
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusCls}`}>{status}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 truncate">{getDescription(visit)}</p>
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>{visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : '—'}</span>
                                            <span className="font-bold text-gray-800">
                                                ZMW {amount !== null ? amount.toLocaleString('en-ZM', { minimumFractionDigits: 2 }) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PatientVisitHistory;
