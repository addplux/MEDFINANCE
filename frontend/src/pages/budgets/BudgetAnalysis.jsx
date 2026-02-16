import React, { useState } from 'react';
import { budgetAPI } from '../../services/apiService'; // Assuming we'd add it to API
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

const BudgetAnalysis = () => {
    const [year, setYear] = useState(new Date().getFullYear());

    // Mock data for analysis
    const data = [
        { department: 'Pharmacy', budget: 500000, actual: 480000, variance: 20000, percentage: 96 },
        { department: 'Laboratory', budget: 300000, actual: 320000, variance: -20000, percentage: 106.6 },
        { department: 'Radiology', budget: 250000, actual: 210000, variance: 40000, percentage: 84 },
        { department: 'Administration', budget: 150000, actual: 145000, variance: 5000, percentage: 96.6 },
        { department: 'Nursing', budget: 400000, actual: 405000, variance: -5000, percentage: 101.2 }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Budget vs Actual Analysis</h1>
                    <p className="text-text-secondary">Performance tracking for {year}</p>
                </div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    <button className="px-3 py-1 text-sm font-medium bg-gray-100 rounded">Monthly</button>
                    <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded">Quarterly</button>
                    <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded">Annual</button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <div className="text-secondary text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Total Budget
                    </div>
                    <div className="text-3xl font-bold mt-2">K{(1600000).toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">Approved Annual Budget</div>
                </div>
                <div className="card p-6">
                    <div className="text-secondary text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Total Actual
                    </div>
                    <div className="text-3xl font-bold mt-2 text-primary-600">K{(1560000).toLocaleString()}</div>
                    <div className="text-sm text-green-600 mt-1">97.5% utilization</div>
                </div>
                <div className="card p-6">
                    <div className="text-secondary text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Variance
                    </div>
                    <div className="text-3xl font-bold mt-2 text-green-600">K{(40000).toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">Under Budget (Favorable)</div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-bg-tertiary">
                        <tr>
                            <th className="text-left p-4 font-medium">Department</th>
                            <th className="text-right p-4 font-medium">Budget (K)</th>
                            <th className="text-right p-4 font-medium">Actual (K)</th>
                            <th className="text-right p-4 font-medium">Variance (K)</th>
                            <th className="text-right p-4 font-medium">% Used</th>
                            <th className="p-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-bg-tertiary/50">
                                <td className="p-4 font-medium">{row.department}</td>
                                <td className="p-4 text-right">{row.budget.toLocaleString()}</td>
                                <td className="p-4 text-right">{row.actual.toLocaleString()}</td>
                                <td className={`p-4 text-right font-medium ${row.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {row.variance.toLocaleString()}
                                </td>
                                <td className="p-4 text-right">{row.percentage.toFixed(1)}%</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${row.percentage > 100
                                            ? 'bg-red-100 text-red-700'
                                            : row.percentage > 90
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-green-100 text-green-700'
                                        }`}>
                                        {row.percentage > 100 ? 'Over Budget' : row.percentage > 90 ? 'Near Limit' : 'On Track'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BudgetAnalysis;
