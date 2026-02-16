import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/apiService';
import { BarChart3, Download, Calendar } from 'lucide-react';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);

    const tabs = [
        { id: 'revenue', label: 'Revenue Report', icon: BarChart3 },
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

    const handleExport = () => {
        alert('Export functionality will be implemented in Phase 11');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-1">Financial reports and business intelligence</p>
                </div>
                <button onClick={handleExport} className="btn btn-primary">
                    <Download className="w-5 h-5" />
                    Export PDF
                </button>
            </div>

            {/* Date Range Filter */}
            <div className="card p-4">
                <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div className="flex items-center gap-4 flex-1">
                        <div className="form-group mb-0">
                            <label className="form-label text-sm">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label text-sm">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <button onClick={loadReport} className="btn btn-secondary mt-6">
                            Generate
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="card">
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">
                            Loading report data...
                        </div>
                    ) : reportData ? (
                        <div className="space-y-6">
                            {/* Revenue Report */}
                            {activeTab === 'revenue' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="card bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                                        <div className="text-sm text-blue-600 font-medium">Total Revenue</div>
                                        <div className="text-3xl font-bold text-blue-900 mt-2">
                                            K {reportData.totalRevenue?.toLocaleString() || '0.00'}
                                        </div>
                                    </div>
                                    <div className="card bg-gradient-to-br from-green-50 to-green-100 p-6">
                                        <div className="text-sm text-green-600 font-medium">OPD Revenue</div>
                                        <div className="text-3xl font-bold text-green-900 mt-2">
                                            K {reportData.opdRevenue?.toLocaleString() || '0.00'}
                                        </div>
                                    </div>
                                    <div className="card bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                                        <div className="text-sm text-purple-600 font-medium">IPD Revenue</div>
                                        <div className="text-3xl font-bold text-purple-900 mt-2">
                                            K {reportData.ipdRevenue?.toLocaleString() || '0.00'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cashflow Report */}
                            {activeTab === 'cashflow' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="card bg-gradient-to-br from-green-50 to-green-100 p-6">
                                        <div className="text-sm text-green-600 font-medium">Total Inflow</div>
                                        <div className="text-3xl font-bold text-green-900 mt-2">
                                            K {reportData.totalInflow?.toLocaleString() || '0.00'}
                                        </div>
                                    </div>
                                    <div className="card bg-gradient-to-br from-red-50 to-red-100 p-6">
                                        <div className="text-sm text-red-600 font-medium">Total Outflow</div>
                                        <div className="text-3xl font-bold text-red-900 mt-2">
                                            K {reportData.totalOutflow?.toLocaleString() || '0.00'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Other reports placeholder */}
                            {(activeTab === 'profitability' || activeTab === 'billing' || activeTab === 'performance') && (
                                <div className="text-center py-12 text-gray-500">
                                    Report data will be displayed here
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            Select date range and click Generate to view report
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
