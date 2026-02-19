import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, Download } from 'lucide-react';
import api from '../../services/apiClient';

const FamilyLedger = () => {
    const { policyNumber } = useParams();
    const navigate = useNavigate();
    const [ledger, setLedger] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchLedger();
    }, [policyNumber, dateRange]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = dateRange;
            const response = await api.get(`/receivables/schemes/ledger/${policyNumber}`, {
                params: { startDate, endDate }
            });
            setLedger(response.data);
        } catch (error) {
            console.error('Error fetching ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    const handlePrint = () => window.print();

    if (loading && !ledger) return <div className="p-8 text-center text-gray-500">Loading ledger...</div>;
    if (!ledger) return <div className="p-8 text-center text-red-500">Ledger not found</div>;

    const { principal, members, transactions, broughtForward, finalBalance } = ledger;

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header (No Print) */}
            <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Family Ledger</h1>
                            <p className="text-sm text-gray-500">Policy #{policyNumber}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable Ledger */}
            <div className="max-w-7xl mx-auto px-6 pb-12 print:p-0 print:max-w-none">
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 print:shadow-none print:border-none print:p-4">

                    {/* Report Header */}
                    <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">FAMILY LEDGER STATEMENT</h2>
                            <p className="text-gray-500 text-sm">Period: {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}</p>
                            <div className="mt-4">
                                <h3 className="font-bold text-lg">{principal?.firstName} {principal?.lastName}</h3>
                                <p className="text-gray-600 text-sm">{principal?.address || 'Address on file'}</p>
                                <p className="text-gray-600 text-sm">Phone: {principal?.phone || '-'}</p>
                                <p className="text-gray-600 text-sm">NRC/ID: {principal?.nrc || '-'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Current Balance</p>
                                <p className={`text-2xl font-bold ${finalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {Number(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    <span className="text-xs ml-1 font-normal text-gray-500">{finalBalance > 0 ? 'DR (Owing)' : 'CR (Credit)'}</span>
                                </p>
                            </div>
                            <div className="mt-4 text-sm text-gray-500">
                                <p>Policy Number: <span className="font-mono font-bold text-gray-900">{policyNumber}</span></p>
                                <p>Members: {members.length}</p>
                                <p>Status: <span className="uppercase font-bold text-primary-600">{principal?.memberStatus || 'ACTIVE'}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-32">Date</th>
                                <th className="px-4 py-3 w-32">Ref No.</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 text-right w-32">Debit (DR)</th>
                                <th className="px-4 py-3 text-right w-32">Credit (CR)</th>
                                <th className="px-4 py-3 text-right w-32">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Brought Forward Row */}
                            {broughtForward !== 0 && (
                                <tr className="bg-gray-50/50 font-medium">
                                    <td className="px-4 py-3 text-gray-500">{dateRange.startDate}</td>
                                    <td className="px-4 py-3 text-gray-400">-</td>
                                    <td className="px-4 py-3 text-gray-700 italic">Balance Brought Forward</td>
                                    <td className="px-4 py-3 text-right">{broughtForward > 0 ? Number(broughtForward).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td className="px-4 py-3 text-right">{broughtForward < 0 ? Number(Math.abs(broughtForward)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">{Number(broughtForward).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}

                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400 italic">No transactions found in this period.</td>
                                </tr>
                            ) : (
                                transactions.map((t, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.date}</td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.ref}</td>
                                        <td className="px-4 py-3 text-gray-800">{t.description}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">{t.debit > 0 ? Number(t.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">{t.credit > 0 ? Number(t.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">{Number(t.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                            <tr>
                                <td colSpan="3" className="px-4 py-4 text-right font-bold text-gray-700 uppercase">Closing Balance</td>
                                <td className="px-4 py-4 text-right font-bold text-red-700">
                                    {transactions.reduce((sum, t) => sum + t.debit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-green-700">
                                    {transactions.reduce((sum, t) => sum + t.credit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-right font-black text-gray-900 text-lg">
                                    {Number(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Authorization / Footer */}
                    <div className="mt-12 flex justify-between items-end pt-8 border-t border-gray-100 print:flex hidden">
                        <div className="text-xs text-gray-400">
                            <p>Printed by: {localStorage.getItem('user_name') || 'Admin'}</p>
                            <p>Date: {new Date().toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print CSS */}
            <style>{`
                @media print {
                    @page { margin: 15mm; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:max-w-none { max-width: none !important; }
                }
            `}</style>
        </div>
    );
};

export default FamilyLedger;
