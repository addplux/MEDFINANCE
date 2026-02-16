import React, { useState } from 'react';
import { Search, Eye, Filter } from 'lucide-react';

const ClaimsTracking = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Mock claims data
    const claims = [
        { id: 1, claimNumber: 'CLM-2026-001', billNumber: 'OPD-2026-001', patient: 'John Doe', amount: 250.00, submittedDate: '2026-02-10', status: 'Approved', paidAmount: 250.00 },
        { id: 2, claimNumber: 'CLM-2026-002', billNumber: 'OPD-2026-002', patient: 'Jane Smith', amount: 180.00, submittedDate: '2026-02-12', status: 'Pending', paidAmount: 0 },
        { id: 3, claimNumber: 'CLM-2026-003', billNumber: 'IPD-2026-001', patient: 'Bob Johnson', amount: 1500.00, submittedDate: '2026-02-08', status: 'Rejected', paidAmount: 0 },
        { id: 4, claimNumber: 'CLM-2026-004', billNumber: 'OPD-2026-005', patient: 'Alice Brown', amount: 320.00, submittedDate: '2026-02-14', status: 'Processing', paidAmount: 0 },
    ];

    const getStatusBadge = (status) => {
        const badges = {
            'Approved': 'badge-success',
            'Pending': 'badge-warning',
            'Processing': 'badge-info',
            'Rejected': 'badge-danger'
        };
        return `badge ${badges[status] || 'badge-secondary'}`;
    };

    const filteredClaims = claims.filter(claim => {
        const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.patient.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || claim.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Claims Tracking</h1>
                <p className="text-gray-600 mt-1">Monitor the status of submitted NHIMA claims</p>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by claim number or patient..."
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
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Claims Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Claim Number</th>
                                <th>Bill Number</th>
                                <th>Patient</th>
                                <th>Submitted Date</th>
                                <th>Amount</th>
                                <th>Paid Amount</th>
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
                                        <td>{claim.billNumber}</td>
                                        <td>{claim.patient}</td>
                                        <td>{new Date(claim.submittedDate).toLocaleDateString()}</td>
                                        <td className="font-semibold">K {claim.amount.toLocaleString()}</td>
                                        <td className="font-semibold">K {claim.paidAmount.toLocaleString()}</td>
                                        <td>
                                            <span className={getStatusBadge(claim.status)}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-sm text-gray-500">Total Claims</p>
                    <p className="text-2xl font-bold text-gray-900">{claims.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                        {claims.filter(c => c.status === 'Approved').length}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {claims.filter(c => c.status === 'Pending' || c.status === 'Processing').length}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-gray-500">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">
                        {claims.filter(c => c.status === 'Rejected').length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClaimsTracking;
