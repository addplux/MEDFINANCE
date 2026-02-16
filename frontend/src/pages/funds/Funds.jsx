import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import api from '../../services/apiClient';

const Funds = () => {
    const navigate = useNavigate();
    const [funds, setFunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBalance: 0,
        nhimaBalance: 0,
        donorBalance: 0,
        retentionBalance: 0
    });

    useEffect(() => {
        fetchFunds();
    }, []);

    const fetchFunds = async () => {
        try {
            setLoading(true);
            const response = await api.get('/funds');
            setFunds(response.data);

            // Calculate stats
            const stats = response.data.reduce((acc, fund) => {
                acc.totalBalance += parseFloat(fund.balance || 0);
                if (fund.fundType === 'nhima') acc.nhimaBalance += parseFloat(fund.balance || 0);
                if (fund.fundType === 'donor') acc.donorBalance += parseFloat(fund.balance || 0);
                if (fund.fundType === 'retention') acc.retentionBalance += parseFloat(fund.balance || 0);
                return acc;
            }, { totalBalance: 0, nhimaBalance: 0, donorBalance: 0, retentionBalance: 0 });

            setStats(stats);
        } catch (error) {
            console.error('Error fetching funds:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFundTypeLabel = (type) => {
        const labels = {
            'nhima': 'NHIMA Fund',
            'donor': 'Donor Fund',
            'retention': 'Retention Fund',
            'general': 'General Fund'
        };
        return labels[type] || type;
    };

    const getFundTypeBadge = (type) => {
        const badges = {
            'nhima': 'badge-primary',
            'donor': 'badge-success',
            'retention': 'badge-warning',
            'general': 'badge-secondary'
        };
        return `badge ${badges[type] || 'badge-secondary'}`;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Fund Accounting</h1>
                    <p className="page-subtitle">Manage designated funds and track balances</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/app/funds/new')}>
                    <Plus size={18} className="mr-2" />
                    New Fund
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Balance</p>
                            <h3 className="text-2xl font-bold mt-1">K{stats.totalBalance.toLocaleString()}</h3>
                        </div>
                        <DollarSign className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">NHIMA Fund</p>
                            <h3 className="text-2xl font-bold mt-1">K{stats.nhimaBalance.toLocaleString()}</h3>
                        </div>
                        <TrendingUp className="text-primary" size={32} />
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Donor Fund</p>
                            <h3 className="text-2xl font-bold mt-1">K{stats.donorBalance.toLocaleString()}</h3>
                        </div>
                        <TrendingUp className="text-success" size={32} />
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Retention Fund</p>
                            <h3 className="text-2xl font-bold mt-1">K{stats.retentionBalance.toLocaleString()}</h3>
                        </div>
                        <TrendingDown className="text-warning" size={32} />
                    </div>
                </div>
            </div>

            {/* Funds List */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-semibold">All Funds</h2>
                </div>

                {loading ? (
                    <div className="loading-state">Loading funds...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fund Code</th>
                                    <th>Fund Name</th>
                                    <th>Type</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {funds.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center">
                                            <div className="empty-state">
                                                <DollarSign size={48} />
                                                <p>No funds found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    funds.map((fund) => (
                                        <tr key={fund.id}>
                                            <td className="font-medium">{fund.fundCode}</td>
                                            <td>{fund.fundName}</td>
                                            <td>
                                                <span className={getFundTypeBadge(fund.fundType)}>
                                                    {getFundTypeLabel(fund.fundType)}
                                                </span>
                                            </td>
                                            <td className="font-medium">K{parseFloat(fund.balance || 0).toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${fund.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                                                    {fund.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-sm btn-secondary"
                                                    onClick={() => navigate(`/app/funds/${fund.id}`)}
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

export default Funds;
