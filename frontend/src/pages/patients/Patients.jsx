import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/apiService';
import { Users, Plus, Search, Eye, Edit, Trash2, GitMerge, ClipboardList, Banknote, Building, CreditCard, Stethoscope, Gift, Siren, RefreshCw, ShieldOff, ShieldCheck, ShieldAlert } from 'lucide-react';

const PATIENT_TYPES = [
    { value: '', label: 'All', icon: Users },
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'corporate', label: 'Corporate', icon: Building },
    { value: 'private_prepaid', label: 'Prepaid', icon: CreditCard },
    { value: 'staff', label: 'Staff', icon: Stethoscope },
    { value: 'foc', label: 'FOC', icon: Gift },
    { value: 'emergency', label: 'Emergency', icon: Siren },
];

const TYPE_BADGE = {
    cash: { label: 'Cash', bg: 'bg-green-100', text: 'text-green-800' },
    corporate: { label: 'Corporate', bg: 'bg-purple-100', text: 'text-purple-800' },
    private_prepaid: { label: 'Private Prepaid', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    staff: { label: 'Staff', bg: 'bg-pink-100', text: 'text-pink-800' },
    foc: { label: 'FOC', bg: 'bg-gray-100', text: 'text-gray-700' },
    emergency: { label: 'Emergency', bg: 'bg-red-100', text: 'text-red-800' },
    scheme: { label: 'Scheme', bg: 'bg-teal-100', text: 'text-teal-800' },
    exempted: { label: 'Exempted', bg: 'bg-orange-100', text: 'text-orange-800' },
};

import { Battery } from 'lucide-react';

const PatientTypeBadge = ({ patient }) => {
    const type = patient?.paymentMethod || 'cash';
    const cfg = TYPE_BADGE[type] || { label: type, bg: 'bg-gray-100', text: 'text-gray-700' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
            {type === 'private_prepaid' && patient?.balance !== undefined && (
                <span className="flex items-center gap-0.5 ml-1 pl-2 border-l border-current/20">
                    <Battery className="w-3.5 h-3.5" />
                    <span>ZK {Number(patient.balance).toLocaleString()}</span>
                </span>
            )}
        </span>
    );
};

const Patients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadPatients();
    }, [currentPage, searchTerm, categoryFilter]);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 15,
                search: searchTerm || undefined,
                paymentMethod: categoryFilter || undefined,
            };
            const response = await patientAPI.getAll(params);
            setPatients(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to load patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this patient?')) return;
        try {
            await patientAPI.delete(id);
            loadPatients();
        } catch (error) {
            console.error('Failed to delete patient:', error);
            alert('Failed to delete patient');
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (e) => {
        setCategoryFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = async (patient) => {
        const next = patient.memberStatus === 'active' ? 'suspended'
            : patient.memberStatus === 'suspended' ? 'closed'
                : 'active';
        const label = next === 'suspended' ? 'suspend' : next === 'closed' ? 'close' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${label} ${patient.firstName} ${patient.lastName}'s account?`)) return;
        try {
            await patientAPI.update(patient.id, { memberStatus: next });
            loadPatients();
        } catch (err) {
            alert('Failed to update account status.');
        }
    };

    const StatusIcon = ({ status }) => {
        if (status === 'suspended') return <ShieldAlert className="w-4 h-4" />;
        if (status === 'closed') return <ShieldOff className="w-4 h-4" />;
        return <ShieldCheck className="w-4 h-4" />;
    };

    const statusBtnClass = (status) => {
        if (status === 'suspended') return 'p-2 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 rounded-full transition-colors';
        if (status === 'closed') return 'p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-full transition-colors';
        return 'p-2 hover:bg-green-500/20 text-green-400 hover:text-green-300 rounded-full transition-colors';
    };

    const statusTitle = (status) => {
        if (status === 'active') return 'Suspend Account';
        if (status === 'suspended') return 'Close Account';
        return 'Reactivate Account';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-white">Patients</h1>
                    <p className="text-white/50 mt-1 text-sm">{total.toLocaleString()} patient{total !== 1 ? 's' : ''} registered</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/app/patients/merge')}
                        className="btn btn-secondary"
                    >
                        <GitMerge className="w-4 h-4" />
                        Merge Duplicates
                    </button>
                    <button
                        onClick={() => navigate('/app/patients/new')}
                        className="btn btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        New Patient
                    </button>
                </div>
            </div>

            {/* Type filter chips */}
            <div className="card p-3 flex items-center gap-2 flex-wrap">
                {PATIENT_TYPES.map(t => (
                    <button
                        key={t.value}
                        onClick={() => {
                            setCategoryFilter(t.value);
                            setCurrentPage(1);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-semibold border transition-colors ${categoryFilter === t.value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white/5 text-white/60 border-white/10 hover:border-indigo-400 hover:text-white'
                            }`}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}

                <div className="flex-1" />

                {/* Search */}
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search patient…"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="form-input rounded-full pl-8 py-2 text-sm w-48 sm:w-64 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                </div>
                <button onClick={() => { setCurrentPage(1); loadPatients(); }} className="btn btn-secondary rounded-full p-2" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Patients Table */}
            <div className="card overflow-hidden">
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] uppercase font-bold text-white/40 tracking-wider bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap">Photo</th>
                                <th className="px-4 py-3 whitespace-nowrap">Patient No.</th>
                                <th className="px-4 py-3 whitespace-nowrap">Name</th>
                                <th className="px-4 py-3 whitespace-nowrap">Gender</th>
                                <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                                <th className="px-4 py-3 whitespace-nowrap">NRC</th>
                                <th className="px-4 py-3 whitespace-nowrap">Visits</th>
                                <th className="px-4 py-3 whitespace-nowrap">Category</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-10 text-gray-400 text-sm">Loading…</td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <Users className="w-10 h-10" />
                                            <p className="text-sm">No patients found.</p>
                                            <button onClick={() => navigate('/app/patients/new')} className="btn btn-primary mt-2">
                                                <Plus className="w-4 h-4" /> New Patient
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2">
                                            {patient.photoUrl ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL || ''}${patient.photoUrl}`}
                                                    alt={`${patient.firstName}`}
                                                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                                                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-white">{patient.patientNumber}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs font-semibold text-white">{patient.firstName} {patient.lastName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-white/60 capitalize">{patient.gender}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-white/60">{patient.phone || '—'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-white/60">{patient.nrc || '—'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white">
                                                {patient.totalVisits || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <PatientTypeBadge patient={patient} />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/patients/${patient.id}`)}
                                                    className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors"
                                                    title="View Master Record"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/patients/${patient.id}/edit`)}
                                                    className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(patient)}
                                                    className={statusBtnClass(patient.memberStatus)}
                                                    title={statusTitle(patient.memberStatus)}
                                                >
                                                    <StatusIcon status={patient.memberStatus} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(patient.id)}
                                                    className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-full transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden p-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
                    ) : patients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                            <Users className="w-10 h-10" />
                            <p className="text-sm">No patients found.</p>
                            <button onClick={() => navigate('/app/patients/new')} className="btn btn-primary mt-2">
                                <Plus className="w-4 h-4" /> New Patient
                            </button>
                        </div>
                    ) : (
                        patients.map((patient) => (
                            <div key={patient.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                                <div className="flex items-start gap-3">
                                    {patient.photoUrl ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL || ''}${patient.photoUrl}`}
                                            alt={patient.firstName}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base flex-shrink-0">
                                            {patient.firstName?.[0]}{patient.lastName?.[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">{patient.firstName} {patient.lastName}</div>
                                        <div className="text-xs text-gray-500">{patient.patientNumber}</div>
                                        <PatientTypeBadge patient={patient} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div><span className="text-gray-400">Gender: </span><span className="capitalize">{patient.gender}</span></div>
                                    <div><span className="text-gray-400">Phone: </span>{patient.phone || '—'}</div>
                                    <div><span className="text-gray-400">NRC: </span>{patient.nrc || '—'}</div>
                                </div>
                                <div className="pt-3 border-t border-gray-100 flex gap-2 flex-wrap">
                                    <button onClick={() => navigate(`/app/patients/${patient.id}`)} className="btn btn-sm btn-secondary rounded-full flex-1 justify-center">
                                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                                    </button>
                                    <button onClick={() => navigate(`/app/patients/${patient.id}/edit`)} className="btn btn-sm btn-secondary rounded-full flex-1 justify-center">
                                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                                    </button>
                                    <button onClick={() => handleStatusChange(patient)} className="btn btn-sm btn-secondary rounded-full flex-1 justify-center" title={statusTitle(patient.memberStatus)}>
                                        <StatusIcon status={patient.memberStatus} />
                                        <span className="ml-1">{patient.memberStatus === 'active' ? 'Suspend' : patient.memberStatus === 'suspended' ? 'Close' : 'Reactivate'}</span>
                                    </button>
                                    <button onClick={() => handleDelete(patient.id)} className="btn btn-sm btn-danger rounded-full flex-1 justify-center">
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                        <div className="text-sm text-white/50">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-sm btn-secondary"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-sm btn-secondary"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Patients;
