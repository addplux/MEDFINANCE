import React, { useState, useEffect } from 'react';
import { payrollAPI } from '../../../services/apiService';
import { Download, Search, AlertCircle, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const StaffBalances = () => {
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        setLoading(true);
        try {
            const response = await payrollAPI.getStaffBalances();
            setBalances(response.data);
        } catch (error) {
            console.error('Failed to fetch staff balances:', error);
        } finally {
            setLoading(false);
        }
    };

    const sortedBalances = balances.sort((a, b) => parseFloat(b.totalDebt) - parseFloat(a.totalDebt));

    const displayedBalances = sortedBalances.filter(item => {
        const query = search.toLowerCase();
        return (
            item.staff?.firstName?.toLowerCase().includes(query) ||
            item.staff?.lastName?.toLowerCase().includes(query) ||
            item.staff?.email?.toLowerCase().includes(query)
        );
    });

    const totalOutstanding = balances.reduce((sum, item) => sum + parseFloat(item.totalDebt), 0);

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-bg-secondary p-6 rounded-lg border border-border-color flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-1">Total Outstanding Staff Debt</h2>
                    <p className="text-text-secondary text-sm">Amount owed by all staff members for medical bills</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-error-500">{formatCurrency(totalOutstanding)}</p>
                    <p className="text-xs text-text-secondary mt-1">{balances.length} staff members owe money</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search staff members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:border-primary-500 transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
                <table className="w-full">
                    <thead className="bg-bg-tertiary border-b border-border-color">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Staff Member</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Pending Deductions</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Debt</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-text-secondary">Loading balances...</td>
                            </tr>
                        ) : displayedBalances.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-text-secondary">No outstanding balances found.</td>
                            </tr>
                        ) : (
                            displayedBalances.map((item, index) => (
                                <tr key={index} className="hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-xs">
                                                {item.staff?.firstName?.[0]}{item.staff?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-text-primary">
                                                    {item.staff ? `${item.staff.firstName} ${item.staff.lastName}` : 'Unknown'}
                                                </div>
                                                <div className="text-xs text-text-secondary">
                                                    {item.staff?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary capitalize">
                                        {item.staff?.role?.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                        {item.pendingCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-bold text-error-400">
                                            {formatCurrency(item.totalDebt)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-primary-400 hover:text-primary-300 transition-colors">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffBalances;
