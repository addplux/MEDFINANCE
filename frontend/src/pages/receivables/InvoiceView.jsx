import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Mail, CheckCircle } from 'lucide-react';
import api from '../../services/apiClient';

const InvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef();

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/receivables/schemes/invoices/${id}`);
            setInvoiceData(response.data);
        } catch (error) {
            console.error('Error fetching invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    if (loading) return <div className="p-8 text-center text-gray-500">Loading invoice...</div>;
    if (!invoiceData) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

    const { invoice, rows, totals } = invoiceData;
    const { scheme } = invoice;

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header (No Print) */}
            <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 mb-6">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
                            <p className="text-sm text-gray-500">{scheme.schemeName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            Print / PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable Invoice */}
            <div className="max-w-7xl mx-auto px-6 pb-12 print:p-0 print:max-w-none">
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 print:shadow-none print:border-none print:p-4" ref={componentRef}>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                        <div className="w-1/2">
                            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Tax Invoice</h2>
                            <p className="text-gray-500 mt-1">Invoice #: <span className="font-mono text-gray-900 font-bold">{invoice.invoiceNumber}</span></p>
                            <p className="text-gray-500">Date: {new Date().toLocaleDateString()}</p>

                            <div className="mt-6">
                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Bill To:</p>
                                <h3 className="text-lg font-bold text-gray-900">{scheme.schemeName}</h3>
                                {scheme.contactPerson && <p className="text-gray-600">Attn: {scheme.contactPerson}</p>}
                                {scheme.email && <p className="text-gray-600">{scheme.email}</p>}
                                {scheme.phone && <p className="text-gray-600">{scheme.phone}</p>}
                            </div>
                        </div>
                        <div className="w-1/2 text-right">
                            {/* Logo Placeholder */}
                            <div className="mb-4">
                                <span className="text-2xl font-black text-primary-600">MEDFINANCE360</span>
                            </div>
                            <p className="font-bold text-gray-900">Medical Services LTD</p>
                            <p className="text-gray-600 text-sm">123 Health Avenue, Lusaka</p>
                            <p className="text-gray-600 text-sm">TPIN: 1001234567</p>
                            <p className="text-gray-600 text-sm">Contact: +260 977 123 456</p>

                            <div className="mt-8 bg-gray-50 p-4 rounded-lg inline-block text-left w-64 border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Total Due</p>
                                <p className="text-3xl font-bold text-primary-700">K {Number(invoice.totalAmount).toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">Due Date: {new Date(invoice.periodEnd).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-sm">Billing Period: {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}</h4>
                    </div>

                    {/* Matrix Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse border border-gray-200">
                            <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
                                <tr>
                                    <th className="px-2 py-2 border border-gray-200 w-24">Date</th>
                                    <th className="px-2 py-2 border border-gray-200">Name</th>
                                    <th className="px-2 py-2 border border-gray-200 w-20">Man No / Policy</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Consult</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Nursing</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Lab</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Rad</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Dental</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Lodge</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Surg</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Round</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Food</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Physio</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Pharm</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Sundry</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-14">Antenet</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-16">Other</th>
                                    <th className="px-1 py-2 border border-gray-200 text-right w-20 bg-gray-50 font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50">
                                        <td className="px-1 py-1.5 border border-gray-200 text-gray-500 whitespace-nowrap">{row.date}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 font-medium text-gray-900 truncate max-w-[100px]">{row.patientName}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 font-mono text-gray-500 text-[10px]">{row.manNumber || row.policyNumber || '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.consultation > 0 ? row.consultation.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.nursingCare > 0 ? row.nursingCare.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.laboratory > 0 ? row.laboratory.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.radiology > 0 ? row.radiology.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.dental > 0 ? row.dental.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.lodging > 0 ? row.lodging.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.surgicals > 0 ? row.surgicals.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.drRound > 0 ? row.drRound.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.food > 0 ? row.food.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.physio > 0 ? row.physio.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.pharmacy > 0 ? row.pharmacy.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.sundries > 0 ? row.sundries.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.antenatal > 0 ? row.antenatal.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right text-gray-700">{row.other > 0 ? row.other.toLocaleString() : '-'}</td>
                                        <td className="px-1 py-1.5 border border-gray-200 text-right font-bold text-gray-900 bg-gray-50/50">{row.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold text-gray-800">
                                <tr>
                                    <td colSpan="3" className="px-2 py-3 border border-gray-200 text-right uppercase">Monthly Totals</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.consultation.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.nursingCare.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.laboratory.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.radiology.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.dental.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.lodging.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.surgicals.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.drRound.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.food.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.physio.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.pharmacy.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.sundries.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.antenatal.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right">{totals.other.toLocaleString()}</td>
                                    <td className="px-1 py-3 border border-gray-200 text-right text-primary-700 text-sm border-l-2 border-l-gray-300">{totals.grandTotal.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer Summary Blocks */}
                    <div className="mt-8 flex justify-end">
                        <div className="w-1/3 min-w-[300px]">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-200">
                                        <td className="py-2 text-gray-600">Consultation</td>
                                        <td className="py-2 text-right font-medium">{totals.consultation.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="py-2 text-gray-600">Nursing Care</td>
                                        <td className="py-2 text-right font-medium">{totals.nursingCare.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="py-2 text-gray-600">Laboratory</td>
                                        <td className="py-2 text-right font-medium">{totals.laboratory.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="py-2 text-gray-600">Radiology</td>
                                        <td className="py-2 text-right font-medium">{totals.radiology.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="py-2 text-gray-600">Pharmacy / Drugs</td>
                                        <td className="py-2 text-right font-medium">{totals.pharmacy.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-200 font-semibold">
                                        <td className="py-2 text-gray-900 whitespace-nowrap">Other Specialized Services (Dental, Surg, Physio...)</td>
                                        <td className="py-2 text-right text-gray-900">
                                            {(totals.dental + totals.lodging + totals.surgicals + totals.drRound + totals.food + totals.physio + totals.sundries + totals.antenatal + totals.other).toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-bold text-lg text-gray-900">Grand Total</td>
                                        <td className="py-3 text-right font-bold text-lg text-primary-700">K {totals.grandTotal.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                        <div>
                            <p>Prepared By: __________________________</p>
                        </div>
                        <div>
                            <p>Checked By: __________________________</p>
                        </div>
                        <div>
                            <p>Authorized Signature: __________________________</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 10mm; size: landscape; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
