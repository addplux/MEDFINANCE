
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ledgerAPI } from '../../services/apiService';
import { BookOpen, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const ChartOfAccounts = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        loadAccounts();
    }, [typeFilter]);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const params = { accountType: typeFilter || undefined };
            const response = await ledgerAPI.accounts.getAll(params);
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to load accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;

        try {
            await ledgerAPI.accounts.delete(id);
            loadAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account');
        }
    };

    const getTypeBadge = (type) => {
        const badges = {
            asset: 'badge-success',
            liability: 'badge-danger',
            equity: 'badge-info',
            revenue: 'badge-primary',
            expense: 'badge-warning'
        };
        return `badge ${badges[type] || 'badge-info'} `;
    };

    const filteredAccounts = accounts.filter(account =>
        account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.accountCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
                    <p className="text-gray-600 mt-1">Manage general ledger accounts</p>
                </div>
                <button
                    onClick={() => navigate('/app/ledger/accounts/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Account
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pl-11"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="">All Types</option>
                        <option value="asset">Asset</option>
                        <option value="liability">Liability</option>
                        <option value="equity">Equity</option>
                        <option value="revenue">Revenue</option>
                        <option value="expense">Expense</option>
                    </select>
                    <button onClick={loadAccounts} className="btn btn-secondary">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Account Code</th>
                                <th>Account Name</th>
                                <th>Type</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        {loading ? 'Loading...' : 'No accounts found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <tr key={account.id}>
                                        <td className="font-medium">{account.accountCode}</td>
                                        <td>{account.accountName}</td>
                                        <td>
                                            <span className={getTypeBadge(account.accountType)}>
                                                {account.accountType}
                                            </span>
                                        </td>
                                        <td className="font-semibold">
                                            K {account.balance?.toLocaleString() || '0.00'}
                                        </td>
                                        <td>
                                            <span className={`badge ${account.isActive ? 'badge-success' : 'badge-danger'} `}>
                                                {account.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/ app / ledger / accounts / ${account.id} `)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/ app / ledger / accounts / ${account.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button >
                                                <button
                                                    onClick={() => handleDelete(account.id)}
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
            </div >
        </div >
    );
};

export default ChartOfAccounts;
