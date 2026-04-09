import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/apiService';
import { BarChart3, Download, Calendar, List, Printer, User, CreditCard, Clock } from 'lucide-react';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [lineListing, setLineListing] = useState([]);

    const tabs = [
        { id: 'revenue', label: 'Revenue Report', icon: BarChart3 },
        { id: 'line-listing', label: 'Patient Line List', icon: List },
        { id: 'cashflow', label: 'Cashflow Analysis', icon: BarChart3 },
        { id: 'profitability', label: 'Department Profitability', icon: BarChart3 },
        { id: 'billing', label: 'Billing Summary', icon: BarChart3 },
        { id: 'performance', label: 'Cashier Performance', icon: BarChart3 }
    ];

    useEffect(() => {
        loadReport();
    }, [activeTab, dateRange]);

    const loadReport = async () => {
        try {
            setLoading(true);
            let response;

            switch (activeTab) {
                case 'revenue':
                    response = await reportsAPI.revenue(dateRange);
                    break;
                case 'cashflow':
                    response = await reportsAPI.cashflow(dateRange);
                    break;
                case 'profitability':
                    response = await reportsAPI.profitability(dateRange);
                    break;
                case 'billing':
                    response = await reportsAPI.billingSummary(dateRange);
                    break;
                case 'line-listing':
                    response = await reportsAPI.lineListing(dateRange);
                    setLineListing(response?.data?.data || []);
                    break;
                default:
                    break;
            }

            setReportData(response?.data);
        } catch (error) {
            console.error('Failed to load report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = dateRange;
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export-patients?startDate=${startDate}&endDate=${endDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Patient_Report_${startDate}_to_${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Excel export error:', error);
            alert('Failed to export Excel report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 print:m-0 print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                    <p className="text-white/40 mt-1 font-medium">Financial insights and clinical activity logs</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="btn bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Print Report
                    </button>
                    <button onClick={handleExportExcel} disabled={loading} className="btn btn-primary shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        {loading ? 'Exporting...' : 'Export Excel'}
                    </button>
                </div>
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">MEDFINANCE360</h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-black/60">System Generated Report</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black uppercase text-black/40">Report Period</p>
                        <p className="text-sm font-bold">{new Date(dateRange.startDate).toLocaleDateString()} — {new Date(dateRange.endDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="card p-6 border-white/5 print:hidden">
                <div className="flex items-center gap-6">
                    <div className="p-3 rounded-2xl bg-blue-500/10 shrink-0">
                        <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-6 flex-1">
                        <div className="space-y-1.5 flex-1">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="form-input w-full bg-white/[0.02] border-white/10"
                            />
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="form-input w-full bg-white/[0.02] border-white/10"
                            />
                        </div>
                        <button 
                            onClick={loadReport} 
                            disabled={loading}
                            className="bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-3 rounded-xl border border-white/10 transition-all self-end"
                        >
                            {loading ? 'Processing...' : 'Generate report'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="card border-white/5 overflow-hidden">
                <div className="border-b border-white/5 print:hidden">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-8 py-5 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-white/30 hover:text-white/60'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_-4px_12px_rgba(59,130,246,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-8 print:p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Aggregating Data...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Revenue Report */}
                            {activeTab === 'revenue' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="card p-8 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                                                <BarChart3 className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-blue-400/60 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">Active</span>
                                        </div>
                                        <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Total Revenue</p>
                                        <div className="text-4xl font-black text-white tracking-tighter">
                                            K {parseFloat(reportData?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="card p-8 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                                        <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">OPD Transactions</p>
                                        <div className="text-4xl font-black text-white tracking-tighter">
                                            {reportData?.byBillType?.find(b => b.billType === 'OPD')?.count || 0}
                                        </div>
                                        <p className="text-[10px] font-bold text-emerald-400 mt-2 uppercase">Processed Successfully</p>
                                    </div>
                                    <div className="card p-8 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 text-white">
                                        <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1 font-black">Private/Corporate Ratio</p>
                                        <div className="text-4xl font-black tracking-tighter mt-1">
                                            {reportData?.byPaymentMethod?.length || 0}
                                        </div>
                                        <div className="flex gap-1 mt-3">
                                            {reportData?.byPaymentMethod?.map((m, i) => (
                                                <div key={i} className="h-1 bg-purple-500 rounded-full" style={{ width: `${(m.total / reportData.totalRevenue) * 100}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Line Listing Tab */}
                            {activeTab === 'line-listing' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between print:hidden">
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                            Patient Registry Log
                                            <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/10">{lineListing.length} Records</span>
                                        </h3>
                                    </div>
                                    
                                    <div className="overflow-x-auto ring-1 ring-white/5 rounded-2xl">
                                        <table className="w-full border-collapse text-left text-xs bg-white/[0.01]">
                                            <thead>
                                                <tr className="border-b border-white/10 print:border-black">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30 tracking-widest print:text-black">Patient / Man No.</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30 tracking-widest print:text-black">Reg. Date</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30 tracking-widest print:text-black">Identity (NRC)</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30 tracking-widest print:text-black">Pay Method</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30 tracking-widest print:text-black">Visits</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white/30 tracking-widest text-right print:text-black">Balance (ZK)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 print:divide-black">
                                                {lineListing.map((p) => (
                                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group print:text-black">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-xl bg-white/5 group-hover:bg-blue-500/20 text-white/40 group-hover:text-blue-400 transition-colors print:hidden">
                                                                    <User className="w-3.5 h-3.5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-white group-hover:text-blue-400 transition-colors print:text-black uppercase tracking-tight">
                                                                        {p.firstName} {p.lastName}
                                                                    </p>
                                                                    <p className="text-[10px] text-white/30 font-medium print:text-black/60">
                                                                        #{p.patientNumber} {p.manNumber && <span className="text-white/10 mx-1">|</span>} {p.manNumber}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-white/60 print:text-black">
                                                                <Clock className="w-3 h-3 opacity-30 print:hidden" />
                                                                {new Date(p.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-white/60 print:text-black">
                                                                {p.nrc || '—'}
                                                            </div>
                                                            <div className="text-[10px] font-black uppercase text-white/20 print:text-black/40">
                                                                {p.referralType}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <CreditCard className="w-3 h-3 text-purple-400/50 print:hidden" />
                                                                <span className="font-black uppercase text-[10px] text-white/60 print:text-black tracking-widest">
                                                                    {p.paymentMethod.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                                                p.visitCount > 0 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-white/30 border-white/10'
                                                            } print:text-black print:border-black`}>
                                                                {p.visitCount} visits
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`font-black text-sm tracking-tighter ${
                                                                p.balance < 0 ? 'text-red-400' : 'text-white'
                                                            } print:text-black`}>
                                                                K {parseFloat(p.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {lineListing.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="py-20 text-center">
                                                            <div className="space-y-2">
                                                                <List className="w-8 h-8 text-white/10 mx-auto" />
                                                                <p className="text-white/20 font-black uppercase tracking-widest text-[10px]">No records found for period</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Other reports placeholder */}
                            {(activeTab === 'cashflow' || activeTab === 'profitability' || activeTab === 'billing' || activeTab === 'performance') && (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="p-4 rounded-3xl bg-white/5 border border-white/10 mb-4">
                                        <BarChart3 className="w-8 h-8 text-white/10" />
                                    </div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Detailed Analytics Pending</h4>
                                    <p className="text-xs text-white/30 max-w-xs mx-auto">
                                        This module is currently processing departmental data. Please use "Export Excel" for full dataset access.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;

