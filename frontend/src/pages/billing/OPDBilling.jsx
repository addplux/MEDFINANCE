import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { getPaymentStatusBadge } from '../../utils/statusBadges';

const OPDBilling = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadBills();
    }, [currentPage, statusFilter]);

    const loadBills = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                status: statusFilter || undefined
            };
            const response = await billingAPI.opd.getAll(params);
            setBills(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to load bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bill?')) return;

        try {
            await billingAPI.opd.delete(id);
            loadBills();
        } catch (error) {
            console.error('Failed to delete bill:', error);
            alert('Failed to delete bill');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            paid: 'badge-success',
            cancelled: 'badge-danger'
        };
        return `badge ${badges[status] || 'badge-info'} `;
    };

    const filteredBills = bills.filter(bill =>
        bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && bills.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading bills...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">OPD Billing</h1>
                    <p className="text-gray-600 mt-1">Manage outpatient department bills</p>
                </div>
                <button
                    onClick={() => navigate('/app/billing/opd/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Bill
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search bills or patients..."
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
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={loadBills} className="btn btn-secondary">
                        <Filter className="w-5 h-5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Bills Table */}
            <div className="card overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Bill Number</th>
                                <th>Patient</th>
                                <th>Service</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Clinical Status</th>
                                <th>Payment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        No bills found
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td className="font-medium">{bill.billNumber}</td>
                                        <td>
                                            {bill.patient?.firstName} {bill.patient?.lastName}
                                        </td>
                                        <td>{bill.service?.serviceName}</td>
                                        <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                                        <td className="font-semibold">K {bill.netAmount?.toLocaleString()}</td>
                                        <td>
                                            <span className={getStatusBadge(bill.status)}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td>
                                            {getPaymentStatusBadge(bill.paymentStatus)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/billing/opd/${bill.id}`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/billing/opd/${bill.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bill.id)}
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
                    {filteredBills.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No bills found
                        </div>
                    ) : (
                        filteredBills.map((bill) => (
                            <div key={bill.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-gray-900">{bill.billNumber}</div>
                                        <div className="text-sm text-gray-500">{new Date(bill.billDate).toLocaleDateString()}</div>
                                    </div>
                                    <span className={getStatusBadge(bill.status)}>
                                        {bill.status}
                                    </span>
                                </div>
                                <div className="mt-2 text-right">
                                    {getPaymentStatusBadge(bill.paymentStatus)}
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Patient:</span>{' '}
                                        <span className="font-medium">{bill.patient?.firstName} {bill.patient?.lastName}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Service:</span>{' '}
                                        <span className="font-medium">{bill.service?.serviceName}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Amount:</span>{' '}
                                        <span className="font-bold text-primary-600">K {bill.netAmount?.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                    <button
                                        onClick={() => navigate(`/app/billing/opd/${bill.id}`)}
                                        className="btn btn-sm btn-secondary flex-1 justify-center"
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/app/billing/opd/${bill.id}/edit`)}
                                        className="btn btn-sm btn-secondary flex-1 justify-center"
                                    >
                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(bill.id)}
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
                {
                    totalPages > 1 && (
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
                    )
                }
            </div >
        </div >
    );
};

export default OPDBilling;
