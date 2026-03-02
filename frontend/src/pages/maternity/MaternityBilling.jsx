import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { maternityAPI } from '../../services/apiService';
import { Plus, Search, DollarSign, FileText, AlertCircle, Baby, RefreshCw } from 'lucide-react';
import { getPaymentStatusBadge } from '../../utils/statusBadges';

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
        <div className="flex flex-col h-full space-y-4 animate-fade-in">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Baby className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Maternity Billing</h1>
                        {stats && (
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> {stats.totalBills} BILLS
                                </span>
                                <span className="flex items-center gap-1 text-green-500">
                                    <DollarSign className="w-3 h-3" /> K{stats.totalRevenue?.toLocaleString()} REVENUE
                                </span>
                                <span className="flex items-center gap-1 text-blue-500">
                                    <Baby className="w-3 h-3" /> {stats.byDeliveryType?.normal || 0} NORMAL
                                </span>
                                <span className="flex items-center gap-1 text-orange-500">
                                    <AlertCircle className="w-3 h-3" /> {stats.byDeliveryType?.['c-section'] || 0} C-SECTION
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={fetchBills} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 ml-1">
                        <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link to="/app/maternity/billing/new" className="btn btn-primary ml-2 px-4 py-2 text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Maternity Bill
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 px-2 pb-2">
                <div className="flex gap-1.5 overflow-x-auto">
                    {[
                        { id: '', label: 'ALL STATUS' },
                        { id: 'pending', label: 'PENDING' },
                        { id: 'partial', label: 'PARTIAL' },
                        { id: 'paid', label: 'PAID' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${statusFilter === f.id
                                ? 'bg-primary text-white border-primary/50'
                                : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
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
                                            {getPaymentStatusBadge(bill.paymentStatus)}
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
