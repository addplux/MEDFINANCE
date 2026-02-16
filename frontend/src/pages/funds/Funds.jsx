import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fundAPI } from '../../services/apiService';
import { Plus, Search, Edit, Trash2, Building, TrendingUp, Shield, Clock } from 'lucide-react';

const Funds = () => {
    const navigate = useNavigate();
    const [funds, setFunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadFunds();
    }, []);

    const loadFunds = async () => {
        try {
            setLoading(true);
            const response = await fundAPI.getAll();
            setFunds(response.data);
        } catch (error) {
            console.error('Failed to load funds:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this fund?')) return;
        try {
            await fundAPI.delete(id);
            loadFunds();
        } catch (error) {
            console.error('Failed to delete fund:', error);
            alert('Failed to delete fund');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'badge-success',
            inactive: 'badge-secondary',
            closed: 'badge-danger'
        };
        return `badge ${badges[status] || 'badge-info'}`;
    };

    const totalBalance = funds.reduce((sum, fund) => sum + parseFloat(fund.currentBalance || 0), 0);

    const filteredFunds = funds.filter(fund =>
        fund.fundName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.fundType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Fund Accounts</h1>
                    <p className="page-subtitle">Manage restricted and unrestricted funds</p>
                </div>
                <button
                    onClick={() => navigate('/app/funds/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Fund
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="stat-card">
                    <div className="stat-label">Total Funds Balance</div>
                    <div className="stat-value">K {totalBalance.toLocaleString()}</div>
                    <div className="stat-trend text-success flex items-center gap-1">
                        <TrendingUp size={14} /> Global Portfolio
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Funds</div>
                    <div className="stat-value">{funds.length}</div>
                    <div className="stat-trend text-success flex items-center gap-1">
                        <Shield size={14} /> Operational
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Recent Transactions</div>
                    <div className="stat-value">0</div>
                    <div className="stat-trend text-text-secondary flex items-center gap-1">
                        <Clock size={14} /> Last 24h
                    </div>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="card mb-6">
                <div className="card-header border-b-0">
                    <div className="search-box">
                        <Search className="text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Search funds..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Funds List */}
            <div className="card">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fund Name</th>
                                <th>Type</th>
                                <th>Current Balance</th>
                                <th>Purpose</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFunds.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="empty-state">
                                            <Building size={48} />
                                            <p>{loading ? 'Loading...' : 'No funds found'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredFunds.map((fund) => (
                                    <tr key={fund.id}>
                                        <td className="font-semibold">{fund.fundName}</td>
                                        <td className="capitalize">{fund.fundType}</td>
                                        <td className="font-bold text-success">
                                            K {parseFloat(fund.currentBalance || 0).toLocaleString()}
                                        </td>
                                        <td>{fund.purpose || '-'}</td>
                                        <td>
                                            <span className={getStatusBadge(fund.status)}>
                                                {fund.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/funds/${fund.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(fund.id)}
                                                    className="btn btn-sm btn-danger"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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

export default Funds;
