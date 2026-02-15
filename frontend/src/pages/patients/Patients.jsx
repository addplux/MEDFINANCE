import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../../services/apiService';
import { Users, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const Patients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadPatients();
    }, [currentPage, searchTerm]);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                search: searchTerm || undefined
            };
            const response = await patientAPI.getAll(params);
            setPatients(response.data.data);
            setTotalPages(response.data.totalPages);
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

    if (loading && patients.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading patients...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                    <p className="text-gray-600 mt-1">Manage patient records</p>
                </div>
                <button
                    onClick={() => navigate('/app/patients/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Patient
                </button>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, patient number, or NHIMA..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-11"
                    />
                </div>
            </div>

            {/* Patients Table */}
            <div className="card overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Patient Number</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Phone</th>
                                <th>NHIMA Number</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        No patients found
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id}>
                                        <td className="font-medium">{patient.patientNumber}</td>
                                        <td>{patient.firstName} {patient.lastName}</td>
                                        <td className="capitalize">{patient.gender}</td>
                                        <td>{patient.phone}</td>
                                        <td>{patient.nhimaNumber || '-'}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/patients/${patient.id}`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/patients/${patient.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(patient.id)}
                                                    className="btn btn-sm btn-danger"
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

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {patients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No patients found
                        </div>
                    ) : (
                        patients.map((patient) => (
                            <div key={patient.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
                                        <div className="text-sm text-gray-500">{patient.patientNumber}</div>
                                    </div>
                                    <span className="badge badge-info capitalize">
                                        {patient.gender}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Phone:</span>{' '}
                                        <span className="font-medium">{patient.phone}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">NHIMA:</span>{' '}
                                        <span className="font-medium">{patient.nhimaNumber || '-'}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                    <button
                                        onClick={() => navigate(`/app/patients/${patient.id}`)}
                                        className="btn btn-sm btn-secondary flex-1 justify-center"
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/app/patients/${patient.id}/edit`)}
                                        className="btn btn-sm btn-secondary flex-1 justify-center"
                                    >
                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(patient.id)}
                                        className="btn btn-sm btn-danger flex-1 justify-center"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="card-footer flex items-center justify-between">
                        <div className="text-sm text-gray-600">
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
