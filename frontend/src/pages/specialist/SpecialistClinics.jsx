import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { specialistClinicAPI } from '../../services/apiService';
import { Plus, Search, DollarSign, FileText, AlertCircle, Stethoscope, RefreshCw } from 'lucide-react';
import { getPaymentStatusBadge } from '../../utils/statusBadges';

const SpecialistClinics = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [clinicFilter, setClinicFilter] = useState('');

    useEffect(() => {
        fetchBills();
        fetchStats();
    }, [statusFilter, clinicFilter]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (clinicFilter) params.clinicType = clinicFilter;
            const response = await specialistClinicAPI.bills.getAll(params);
            setBills(response.data.data || []);
        } catch (error) {
            console.error('Error fetching specialist clinic bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await specialistClinicAPI.revenue();
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
                        <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Specialist Clinics</h1>
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
                    <Link to="/app/specialist-clinics/billing/new" className="btn btn-primary ml-2 px-4 py-2 text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Consultation
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 px-2 pb-2">
                <select
                    className="form-select bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary"
                    value={clinicFilter}
                    onChange={(e) => setClinicFilter(e.target.value)}
                >
                    <option value="">All Clinics</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="neurology">Neurology</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="ophthalmology">Ophthalmology</option>
                    <option value="ent">ENT</option>
                    <option value="gynecology">Gynecology</option>
                    <option value="urology">Urology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="psychiatry">Psychiatry</option>
                    <option value="other">Other</option>
                </select>

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
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Clinic Type</th>
                                <th className="text-left py-3 px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Specialist</th>
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
                                        No specialist clinic bills found
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
                                        <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap capitalize">{bill.clinicType}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap">{bill.specialistName}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-white/70 whitespace-nowrap">{new Date(bill.consultationDate).toLocaleDateString()}</td>
                                        <td className="py-2.5 px-4 font-black text-white whitespace-nowrap">K{parseFloat(bill.totalAmount).toLocaleString()}</td>
                                        <td className="py-2.5 px-4 whitespace-nowrap">
                                            {getPaymentStatusBadge(bill.paymentStatus)}
                                        </td>
                                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                            <Link
                                                to={`/app/specialist-clinics/billing/${bill.id}/edit`}
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

export default SpecialistClinics;
