import React, { useState, useEffect } from 'react';
import { budgetAPI } from '../../services/apiService';
import { BarChart3, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

const BudgetAnalysis = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalysis();
    }, [year]);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            const response = await budgetAPI.analyze({ fiscalYear: year });
            setData(response.data);
        } catch (error) {
            console.error('Failed to load budget analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <RefreshCw className="animate-spin text-accent" />
                <p className="text-text-secondary uppercase text-[10px] font-black tracking-widest">Analyzing Fiscal Performance...</p>
            </div>
        );
    }

    const { summary, departments } = data;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Budget vs Actual Analysis</h1>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">Performance tracking for Fiscal Year {year}</p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-white/10">
                    <div className="text-text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        Total Budget
                    </div>
                    <div className="text-3xl font-black mt-2 text-white">K{(summary.totalBudget || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-text-secondary font-bold mt-1 uppercase">Approved Annual Allocation</div>
                </div>
                <div className="glass-card p-6 border-white/10">
                    <div className="text-text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Total Actual
                    </div>
                    <div className="text-3xl font-black mt-2 text-white">K{(summary.totalActual || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">
                        {summary.totalBudget > 0 ? ((summary.totalActual / summary.totalBudget) * 100).toFixed(1) : 0}% utilization
                    </div>
                </div>
                <div className="glass-card p-6 border-white/10">
                    <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${summary.totalVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <AlertCircle className="w-4 h-4" />
                        Net Variance
                    </div>
                    <div className="text-3xl font-black mt-2 text-white">K{Math.abs(summary.totalVariance || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-text-secondary font-bold mt-1 uppercase">
                        {summary.totalVariance >= 0 ? 'Under Budget (Favorable)' : 'Over Budget (Adverse)'}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="glass-card overflow-hidden border-white/10">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Department / Account</th>
                            <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Budget (K)</th>
                            <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Actual (K)</th>
                            <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Variance (K)</th>
                            <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">% Used</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {departments.map((row, i) => {
                            const used = row.budgetedAmount > 0 ? (row.actualAmount / row.budgetedAmount) * 100 : 0;
                            return (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white uppercase text-sm">{row.departmentName}</div>
                                        <div className="text-[10px] text-text-secondary uppercase tracking-tighter">{row.accountName}</div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-white">{(row.budgetedAmount || 0).toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-rose-400">{(row.actualAmount || 0).toLocaleString()}</td>
                                    <td className={`p-4 text-right font-black ${row.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {row.variance >= 0 ? '+' : '-'}{(Math.abs(row.variance) || 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right font-black text-white/60">{used.toFixed(1)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BudgetAnalysis;
