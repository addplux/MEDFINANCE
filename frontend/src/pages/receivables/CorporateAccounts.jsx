import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';

const CorporateAccounts = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAccounts();
    }, [statusFilter]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const response = await apiService.get('/receivables/corporate', { params });
            setAccounts(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching corporate accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(account =>
        account.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const badges = {
            'active': 'badge-success',
            'suspended': 'badge-warning',
            'inactive': 'badge-secondary'
        };
        return `badge ${badges[status] || 'badge-secondary'}`;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Corporate Accounts</h1>
                    <p className="page-subtitle">Manage company and employer billing accounts</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/app/receivables/corporate/new')}>
                    <Plus size={20} />
                    New Account
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading-state">Loading accounts...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Account Number</th>
                                    <th>Company Name</th>
                                    <th>Contact Person</th>
                                    <th>Phone</th>
                                    <th>Credit Limit</th>
                                    <th>Outstanding</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            <div className="empty-state">
                                                <Building2 size={48} />
                                                <p>No corporate accounts found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((account) => (
                                        <tr key={account.id}>
                                            <td className="font-medium">{account.accountNumber}</td>
                                            <td>{account.companyName}</td>
                                            <td>{account.contactPerson || '-'}</td>
                                            <td>{account.phone || '-'}</td>
                                            <td>K{parseFloat(account.creditLimit || 0).toLocaleString()}</td>
                                            <td>K{parseFloat(account.outstandingBalance || 0).toLocaleString()}</td>
                                            <td>
                                                <span className={getStatusBadge(account.status)}>
                                                    {account.status || 'active'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-sm btn-secondary"
                                                    onClick={() => navigate(`/app/receivables/corporate/${account.id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CorporateAccounts;
