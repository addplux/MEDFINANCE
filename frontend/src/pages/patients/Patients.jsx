import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/apiService';
import { Users, Plus, Search, Eye, Edit, Trash2, GitMerge, Filter } from 'lucide-react';

const PATIENT_TYPES = [
    { value: '', label: 'All Categories' },
    { value: 'nhima', label: 'NHIMA' },
    { value: 'cash', label: 'Cash' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'private_prepaid', label: 'Private Prepaid' },
    { value: 'staff', label: 'Staff' },
    { value: 'foc', label: 'FOC' },
    { value: 'emergency', label: 'Emergency' },
];

const TYPE_BADGE = {
    nhima: { label: 'NHIMA', bg: 'bg-blue-100', text: 'text-blue-800' },
    cash: { label: 'Cash', bg: 'bg-green-100', text: 'text-green-800' },
    corporate: { label: 'Corporate', bg: 'bg-purple-100', text: 'text-purple-800' },
    private_prepaid: { label: 'Private Prepaid', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    staff: { label: 'Staff', bg: 'bg-pink-100', text: 'text-pink-800' },
    foc: { label: 'FOC', bg: 'bg-gray-100', text: 'text-gray-700' },
    emergency: { label: 'Emergency', bg: 'bg-red-100', text: 'text-red-800' },
    scheme: { label: 'Scheme', bg: 'bg-teal-100', text: 'text-teal-800' },
    exempted: { label: 'Exempted', bg: 'bg-orange-100', text: 'text-orange-800' },
};

const PatientTypeBadge = ({ type }) => {
    const cfg = TYPE_BADGE[type] || { label: type, bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                    <p className="text-gray-500 mt-1 text-sm">{total.toLocaleString()} patient{total !== 1 ? 's' : ''} registered</p>
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

            {/* Search & Filter */}
            <div className="card p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, patient ID, NHIMA, NRC or phone…"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="form-input pl-10 w-full"
                        />
                    </div>
                    <div className="relative min-w-44">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={categoryFilter}
                            onChange={handleCategoryChange}
                            className="form-select pl-9 w-full"
                        >
                            {PATIENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Patients Table */}
            <div className="card overflow-hidden">
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs font-bold text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
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
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-10 text-gray-400 text-sm">Loading…</td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-10 text-gray-400 text-sm">No patients found</td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
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
                                        <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-800">{patient.patientNumber}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs font-semibold text-gray-900">{patient.firstName} {patient.lastName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600 capitalize">{patient.gender}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">{patient.phone || '—'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">{patient.nrc || '—'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                                                {patient.totalVisits || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <PatientTypeBadge type={patient.paymentMethod} />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => navigate(`/app/patients/${patient.id}`)}
                                                    className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                                    title="View Master Record"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/patients/${patient.id}/edit`)}
                                                    className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(patient.id)}
                                                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
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
                        <div className="text-center py-8 text-gray-400">No patients found</div>
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
                                        <PatientTypeBadge type={patient.paymentMethod} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div><span className="text-gray-400">Gender: </span><span className="capitalize">{patient.gender}</span></div>
                                    <div><span className="text-gray-400">Phone: </span>{patient.phone || '—'}</div>
                                    <div><span className="text-gray-400">NRC: </span>{patient.nrc || '—'}</div>
                                </div>
                                <div className="pt-2 border-t border-gray-100 flex gap-2">
                                    <button onClick={() => navigate(`/app/patients/${patient.id}`)} className="btn btn-sm btn-secondary flex-1 justify-center">
                                        <Eye className="w-3 h-3 mr-1" /> View
                                    </button>
                                    <button onClick={() => navigate(`/app/patients/${patient.id}/edit`)} className="btn btn-sm btn-secondary flex-1 justify-center">
                                        <Edit className="w-3 h-3 mr-1" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(patient.id)} className="btn btn-sm btn-danger flex-1 justify-center">
                                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
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
