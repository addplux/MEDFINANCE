import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, FileText, Download, Users } from 'lucide-react';
import api from '../../services/apiClient';
import SchemeMembers from './SchemeMembers';
import SchemeInvoices from './SchemeInvoices';

const SchemeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [scheme, setScheme] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('statement');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
        endDate: new Date().toISOString().split('T')[0] // Today
    });

    const componentRef = useRef();

    useEffect(() => {
        fetchStatement();
    }, [id, dateRange]); // Refetch when date range changes, though only needed for statement tab

    const fetchStatement = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = dateRange;
            const response = await api.get(`/receivables/schemes/${id}/statement`, {
                params: { startDate, endDate }
            });
            setScheme({
                ...response.data.scheme,
                openingBalances: response.data.openingBalances
            });
            setBills(response.data.bills);
        } catch (error) {
            console.error('Error fetching scheme statement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals
    const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.totalAmount), 0);
    const totalDiscount = bills.reduce((sum, bill) => sum + Number(bill.discount), 0);
    const netAmount = bills.reduce((sum, bill) => sum + Number(bill.netAmount), 0);

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    if (loading && !scheme && activeTab === 'statement') {
        return <div className="p-8 text-center text-gray-500">Loading scheme details...</div>;
    }

    if (!scheme && !loading) {
        return <div className="p-8 text-center text-red-500">Scheme not found</div>;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50/50 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 print:hidden bg-white border-b border-gray-200 px-4 md:px-6 py-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/app/receivables/schemes')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            {scheme ? (
                                <>
                                    <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">{scheme.schemeName}</h1>
                                    <p className="text-sm text-gray-500 font-medium">Scheme Code: {scheme.schemeCode}</p>
                                </>
                            ) : (
                                <div className="animate-pulse h-8 w-48 bg-gray-200 rounded"></div>
                            )}
                        </div>
                    </div>

                    {/* Tabs (Suno Style - Text with Underline) */}
                    <div className="flex gap-6 border-b border-transparent">
                        <button
                            onClick={() => setActiveTab('statement')}
                            className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'statement' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            Statement
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'members' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            Members
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'invoices' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            Invoices
                        </button>
                    </div>

                    {/* Actions (Only visible in Statement tab) */}
                    {activeTab === 'statement' && (
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Date Picker Pill */}
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={dateRange.startDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none text-xs font-medium focus:ring-0 text-gray-700 p-0 w-24"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={dateRange.endDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none text-xs font-medium focus:ring-0 text-gray-700 p-0 w-24"
                                />

                                <div className="h-4 w-px bg-gray-300 mx-2" />

                                <button
                                    onClick={fetchStatement}
                                    className="text-gray-500 hover:text-gray-900 transition-colors"
                                    title="Refresh"
                                >
                                    <Calendar className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Print Button (Pill Style) */}
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-full text-xs font-bold transition-colors shadow-sm"
                                title="Print Statement"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 px-4 md:px-6 pb-6 print:p-0 overflow-hidden">

                {/* Opening Balances Summary (If available) - Fixed at top of content if present */}
                <div className="flex-shrink-0">
                    {scheme && scheme.openingBalances && scheme.openingBalances.total > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:hidden">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Opening Balance Breakdown</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {Object.entries(scheme.openingBalances).map(([key, value]) => (
                                    key !== 'total' && value > 0 && (
                                        <div key={key} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                            <p className="text-lg font-bold text-gray-900">{Number(value).toLocaleString()}</p>
                                        </div>
                                    )
                                ))}
                                <div className="bg-primary-50 p-3 rounded-md border border-primary-100 col-span-2 md:col-span-1">
                                    <p className="text-xs text-primary-600 uppercase font-semibold">Total Balance</p>
                                    <p className="text-xl font-bold text-primary-700">{Number(scheme.openingBalances.total).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'statement' ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden print:shadow-none print:border-none print:p-4" ref={componentRef}>

                        {/* Statement Header - Fixed */}
                        <div className="flex-shrink-0 flex justify-between items-start p-8 pb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">SCHEME BILLING STATEMENT</h2>
                                <p className="text-gray-500 text-sm">Statement Period: {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}</p>
                            </div>
                            {scheme && (
                                <div className="text-right">
                                    <h3 className="text-lg font-bold text-primary-700">{scheme.schemeName}</h3>
                                    <p className="text-gray-600 text-sm">Code: {scheme.schemeCode}</p>
                                    <p className="text-gray-600 text-sm capitalize">{scheme.schemeType} Scheme</p>
                                    {scheme.contactPerson && <p className="text-gray-500 text-xs mt-1">Attn: {scheme.contactPerson}</p>}
                                </div>
                            )}
                        </div>

                        {/* Bill Table - Scrollable */}
                        <div className="flex-1 overflow-auto p-8 pt-0">
                            <table className="w-full text-sm text-left relative">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-200 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold bg-gray-50">Date</th>
                                        <th className="px-4 py-3 font-semibold bg-gray-50">Patient No.</th>
                                        <th className="px-4 py-3 font-semibold bg-gray-50">Patient Name</th>
                                        <th className="px-4 py-3 font-semibold bg-gray-50">Sex</th>
                                        <th className="px-4 py-3 font-semibold bg-gray-50">Service / Description</th>
                                        <th className="px-4 py-3 font-semibold text-right bg-gray-50">Amount</th>
                                        <th className="px-4 py-3 font-semibold text-right bg-gray-50">Discount</th>
                                        <th className="px-4 py-3 font-semibold text-right bg-gray-50">Net Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bills.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic">
                                                No bills found for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        bills.map((bill) => (
                                            <tr key={bill.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{bill.billDate}</td>
                                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{bill.patient?.patientNumber}</td>
                                                <td className="px-4 py-3 text-gray-900 font-medium">
                                                    {bill.patient?.firstName} {bill.patient?.lastName}
                                                    <div className="text-[10px] text-gray-400 sm:hidden">{bill.patient?.nhimaNumber}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 capitalize">{bill.patient?.gender}</td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {bill.service?.serviceName || 'General Service'}
                                                    {bill.notes && <span className="text-xs text-gray-400 block truncate max-w-[200px]">{bill.notes}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-600">{Number(bill.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 text-right text-gray-500">{Number(bill.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">{Number(bill.netAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                    <tr>
                                        <td colSpan="5" className="px-4 py-4 text-right text-gray-700 uppercase tracking-wider text-xs">Grand Total</td>
                                        <td className="px-4 py-4 text-right text-primary-700 bg-gray-50">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4 text-right text-gray-600 bg-gray-50">{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4 text-right text-primary-700 text-base bg-gray-50">{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Footer / Signature Area - Fixed at bottom of card */}
                        <div className="flex-shrink-0 mt-auto p-8 pt-4 flex justify-between items-end border-t border-gray-100 print:flex hidden">
                            <div className="text-xs text-gray-400">
                                <p>Generated on {new Date().toLocaleString()}</p>
                                <p>MEDFINANCE360 v1.0</p>
                            </div>
                            <div className="text-center">
                                <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'members' ? (
                    <SchemeMembers schemeId={id} />
                ) : (
                    <SchemeInvoices schemeId={id} />
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 15mm; size: landscape; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:flex { display: flex !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    /* Restore overflow for print */
                    .overflow-x-auto, .overflow-y-auto, .overflow-hidden, .h-screen { 
                        overflow: visible !important; 
                        height: auto !important; 
                    }
                }
            `}</style>
        </div>
    );
};

export default SchemeDetails;
