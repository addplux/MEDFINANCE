import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/apiService';
import { Download, Filter, TrendingUp, Calendar, ArrowUpRight, Building2, User2 } from 'lucide-react';

const DebtorAgeing = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [filter, setFilter] = useState('all'); // all, corporate, scheme

    useEffect(() => {
        fetchReport();
    }, [filter]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.debtorAgeing({ type: filter });
            setReportData(response.data || []);
        } catch (error) {
            console.error('Failed to fetch debtor ageing:', error);
            // Fallback mock data for demo if API fails
            setReportData([
                { id: 1, name: 'Copperbelt Energy Corp', type: 'Corporate', current: 5000, days30: 2000, days60: 0, days90: 0, total: 7000 },
                { id: 2, name: 'Mopani Copper Mines', type: 'Corporate', current: 12000, days30: 5000, days60: 2000, days90: 1000, total: 20000 },
                { id: 3, name: 'Madison Insurance', type: 'Scheme', current: 1500, days30: 0, days60: 0, days90: 0, total: 1500 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getTotal = (field) => {
        return reportData.reduce((sum, item) => sum + (item[field] || 0), 0);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Debtor Ageing</h1>
                    <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        Analysis of outstanding receivables
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 group">
                        <Download className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Quick Filters Pill */}
            <div className="flex flex-wrap items-center gap-3 bg-black/40 p-2 rounded-full border border-white/5 w-fit backdrop-blur-sm self-start">
                {['all', 'corporate', 'scheme'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                            ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,0,204,0.3)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Main Content Table Card */}
            <div className="bg-black/40 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.03] text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-8">Debtor Identity</th>
                                <th className="p-8">Classification</th>
                                <th className="p-8 text-right">Current</th>
                                <th className="p-8 text-right">30 Days</th>
                                <th className="p-8 text-right">60 Days</th>
                                <th className="p-8 text-right">90+ Days</th>
                                <th className="p-8 text-right bg-white/[0.02]">Total Due</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-white/70">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Analyzing Receivables...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Calendar className="w-12 h-12 text-white/10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No debtors found for the selected filter</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : reportData.map((item) => (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5 group">
                                    <td className="p-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                {item.type === 'Corporate' ? <Building2 className="w-5 h-5 text-white/40 group-hover:text-primary" /> : <User2 className="w-5 h-5 text-white/40 group-hover:text-primary" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-white uppercase tracking-tight">{item.name}</p>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">ID: {item.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.type === 'Corporate' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-8 text-right tabular-nums text-white/60">K{item.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums text-white/60">K{item.days30.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums text-white/60">K{item.days60.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums text-primary font-black">K{item.days90.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums font-black text-white bg-white/[0.02]">
                                        <div className="flex items-center justify-end gap-2 text-lg">
                                            K{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {!loading && reportData.length > 0 && (
                            <tfoot className="bg-white/[0.05] font-black text-white">
                                <tr>
                                    <td className="p-8 uppercase tracking-[0.2em] text-[10px]" colSpan="2">Consolidated Assessment</td>
                                    <td className="p-8 text-right tabular-nums">K{getTotal('current').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums">K{getTotal('days30').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums">K{getTotal('days60').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums text-primary">K{getTotal('days90').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-8 text-right tabular-nums text-xl bg-white/5 border-l border-white/10">K{getTotal('total').toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Visual Legends */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Healthy Credit</p>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-black text-white">K{(getTotal('current') + getTotal('days30')).toLocaleString()}</p>
                        <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">+ Current & 30D</span>
                    </div>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Risk Exposure</p>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-black text-white">K{(getTotal('days60')).toLocaleString()}</p>
                        <span className="text-highlight text-[10px] font-black uppercase tracking-widest">! 60 Days overdue</span>
                    </div>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-primary/10 border border-primary/20">
                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] mb-4">Critical Debt</p>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-black text-white">K{(getTotal('days90')).toLocaleString()}</p>
                        <span className="text-primary text-[10px] font-black uppercase tracking-widest">⚠️ 90+ Days overdue</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebtorAgeing;
