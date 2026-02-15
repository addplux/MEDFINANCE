import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cashAPI } from '../../services/apiService';
import { Wallet, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const Payments = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadPayments();
    }, [currentPage]);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const params = { page: currentPage, limit: 10 };
            const response = await cashAPI.payments.getAll(params);
            setPayments(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to load payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) return;

        try {
            await cashAPI.payments.delete(id);
            loadPayments();
        } catch (error) {
            console.error('Failed to delete payment:', error);
            alert('Failed to delete payment');
        }
    };

    const getMethodBadge = (method) => {
        const badges = {
            cash: 'badge-success',
            card: 'badge-info',
            mobile_money: 'badge-primary',
            bank_transfer: 'badge-warning'
        };
        return `badge ${badges[method] || 'badge-info'} `;
    };

    const filteredPayments = payments.filter(payment =>
        payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-600 mt-1">Manage payment receipts</p>
                </div>
                <button
                    onClick={() => navigate('/app/cash/payments/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Payment
                </button>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search payments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-11"
                    />
                </div>
            </div>

            {/* Payments Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Receipt Number</th>
                                <th>Patient</th>
                                <th>Amount</th>
                                <th>Payment Method</th>
                                <th>Payment Date</th>
                                <th>Bill Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        {loading ? 'Loading...' : 'No payments found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="font-medium">{payment.receiptNumber}</td>
                                        <td>
                                            {payment.patient?.firstName} {payment.patient?.lastName}
                                        </td>
                                        <td className="font-semibold text-green-600">
                                            K {payment.amount?.toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={getMethodBadge(payment.paymentMethod)}>
                                                {payment.paymentMethod?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                        <td className="capitalize">{payment.billType || '-'}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/ app / cash / payments / ${payment.id} `)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/ app / cash / payments / ${payment.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button >
                                                <button
                                                    onClick={() => handleDelete(payment.id)}
                                                    className="btn btn-sm btn-danger"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div >
                                        </td >
                                    </tr >
                                ))
                            )}
                        </tbody >
                    </table >
                </div >

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

export default Payments;
