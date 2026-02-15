import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receivablesAPI } from '../../services/apiService';
import { FileText, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const NHIMAClaims = () => {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadClaims();
    }, [currentPage, statusFilter]);

    const loadClaims = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                status: statusFilter || undefined
            };
            const response = await receivablesAPI.nhima.getAll(params);
            setClaims(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to load claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this claim?')) return;

        try {
            await receivablesAPI.nhima.delete(id);
            loadClaims();
        } catch (error) {
            console.error('Failed to delete claim:', error);
            alert('Failed to delete claim');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-danger',
            paid: 'badge-info'
        };
        return `badge ${badges[status] || 'badge-info'}`;
    };

    const filteredClaims = claims.filter(claim =>
        claim.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.nhimaNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && claims.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading claims...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">NHIMA Claims</h1>
                    <p className="text-gray-600 mt-1">Manage NHIMA insurance claims</p>
                </div>
                <button
                    onClick={() => navigate('/app/receivables/nhima/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Claim
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search claims..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pl-11"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="paid">Paid</option>
                    </select>
                    <button onClick={loadClaims} className="btn btn-secondary">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Claims Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Claim Number</th>
                                <th>NHIMA Number</th>
                                <th>Patient</th>
                                <th>Claim Amount</th>
                                <th>Approved Amount</th>
                                <th>Submission Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-gray-500">
                                        No claims found
                                    </td>
                                </tr>
                            ) : (
                                filteredClaims.map((claim) => (
                                    <tr key={claim.id}>
                                        <td className="font-medium">{claim.claimNumber}</td>
                                        <td>{claim.nhimaNumber}</td>
                                        <td>
                                            {claim.patient?.firstName} {claim.patient?.lastName}
                                        </td>
                                        <td className="font-semibold">K {claim.claimAmount?.toLocaleString()}</td>
                                        <td className="font-semibold text-green-600">
                                            {claim.approvedAmount ? `K ${claim.approvedAmount.toLocaleString()}` : '-'}
                                        </td>
                                        <td>{new Date(claim.submissionDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={getStatusBadge(claim.status)}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/receivables/nhima/${claim.id}`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/receivables/nhima/${claim.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(claim.id)}
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

export default NHIMAClaims;
