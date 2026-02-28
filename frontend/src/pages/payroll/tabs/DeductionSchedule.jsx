import React, { useState, useEffect } from 'react';
import { payrollAPI, ledgerAPI } from '../../../services/apiService';
import { Download, Filter, Search, Calendar, ChevronDown, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const DeductionSchedule = () => {
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, deducted: 0 });
    const [filters, setFilters] = useState({
        period: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchDeductions();
    }, [filters.period, filters.status]);

    const fetchDeductions = async () => {
        setLoading(true);
        try {
            const response = await payrollAPI.getDeductions({
                period: filters.period,
                status: filters.status || undefined
            });
            setDeductions(response.data);
            calculateStats(response.data);
        } catch (error) {
            console.error('Failed to fetch deductions:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const pending = data.filter(item => item.status === 'Pending')
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const deducted = data.filter(item => item.status === 'Deducted')
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);

        setStats({ total, pending, deducted });
    };

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const filteredDeductions = deductions.filter(item => {
        const searchLower = filters.search.toLowerCase();
        return (
            item.staff?.firstName?.toLowerCase().includes(searchLower) ||
            item.staff?.lastName?.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower)
        );
    });

    const updateStatus = async (id, newStatus) => {
        try {
            setLoading(true);
            await payrollAPI.updateStatus(id, newStatus);
            await fetchDeductions();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBatchProcess = async () => {
        const pendingIds = filteredDeductions
            .filter(d => d.status === 'Pending')
            .map(d => d.id);

        if (pendingIds.length === 0) return;

        if (!window.confirm(`Are you sure you want to process ${pendingIds.length} pending deductions for ${filters.period}? This will generate General Ledger entries.`)) {
            return;
        }

        try {
            setLoading(true);
            await payrollAPI.batchUpdate({ ids: pendingIds, status: 'Deducted' });
            await fetchDeductions();
            alert(`Successfully processed ${pendingIds.length} deductions.`);
        } catch (error) {
            console.error('Batch processing failed:', error);
            alert('Batch processing failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-secondary p-4 rounded-lg border border-border-color">
                    <p className="text-sm text-text-secondary mb-1">Total Deductions</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg border border-border-color">
                    <p className="text-sm text-text-secondary mb-1">Pending Processing</p>
                    <p className="text-2xl font-bold text-warning-500">{formatCurrency(stats.pending)}</p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg border border-border-color">
                    <p className="text-sm text-text-secondary mb-1">Processed / Deducted</p>
                    <p className="text-2xl font-bold text-success-500">{formatCurrency(stats.deducted)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="month"
                            value={filters.period}
                            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                            className="pl-10 pr-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-primary-500 transition-all w-48"
                        />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary-500 transition-colors" />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="pl-10 pr-8 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-primary-500 transition-all appearance-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Deducted">Deducted</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                </div>

                <div className="relative group w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search staff or description..."
                        value={filters.search}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-primary-500 transition-all"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={handleBatchProcess}
                        disabled={loading || stats.pending === 0}
                        className="btn btn-primary flex items-center gap-2 w-full md:w-auto"
                    >
                        <CheckCircle size={18} />
                        Process {filteredDeductions.filter(d => d.status === 'Pending').length} Pending
                    </button>
                    <button onClick={fetchDeductions} className="btn btn-secondary p-2">
                        <Clock size={18} />
                    </button>
                </div>
            </div>

            {stats.pending > 0 && (
                <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-primary-500">Pending Payroll Reconcliation</h4>
                        <p className="text-xs text-text-secondary mt-1">
                            There are {deductions.filter(d => d.status === 'Pending').length} pending medical deductions for {filters.period}. 
                            Processing them will automatically generate General Ledger entries to reconcile staff debt against Salary Payables.
                        </p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary border-b border-border-color">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Staff Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-text-secondary">Loading...</td>
                                </tr>
                            ) : filteredDeductions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-text-secondary">No deductions found for this period.</td>
                                </tr>
                            ) : (
                                filteredDeductions.map((deduction) => (
                                    <tr key={deduction.id} className="hover:bg-bg-tertiary/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-text-primary">
                                                {deduction.staff ? `${deduction.staff.firstName} ${deduction.staff.lastName}` : 'Unknown Staff'}
                                            </div>
                                            <div className="text-xs text-text-secondary">
                                                {deduction.staff?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {deduction.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-text-primary">
                                                {formatCurrency(deduction.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {deduction.period}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${deduction.status === 'Deducted'
                                                    ? 'bg-success-500/10 text-success-500'
                                                    : 'bg-warning-500/10 text-warning-500'
                                                }`}>
                                                {deduction.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {deduction.status === 'Pending' && (
                                                <button
                                                    onClick={() => updateStatus(deduction.id, 'Deducted')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 rounded-md transition-colors text-xs font-medium"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Mark Deducted
                                                </button>
                                            )}
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

export default DeductionSchedule;
