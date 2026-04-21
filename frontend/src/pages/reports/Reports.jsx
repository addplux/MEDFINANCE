import React, { useState, useEffect } from 'react';
import { reportsAPI, payrollAPI } from '../../services/apiService';
import { BarChart3, Download, Calendar, List, Printer, User, CreditCard, Clock, Receipt, ArrowRight, Wallet, TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import StaffMedicalStatement from './StaffMedicalStatement';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [lineListing, setLineListing] = useState([]);
    const [staffBalances, setStaffBalances] = useState([]);
    const [selectedStaffForStatement, setSelectedStaffForStatement] = useState(null);

    const tabs = [
        { id: 'revenue', label: 'Revenue Report', icon: BarChart3 },
        { id: 'line-listing', label: 'Patient Line List', icon: List },
        { id: 'cashflow', label: 'Cashflow Analysis', icon: BarChart3 },
        { id: 'profitability', label: 'Department Profitability', icon: BarChart3 },
        { id: 'billing', label: 'Billing Summary', icon: BarChart3 },
        { id: 'staff-billing', label: 'Staff Medical Bills', icon: Wallet },
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
                    // Backend returns { count, data: [] }, Axios wraps it in response.data
                    // So the patients array is at response.data.data
                    const listData = response?.data?.data ?? response?.data ?? [];
                    setLineListing(Array.isArray(listData) ? listData : []);
                    break;
                case 'staff-billing':
                    response = await payrollAPI.getStaffBalances();
                    setStaffBalances(response.data || []);
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
                        {tabs.map(({ icon: Icon, label, id }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2.5 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap group ${activeTab === id
                                    ? 'text-white bg-white/[0.02]'
                                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.01]'
                                    }`}
                            >
                                <Icon className={`w-3.5 h-3.5 transition-colors ${activeTab === id ? 'text-blue-400' : 'text-white/20 group-hover:text-white/40'}`} />
                                {label}
                                {activeTab === id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_-4px_16px_rgba(59,130,246,0.8)]" />
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
                                            {reportData?.byBillType?.find(b => (b.billType || '').toUpperCase() === 'OPD')?.count || 0}
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

                            {/* Cash Flow Report */}
                            {activeTab === 'cashflow' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="card p-8 bg-emerald-500/5 border-emerald-500/20">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                                                    <TrendingUp className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-emerald-400/60 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Inflow</span>
                                            </div>
                                            <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Total Cash Inflow</p>
                                            <div className="text-4xl font-black text-white tracking-tighter">
                                                K {parseFloat(reportData?.cashInflows || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <p className="text-[9px] font-bold text-emerald-400/60 mt-3 uppercase tracking-tighter">Total payments received within period</p>
                                        </div>

                                        <div className="card p-8 bg-red-500/5 border-red-500/20 opacity-60">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
                                                    <TrendingDown className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-red-400/60 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">Outflow</span>
                                            </div>
                                            <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Total Cash Outflow</p>
                                            <div className="text-4xl font-black text-white tracking-tighter">
                                                K {parseFloat(reportData?.cashOutflows || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <p className="text-[9px] font-bold text-red-400/60 mt-3 uppercase tracking-tighter italic">Expenditure integration pending</p>
                                        </div>

                                        <div className="card p-8 bg-blue-500/5 border-blue-500/20">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-blue-400/60 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">Net</span>
                                            </div>
                                            <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Net Cashflow</p>
                                            <div className="text-4xl font-black text-white tracking-tighter">
                                                K {parseFloat(reportData?.netCashflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <p className="text-[9px] font-bold text-blue-400/60 mt-3 uppercase tracking-tighter italic">Liquidity index for period</p>
                                        </div>
                                    </div>
                                    
                                    <div className="card p-8 bg-white/[0.02] border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-white/5">
                                                <FileText className="w-6 h-6 text-white/40" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-wider">Analysis Summary</h4>
                                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Calculated from system-wide transaction logs</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/40 max-w-sm text-right leading-relaxed italic">
                                            The current cash flow analysis reflects all point-of-sale collections. 
                                            Supplier payments and administrative expenditures will be automatically subtracted once the Finance Payables module is reconciled.
                                        </p>
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

                            {/* Staff Billing Tab */}
                            {activeTab === 'staff-billing' && (
                                <>
                                    {selectedStaffForStatement ? (
                                        <StaffMedicalStatement 
                                            staffId={selectedStaffForStatement.staffId}
                                            period={new Date().toISOString().slice(0, 7)} // Default to current month
                                            onBack={() => setSelectedStaffForStatement(null)}
                                        />
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                    Staff Medical Balances (Pending Deduction)
                                                    <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/10">{staffBalances.length} Staff Members</span>
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {staffBalances.map((item) => (
                                                    <div key={item.staffId} className="card p-6 bg-white/[0.01] hover:bg-white/5 transition-all group border-white/5 cursor-pointer" onClick={() => setSelectedStaffForStatement(item)}>
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="p-3 rounded-2xl bg-accent/20 text-accent group-hover:scale-110 transition-transform">
                                                                <User size={24} />
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">Pending Debt</p>
                                                                <p className="text-2xl font-black text-white tracking-tighter">ZK {Number(item.totalDebt).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mb-6">
                                                            <h4 className="text-base font-black text-white uppercase tracking-tight">{item.staff?.firstName} {item.staff?.lastName}</h4>
                                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{item.staff?.role || 'Staff Member'}</p>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                                <Receipt size={14} className="opacity-50" />
                                                                {item.pendingCount} Bill Items
                                                            </div>
                                                            <button 
                                                                className="text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                Generate slip <ArrowRight size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {staffBalances.length === 0 && (
                                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                                        <Wallet className="w-10 h-10 text-white/10 mx-auto mb-4" />
                                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">No Medical Debts</h4>
                                                        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">All staff medical accounts are currently clear.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Department Profitability Tab */}
                            {activeTab === 'profitability' && reportData?.departments && (
                                <div className="space-y-8">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="card p-6 bg-white/[0.02] border-white/5">
                                            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Total Budget</p>
                                            <p className="text-2xl font-black text-white">ZK {Number(reportData.summary.totalBudget).toLocaleString()}</p>
                                        </div>
                                        <div className="card p-6 bg-white/[0.02] border-white/5">
                                            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Actual Spent</p>
                                            <p className="text-2xl font-black text-white">ZK {Number(reportData.summary.totalSpent).toLocaleString()}</p>
                                        </div>
                                        <div className="card p-6 bg-emerald-500/5 border-emerald-500/10">
                                            <p className="text-[10px] font-black uppercase text-emerald-400/60 tracking-widest mb-1">Total Revenue</p>
                                            <p className="text-2xl font-black text-emerald-400">ZK {Number(reportData.summary.totalRevenue).toLocaleString()}</p>
                                        </div>
                                        <div className={`card p-6 border-white/5 ${reportData.summary.totalProfit >= 0 ? 'bg-blue-500/5 border-blue-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Net Profit/Loss</p>
                                            <p className={`text-2xl font-black ${reportData.summary.totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                ZK {Number(reportData.summary.totalProfit).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chart section */}
                                    <div className="card p-8 bg-white/[0.01] border-white/5">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8">Financial Performance by Department</h3>
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={reportData.departments} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis 
                                                        dataKey="departmentName" 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                                                        interval={0}
                                                    />
                                                    <YAxis 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                                                    />
                                                    <Tooltip 
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                                                    <Bar name="Budget" dataKey="budget" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                                                    <Bar name="Actual Expenditure" dataKey="actualSpent" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} />
                                                    <Bar name="Generated Revenue" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Table section */}
                                    <div className="overflow-x-auto ring-1 ring-white/5 rounded-2xl">
                                        <table className="w-full border-collapse text-left text-[11px] bg-white/[0.01]">
                                            <thead>
                                                <tr className="border-b border-white/10 uppercase tracking-widest font-black text-white/30">
                                                    <th className="px-6 py-4">Department</th>
                                                    <th className="px-6 py-4">Budget (ZK)</th>
                                                    <th className="px-6 py-4">Spent (ZK)</th>
                                                    <th className="px-6 py-4">Revenue (ZK)</th>
                                                    <th className="px-6 py-4">Variance</th>
                                                    <th className="px-6 py-4 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {reportData.departments.map((dept, i) => {
                                                    const variance = dept.budget - dept.actualSpent;
                                                    const variancePercent = dept.budget > 0 ? (variance / dept.budget) * 100 : 0;
                                                    
                                                    return (
                                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <p className="font-black text-white uppercase">{dept.departmentName}</p>
                                                                <p className="text-[9px] text-white/20 font-bold tracking-widest">{dept.departmentCode}</p>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-white/60">
                                                                {Number(dept.budget).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-red-400/80">
                                                                {Number(dept.actualSpent).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-emerald-400">
                                                                {Number(dept.revenue).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden w-20">
                                                                        <div 
                                                                            className={`h-full ${variance >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                                                            style={{ width: `${Math.min(Math.abs(variancePercent), 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`font-bold ${variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        {variance >= 0 ? '+' : ''}{Number(variance).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {dept.profit >= 0 ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                                        <CheckCircle2 size={10} /> Surplus
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                                                                        <AlertCircle size={10} /> Deficit
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Billing Summary Tab */}
                            {activeTab === 'billing' && reportData?.summary && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                        {Object.entries(reportData.summary).map(([key, data]) => (
                                            <div key={key} className="card p-6 bg-white/[0.02] border-white/5 group hover:bg-white/[0.04] transition-all">
                                                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">{key} Services</p>
                                                <p className="text-2xl font-black text-white tracking-tighter">ZK {Number(data.total).toLocaleString()}</p>
                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{data.count} Bills</span>
                                                    <Receipt size={12} className="text-white/10 group-hover:text-blue-400 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="card p-10 bg-gradient-to-br from-blue-600/10 to-transparent border-white/5 flex flex-col items-center justify-center text-center">
                                        <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-2">Aggregate Billing Volume</p>
                                        <h2 className="text-6xl font-black text-white tracking-tighter">ZK {Number(reportData.grandTotal).toLocaleString()}</h2>
                                        <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest mt-4 flex items-center gap-2">
                                            <CheckCircle2 size={12} /> Reconciled with global transaction logs
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Performance Tab */}
                            {activeTab === 'performance' && reportData?.performance && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {reportData.performance.map((p, i) => (
                                            <div key={i} className="card p-6 bg-white/[0.02] border-white/5 flex flex-col">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                                                        {p.cashierName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-white uppercase tracking-tight">{p.cashierName}</h4>
                                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">@{p.username}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Total Collected</p>
                                                            <p className="text-xl font-black text-white">ZK {Number(p.totalCollected).toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Volume</p>
                                                            <p className="text-lg font-black text-white/60">{p.transactionCount} Tx</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                                            style={{ width: `${Math.min((p.totalCollected / reportData.performance.reduce((max, curr) => Math.max(max, curr.totalCollected), 1)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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

