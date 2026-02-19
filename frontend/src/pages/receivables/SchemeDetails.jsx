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
            setScheme(response.data.scheme);
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
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
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
                                    <h1 className="text-xl font-bold text-gray-900">{scheme.schemeName}</h1>
                                    <p className="text-sm text-gray-500">Scheme Code: {scheme.schemeCode}</p>
                                </>
                            ) : (
                                <div className="animate-pulse h-8 w-48 bg-gray-200 rounded"></div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('statement')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'statement' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Statement
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'members' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Members
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'invoices' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Invoices
                            </div>
                        </button>
                    </div>

                    {/* Actions (Only visible in Statement tab) */}
                    {activeTab === 'statement' && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={dateRange.startDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 p-1"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={dateRange.endDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 p-1"
                                />
                            </div>

                            <button
                                onClick={fetchStatement}
                                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <Calendar className="w-5 h-5" />
                            </button>

                            <div className="h-6 w-px bg-gray-300 mx-1" />

                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-6 pb-12 print:p-0 print:max-w-none">
                {activeTab === 'statement' ? (
                    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 print:shadow-none print:border-none print:p-4" ref={componentRef}>
                        {/* Statement Header */}
                        <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
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

                        {/* Bill Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold">Patient No.</th>
                                        <th className="px-4 py-3 font-semibold">Patient Name</th>
                                        <th className="px-4 py-3 font-semibold">Sex</th>
                                        <th className="px-4 py-3 font-semibold">Service / Description</th>
                                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                        <th className="px-4 py-3 font-semibold text-right">Discount</th>
                                        <th className="px-4 py-3 font-semibold text-right">Net Amount</th>
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
                                <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan="5" className="px-4 py-4 text-right text-gray-700 uppercase tracking-wider text-xs">Grand Total</td>
                                        <td className="px-4 py-4 text-right text-primary-700">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4 text-right text-gray-600">{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4 text-right text-primary-700 text-base">{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Footer / Signature Area */}
                        <div className="mt-12 flex justify-between items-end pt-8 border-t border-gray-100 print:flex hidden">
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
                }
            `}</style>
        </div>
    );
};

export default SchemeDetails;
