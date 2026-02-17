import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { theatreAPI } from '../../services/apiService';
import { Plus, Search, DollarSign, FileText, AlertCircle } from 'lucide-react';

const TheatreBilling = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
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
            const response = await theatreAPI.bills.getAll(params);
            setBills(response.data.data || []);
        } catch (error) {
            console.error('Error fetching theatre bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await theatreAPI.revenue();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Theatre Billing</h1>
                    <p className="text-text-secondary">Manage surgical procedure billing</p>
                </div>
                <Link to="/app/theatre/billing/new" className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Theatre Bill
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
                                <p className="text-sm text-text-secondary">Total Paid</p>
                                <p className="text-2xl font-bold text-blue-600">K{stats.totalPaid?.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">K{stats.totalPending?.toLocaleString()}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4 flex gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search bills..."
                            className="form-input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
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
                                <th>Procedure</th>
                                <th>Surgeon</th>
                                <th>Date</th>
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
                                        No theatre bills found
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
                                        <td>{bill.procedureType}</td>
                                        <td>{bill.surgeonName}</td>
                                        <td>{new Date(bill.procedureDate).toLocaleDateString()}</td>
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
                                                to={`/app/theatre/billing/${bill.id}/edit`}
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

export default TheatreBilling;
