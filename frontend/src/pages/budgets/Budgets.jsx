import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetAPI } from '../../services/apiService';
import { PieChart, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const Budgets = () => {
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadBudgets();
    }, [statusFilter]);

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const params = { status: statusFilter || undefined };
            const response = await budgetAPI.getAll(params);
            setBudgets(response.data.data || []);
        } catch (error) {
            console.error('Failed to load budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this budget?')) return;

        try {
            await budgetAPI.delete(id);
            loadBudgets();
        } catch (error) {
            console.error('Failed to delete budget:', error);
            alert('Failed to delete budget');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-danger'
        };
        return `badge ${badges[status] || 'badge-info'}`;
    };

    const calculateVariance = (budget) => {
        const variance = budget.budgetAmount - (budget.actualSpent || 0);
        const percentage = ((variance / budget.budgetAmount) * 100).toFixed(1);
        return { variance, percentage };
    };

    const filteredBudgets = budgets.filter(budget =>
        budget.department?.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.fiscalYear?.includes(searchTerm)
    );

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Department Budgets</h1>
                    <p className="page-subtitle">Track departmental spending and budget variance</p>
                </div>
                <button
                    onClick={() => navigate('/app/budgets/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Budget
                </button>
            </div>

            <div className="card mb-6">
                <div className="card-header border-b-0 flex flex-col md:flex-row gap-4">
                    <div className="search-box">
                        <Search className="text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Search by department or year..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select md:w-48"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Budgets Table */}
            <div className="card">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Fiscal Year</th>
                                <th>Budget Amount</th>
                                <th>Actual Spent</th>
                                <th>Variance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBudgets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12">
                                        <div className="empty-state">
                                            <PieChart size={48} />
                                            <p>{loading ? 'Loading...' : 'No budgets found'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                    {filteredBudgets.map((budget) => {
                                        const variance = budget.variance || 0;
                                        const percentage = budget.variancePercentage || 0;
                                        return (
                                            <tr key={budget.id}>
                                                <td className="font-medium">
                                                    <div>{budget.department?.departmentName || '-'}</div>
                                                    <div className="text-[10px] text-text-secondary uppercase tracking-tight">
                                                        {budget.account ? `${budget.account.accountCode} - ${budget.account.accountName}` : budget.category}
                                                    </div>
                                                </td>
                                                <td>{budget.fiscalYear}</td>
                                                <td className="font-semibold text-text-primary">K {parseFloat(budget.budgetedAmount || 0).toLocaleString()}</td>
                                                <td className="font-semibold text-rose-400">
                                                    K {parseFloat(budget.actualAmount || 0).toLocaleString()}
                                                </td>
                                                <td>
                                                    <div className={`font-black tracking-tight ${variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {variance >= 0 ? '+' : ''}K {parseFloat(variance).toLocaleString()}
                                                        <span className="text-[10px] ml-1 opacity-60">({percentage}%)</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={getStatusBadge(budget.status)}>
                                                        {budget.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => navigate(`/app/budgets/${budget.id}/edit`)}
                                                            className="btn btn-sm btn-ghost hover:bg-white/5"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(budget.id)}
                                                            className="btn btn-sm btn-ghost text-rose-400 hover:bg-rose-400/10"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Budgets;
