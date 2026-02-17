import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { specialistClinicAPI } from '../../services/apiService';
import { Plus, Search, DollarSign, FileText, AlertCircle } from 'lucide-react';

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Specialist Clinics</h1>
                    <p className="text-text-secondary">Manage specialist consultation billing</p>
                </div>
                <Link to="/app/specialist-clinics/billing/new" className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Consultation
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
                <select
                    className="form-select"
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
                                <th>Clinic Type</th>
                                <th>Specialist</th>
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
                                        No specialist clinic bills found
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
                                        <td className="capitalize">{bill.clinicType}</td>
                                        <td>{bill.specialistName}</td>
                                        <td>{new Date(bill.consultationDate).toLocaleDateString()}</td>
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
                                                to={`/app/specialist-clinics/billing/${bill.id}/edit`}
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

export default SpecialistClinics;
