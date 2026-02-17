import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { maternityAPI } from '../../services/apiService';
import { Plus, Search, DollarSign, FileText, AlertCircle, Baby } from 'lucide-react';

const MaternityBilling = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchBills();
        fetchStats();
    }, [statusFilter]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const response = await maternityAPI.bills.getAll(params);
            setBills(response.data.data || []);
        } catch (error) {
            console.error('Error fetching maternity bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await maternityAPI.revenue();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Maternity Billing</h1>
                    <p className="text-text-secondary">Manage maternity and delivery billing</p>
                </div>
                <Link to="/app/maternity/billing/new" className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Maternity Bill
                </Link>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary">Total Bills</p>
                                <p className="text-2xl font-bold text-text-primary">{stats.totalBills}</p>
                            </div>
                            <FileText className="w-8 h-8 text-primary-500" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-600">K{stats.totalRevenue?.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary">Normal Deliveries</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.byDeliveryType?.normal || 0}</p>
                            </div>
                            <Baby className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary">C-Sections</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.byDeliveryType?.['c-section'] || 0}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4 flex gap-4">
                <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                </select>
            </div>

            {/* Bills Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Bill Number</th>
                                <th>Patient</th>
                                <th>Delivery Type</th>
                                <th>Doctor</th>
                                <th>Delivery Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8">Loading...</td>
                                </tr>
                            ) : bills.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-text-secondary">
                                        No maternity bills found
                                    </td>
                                </tr>
                            ) : (
                                bills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td className="font-medium">{bill.billNumber}</td>
                                        <td>
                                            {bill.patient ?
                                                `${bill.patient.firstName} ${bill.patient.lastName}` :
                                                'N/A'
                                            }
                                        </td>
                                        <td className="capitalize">{bill.deliveryType}</td>
                                        <td>{bill.doctorName}</td>
                                        <td>{bill.deliveryDate ? new Date(bill.deliveryDate).toLocaleDateString() : 'Pending'}</td>
                                        <td className="font-medium">K{parseFloat(bill.totalAmount).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${bill.paymentStatus === 'paid' ? 'badge-success' :
                                                    bill.paymentStatus === 'partial' ? 'badge-warning' :
                                                        'badge-error'
                                                }`}>
                                                {bill.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/app/maternity/billing/${bill.id}/edit`}
                                                className="text-primary-600 hover:text-primary-700"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MaternityBilling;
