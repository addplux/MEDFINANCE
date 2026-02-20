import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { visitAPI } from '../../services/apiService';
import {
    Plus, Search, RefreshCw, Eye, LogOut,
    Stethoscope, BedDouble, Baby, Siren, ClipboardList
} from 'lucide-react';

const VISIT_TYPES = [
    { key: '', label: 'All', icon: ClipboardList, bg: 'bg-gray-100', text: 'text-gray-700' },
    { key: 'opd', label: 'OPD', icon: Stethoscope, bg: 'bg-blue-100', text: 'text-blue-800' },
    { key: 'inpatient', label: 'Inpatient', icon: BedDouble, bg: 'bg-purple-100', text: 'text-purple-800' },
    { key: 'maternity', label: 'Maternity', icon: Baby, bg: 'bg-pink-100', text: 'text-pink-800' },
    { key: 'emergency', label: 'Emergency', icon: Siren, bg: 'bg-red-100', text: 'text-red-800' },
];

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    discharged: 'bg-gray-100 text-gray-600',
    transferred: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-700',
};

const TypeBadge = ({ type }) => {
    const cfg = VISIT_TYPES.find(t => t.key === type) || VISIT_TYPES[0];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

const Visits = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);

    const typeFilter = searchParams.get('type') || '';
    const statusFilter = searchParams.get('status') || '';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await visitAPI.getAll({ search, visitType: typeFilter, status: statusFilter });
            setVisits(res.data.visits || []);
            setTotal(res.data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const setType = (t) => {
        const p = new URLSearchParams(searchParams);
        if (t) p.set('type', t); else p.delete('type');
        setSearchParams(p);
    };

    const quickDischarge = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Discharge this patient?')) return;
        try {
            await visitAPI.discharge(id);
            load();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to discharge');
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visits / Encounters</h1>
                    <p className="text-sm text-gray-500">{total} total visit{total !== 1 ? 's' : ''} recorded</p>
                </div>
                <button onClick={() => navigate('/app/visits/new')} className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Register Visit
                </button>
            </div>

            {/* Type filter chips */}
            <div className="card p-3 flex items-center gap-2 flex-wrap">
                {VISIT_TYPES.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setType(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${typeFilter === t.key
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                            }`}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}

                <div className="flex-1" />

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={e => {
                        const p = new URLSearchParams(searchParams);
                        if (e.target.value) p.set('status', e.target.value); else p.delete('status');
                        setSearchParams(p);
                    }}
                    className="form-select text-xs py-1.5 pr-8"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="discharged">Discharged</option>
                    <option value="transferred">Transferred</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                {/* Search */}
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search patient…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="form-input pl-8 py-1.5 text-sm w-48"
                    />
                </div>
                <button onClick={load} className="btn btn-secondary p-2" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading visits…
                    </div>
                ) : visits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                        <ClipboardList className="w-10 h-10" />
                        <p className="text-sm">No visits found.</p>
                        <button onClick={() => navigate('/app/visits/new')} className="btn btn-primary mt-2">
                            <Plus className="w-4 h-4" /> Register First Visit
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Visit #</th>
                                        <th className="px-4 py-3">Patient</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Department</th>
                                        <th className="px-4 py-3">Scheme</th>
                                        <th className="px-4 py-3">Admitted</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visits.map(v => (
                                        <tr
                                            key={v.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/app/visits/${v.id}`)}
                                        >
                                            <td className="px-4 py-3 font-mono text-sm text-indigo-700 font-semibold">{v.visitNumber}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900 text-sm">{v.patient?.firstName} {v.patient?.lastName}</div>
                                                <div className="text-xs text-gray-400">{v.patient?.patientNumber}</div>
                                            </td>
                                            <td className="px-4 py-3"><TypeBadge type={v.visitType} /></td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{v.department?.name || v.assignedDepartment || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{v.scheme?.name || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{v.admissionDate ? new Date(v.admissionDate).toLocaleDateString() : '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[v.status] || ''}`}>{v.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => navigate(`/app/visits/${v.id}`)} className="btn btn-secondary p-1.5" title="View">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    {v.status === 'active' && (
                                                        <button onClick={e => quickDischarge(e, v.id)} className="btn btn-secondary p-1.5 text-orange-600 hover:text-orange-700" title="Discharge">
                                                            <LogOut className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {visits.map(v => (
                                <div key={v.id} className="p-4 space-y-2" onClick={() => navigate(`/app/visits/${v.id}`)}>
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-indigo-700 font-bold text-sm">{v.visitNumber}</span>
                                        <TypeBadge type={v.visitType} />
                                    </div>
                                    <p className="font-medium text-gray-900">{v.patient?.firstName} {v.patient?.lastName}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                        <span>{v.department?.name || v.assignedDepartment || '—'}</span>
                                        <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[v.status] || ''}`}>{v.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Visits;
