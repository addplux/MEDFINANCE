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
            setBudgets(response.data);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Department Budgets</h1>
                    <p className="text-gray-600 mt-1">Manage departmental budgets and track variance</p>
                </div>
                <button
                    onClick={() => navigate('/app/budgets/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Budget
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search budgets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pl-11"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={loadBudgets} className="btn btn-secondary">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Budgets Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
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
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        {loading ? 'Loading...' : 'No budgets found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredBudgets.map((budget) => {
                                    const { variance, percentage } = calculateVariance(budget);
                                    return (
                                        <tr key={budget.id}>
                                            <td className="font-medium">{budget.department?.departmentName}</td>
                                            <td>{budget.fiscalYear}</td>
                                            <td className="font-semibold">K {budget.budgetAmount?.toLocaleString()}</td>
                                            <td className="font-semibold text-orange-600">
                                                K {budget.actualSpent?.toLocaleString() || '0.00'}
                                            </td>
                                            <td>
                                                <div className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    K {variance.toLocaleString()}
                                                    <span className="text-sm ml-1">({percentage}%)</span>
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
                                                        onClick={() => navigate(`/app/budgets/${budget.id}`)}
                                                        className="btn btn-sm btn-secondary"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/app/budgets/${budget.id}/edit`)}
                                                        className="btn btn-sm btn-secondary"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(budget.id)}
                                                        className="btn btn-sm btn-danger"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Budgets;
