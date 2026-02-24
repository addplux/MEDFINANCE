import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '../../services/apiClient';

const HOSPITAL_NAME = 'NCHANGA NORTH GENERAL HOSPITAL';
const HOSPITAL_ADDRESS = 'P.O BOX 10063, CHINGOLA – ZAMBIA';
const HOSPITAL_TEL = 'Tel: 318333 / 313801';

const fmt = (n) => n > 0 ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '';

const InvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef();

    useEffect(() => { fetchInvoice(); }, [id]);

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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
                <p className="text-gray-500 text-sm">Loading invoice...</p>
            </div>
        </div>
    );

    if (!invoiceData) return (
        <div className="p-12 text-center bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 font-medium">Invoice not found or session expired</p>
        </div>
    );

    const { invoice, rows, totals } = invoiceData;
    const { scheme } = invoice;

    // Aggregate service totals across all member rows
    const agg = (field) => (rows || []).reduce((s, r) => s + (Number(r[field]) || 0), 0);

    const services = [
        { label: 'Consultation', value: agg('consultation') },
        { label: 'Nursing Care', value: agg('nursingCare') },
        { label: 'Hospitalisation / Lodging', value: agg('lodging') },
        { label: 'Ante Natal Care', value: agg('antenatal') },
        { label: 'Normal Delivery / Post Natal', value: 0 },
        { label: 'Surgery / Surgicals', value: agg('surgicals') },
        { label: 'Anesthetic', value: 0 },
        { label: 'Theater Fee', value: 0 },
        { label: 'X-Ray / Radiology', value: agg('radiology') },
        { label: 'Laboratory Examination', value: agg('laboratory') },
        { label: 'Physiotherapy', value: agg('physio') },
        { label: 'Medicines / Pharmacy', value: agg('pharmacy') },
        { label: 'Miscellaneous / Sundries', value: agg('sundries') },
        { label: "Doctor's Round", value: agg('drRound') },
        { label: 'Dental Surgery', value: agg('dental') },
        { label: 'Food', value: agg('food') },
        { label: 'Other', value: agg('other') },
    ];

    const grandTotal = totals?.grandTotal || services.reduce((s, r) => s + r.value, 0);
    const periodLabel = invoice.periodStart
        ? new Date(invoice.periodStart).toLocaleString('default', { month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="min-h-screen bg-gray-100 pb-20 animate-fade-in">

            {/* Toolbar — hidden on print */}
            <div className="print:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-gray-900 text-sm">Invoice #{invoice.invoiceNumber}</h1>
                        <p className="text-xs text-gray-500">{scheme?.schemeName} — {periodLabel}</p>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    Print / Save PDF
                </button>
            </div>

            {/* Invoice Paper */}
            <div className="max-w-3xl mx-auto mt-8 print:mt-0 print:max-w-none" ref={printRef}>
                <div className="bg-white shadow-lg print:shadow-none p-10 print:p-6" style={{ fontFamily: 'Arial, sans-serif' }}>

                    {/* ── HEADER ── */}
                    <div className="text-center mb-6 border-b-2 border-black pb-4">
                        <p className="text-sm font-bold tracking-wide">INVOICE / STATEMENT</p>
                        <h1 className="text-2xl font-black tracking-wider mt-1 uppercase">{HOSPITAL_NAME}</h1>
                        <p className="text-xs mt-1 text-gray-600">{HOSPITAL_ADDRESS}</p>
                        <p className="text-xs text-gray-600">{HOSPITAL_TEL}</p>
                        <div className="flex justify-end mt-1">
                            <span className="text-sm font-bold">No.&nbsp;
                                <span className="text-red-600 text-base font-black">{invoice.invoiceNumber}</span>
                            </span>
                        </div>
                    </div>

                    {/* ── META GRID ── */}
                    <div className="grid grid-cols-2 gap-x-8 mb-4 text-xs">
                        <div className="space-y-1.5">
                            <div className="flex gap-1">
                                <span className="font-semibold whitespace-nowrap">INVOICE / STATEMENT No.:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">{invoice.invoiceNumber}</span>
                            </div>
                            <div>
                                <span className="font-semibold">Patient's name &amp; Address:</span>
                                <div className="border-b border-dotted border-gray-500 w-full mt-0.5 pb-0.5">{scheme?.schemeName}</div>
                                <div className="border-b border-dotted border-gray-500 w-full mt-1 pb-0.5">{scheme?.contactPerson || ''}</div>
                                <div className="border-b border-dotted border-gray-500 w-full mt-1 pb-0.5">&nbsp;</div>
                            </div>
                            <div className="flex gap-1 mt-1">
                                <span className="font-semibold whitespace-nowrap">Date Admitted:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">&nbsp;</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex gap-1">
                                <span className="font-semibold whitespace-nowrap">Date:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">
                                    {new Date().toLocaleDateString('en-GB')}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <span className="font-semibold whitespace-nowrap">Ward:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">&nbsp;</span>
                            </div>
                            <div className="flex gap-1">
                                <span className="font-semibold whitespace-nowrap">Doctor:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">&nbsp;</span>
                            </div>
                            <div className="flex gap-1">
                                <span className="font-semibold whitespace-nowrap">Date:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">&nbsp;</span>
                            </div>
                            <div className="flex gap-1">
                                <span className="font-semibold whitespace-nowrap">File No.:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">&nbsp;</span>
                            </div>
                            <div className="flex gap-1">
                                <span className="font-semibold whitespace-nowrap">Date Discharged:</span>
                                <span className="border-b border-dotted border-gray-500 flex-1">&nbsp;</span>
                            </div>
                        </div>
                    </div>

                    {/* ── BILLING TABLE ── */}
                    <table className="w-full border-collapse text-sm mt-4" style={{ borderColor: '#000' }}>
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black text-center py-2 px-3 font-bold text-xs uppercase tracking-wide w-2/3">
                                    DESCRIPTION
                                </th>
                                <th className="border border-black text-center py-2 px-3 font-bold text-xs uppercase tracking-wide w-[17%]">
                                    CHARGES
                                </th>
                                <th className="border border-black text-center py-2 px-3 font-bold text-xs uppercase tracking-wide w-[17%]">
                                    PAID ON THIS INVOICE
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((svc, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-black px-3 py-1.5 text-xs font-medium">
                                        {svc.label}:
                                    </td>
                                    <td className="border border-black px-3 py-1.5 text-xs text-right tabular-nums font-semibold">
                                        {fmt(svc.value)}
                                    </td>
                                    <td className="border border-black px-3 py-1.5 text-xs">&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {[
                                { label: 'DEPOSIT', value: null },
                                { label: 'TOTAL', value: grandTotal, bold: true },
                                { label: 'LESS PREVIOUS PAYMENT', value: null },
                                { label: 'AMOUNT OUTSTANDING', value: grandTotal, bold: true },
                            ].map((row, i) => (
                                <tr key={i} className={row.bold ? 'bg-gray-100' : 'bg-white'}>
                                    <td className={`border border-black px-3 py-1.5 text-xs ${row.bold ? 'font-black uppercase' : 'font-bold uppercase'}`}>
                                        {row.label}
                                    </td>
                                    <td className="border border-black px-3 py-1.5 text-xs text-right tabular-nums font-bold">
                                        {row.value != null ? fmt(row.value) : ''}
                                    </td>
                                    <td className="border border-black px-3 py-1.5 text-xs">&nbsp;</td>
                                </tr>
                            ))}
                        </tfoot>
                    </table>

                    {/* ── FOOTER ── */}
                    <div className="mt-6 text-xs space-y-2">
                        <div className="flex gap-2">
                            <span className="font-semibold whitespace-nowrap">BALANCE DUE: To be paid immediately to Hospital Accountant</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold whitespace-nowrap">BALANCE OVERPAID:</span>
                            <span className="border-b border-dotted border-gray-500 flex-1">&nbsp;</span>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                            <div className="space-y-1">
                                <div className="flex gap-2">
                                    <span className="font-semibold whitespace-nowrap">SIGNED:</span>
                                    <span className="border-b border-dotted border-gray-500 w-48">&nbsp;</span>
                                </div>
                                <p className="text-gray-500 text-[10px]">Original: To Patient</p>
                            </div>
                            <div className="border border-black w-24 h-16 flex items-center justify-center text-gray-400 text-xs">
                                Stamp
                            </div>
                        </div>
                    </div>

                    {/* ── MEMBER BREAKDOWN (visible on screen, print-hidden for summary view) ── */}
                    {rows && rows.length > 0 && (
                        <div className="mt-10 print:hidden">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide border-b border-gray-200 pb-1">
                                Member Billing Detail — {periodLabel}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 px-2 py-2 text-left font-bold">Policy #</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left font-bold">Patient</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold">Consult</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold">Nursing</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold">Lab</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold">Radio</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold">Dental</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold">Pharmacy</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold">Other</th>
                                            <th className="border border-gray-300 px-2 py-2 text-right font-bold bg-gray-200">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="border border-gray-200 px-2 py-1 font-mono text-gray-600">{row.policyNumber || row.manNumber || '-'}</td>
                                                <td className="border border-gray-200 px-2 py-1 font-medium">{row.patientName}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(row.consultation)}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(row.nursingCare)}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(row.laboratory)}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(row.radiology)}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(row.dental)}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(row.pharmacy)}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">{fmt(row.other)}</td>
                                                <td className="border border-gray-200 px-2 py-1 text-right font-bold bg-gray-100 tabular-nums">{fmt(row.total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-200 font-bold">
                                            <td colSpan="2" className="border border-gray-300 px-2 py-1.5 text-right uppercase text-[10px] tracking-widest">Grand Total</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmt(totals?.consultation)}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmt(totals?.nursingCare)}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmt(totals?.laboratory)}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmt(totals?.radiology)}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmt(totals?.dental)}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmt(totals?.pharmacy)}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmt(totals?.other)}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums bg-gray-300">{fmt(totals?.grandTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4 portrait; }
                    body { background: white !important; color: black !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:mt-0 { margin-top: 0 !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    .print\\:p-6 { padding: 1.5rem !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
