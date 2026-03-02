import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { theatreAPI } from '../../services/apiService';
import { Plus, Search, DollarSign, FileText, AlertCircle, Activity, RefreshCw } from 'lucide-react';
import { getPaymentStatusBadge } from '../../utils/statusBadges';

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
        <div className="flex flex-col h-full space-y-4 animate-fade-in">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Theatre Billing</h1>
                        {stats && (
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> {stats.totalBills} BILLS
                                </span>
                                <span className="flex items-center gap-1 text-green-500">
                                    <DollarSign className="w-3 h-3" /> K{stats.totalRevenue?.toLocaleString()} REVENUE
                                </span>
                                <span className="flex items-center gap-1 text-blue-500">
                                    <DollarSign className="w-3 h-3" /> K{stats.totalPaid?.toLocaleString()} PAID
                                </span>
                                <span className="flex items-center gap-1 text-orange-500">
                                    <AlertCircle className="w-3 h-3" /> K{stats.totalPending?.toLocaleString()} PENDING
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={fetchBills} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 ml-1">
                        <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link to="/app/theatre/billing/new" className="btn btn-primary ml-2 px-4 py-2 text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Theatre Bill
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 px-2 pb-2">
                <div className="relative group flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search bills..."
                        className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-full text-xs focus:ring-2 focus:ring-primary/20 focus:bg-white/10 transition-all placeholder-white/20 font-bold text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

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
            <div className="card overflow-hidden border border-white/5 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Bill #</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Patient</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Procedure</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Surgeon</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Date</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Amount</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                                <th className="text-right py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
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
                                    <tr key={bill.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-2.5 px-4 font-bold text-white whitespace-nowrap">{bill.billNumber}</td>
                                        <td className="py-2.5 px-4">
                                            <div className="font-bold text-white leading-snug">
                                                {bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap">{bill.procedureType}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap">{bill.surgeonName}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap">{new Date(bill.procedureDate).toLocaleDateString()}</td>
                                        <td className="py-2.5 px-4 font-black text-white whitespace-nowrap">K{parseFloat(bill.totalAmount).toLocaleString()}</td>
                                        <td className="py-2.5 px-4 whitespace-nowrap">
                                            {getPaymentStatusBadge(bill.paymentStatus)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                            <Link
                                                to={`/app/theatre/billing/${bill.id}/edit`}
                                                className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all bg-white/5 border border-white/10 text-white hover:bg-primary/20 hover:border-primary/50 hover:text-primary"
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
