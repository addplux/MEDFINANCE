import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Mail, CheckCircle, FileText, Building2 } from 'lucide-react';
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-white/40 font-black uppercase tracking-widest text-xs">Generating Invoice View...</p>
            </div>
        </div>
    );

    if (!invoiceData) return (
        <div className="p-12 text-center bg-red-500/10 border border-red-500/20 rounded-[3rem]">
            <p className="text-red-500 font-black uppercase tracking-widest text-sm">Invoice not found or session expired</p>
        </div>
    );

    const { invoice, rows, totals } = invoiceData;
    const { scheme } = invoice;

    return (
        <div className="min-h-screen bg-bg-primary text-white animate-fade-in pb-20">
            {/* Header / Actions Panel (No Print) */}
            <div className="print:hidden sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/5 px-8 py-6 mb-10">
                <div className="max-w-[1600px] mx-auto flex flex-wrap justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-4 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-primary" />
                                <h1 className="text-2xl font-black uppercase tracking-tighter">Invoice #{invoice.invoiceNumber}</h1>
                            </div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Generated for: <span className="text-white">{scheme.schemeName}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,0,204,0.3)]"
                        >
                            <Printer className="w-5 h-5" />
                            Print / Save PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="max-w-[1400px] mx-auto px-6 print:p-0 print:max-w-none">
                <div
                    className="bg-black/40 border border-white/5 rounded-[4rem] shadow-2xl p-16 overflow-hidden relative backdrop-blur-sm print:bg-white print:border-none print:shadow-none print:text-black print:p-4 print:rounded-none"
                    ref={componentRef}
                >
                    {/* Visual Accent */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none print:hidden"></div>

                    {/* Invoice Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16 border-b border-white/5 pb-12 print:border-slate-200">
                        <div className="space-y-8 max-w-xl">
                            <div>
                                <h2 className="text-6xl font-black uppercase tracking-tighter mb-4">TAX INVOICE</h2>
                                <div className="flex flex-wrap gap-8 text-[11px] font-bold uppercase tracking-widest text-white/40 print:text-slate-500">
                                    <p>Invoice #: <span className="text-primary font-black print:text-black">{invoice.invoiceNumber}</span></p>
                                    <p>Date: <span className="text-white print:text-black">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                                </div>
                            </div>

                            <div className="pt-8 space-y-4">
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">Billed To</p>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black uppercase tracking-tight">{scheme.schemeName}</h3>
                                    <div className="text-sm text-white/60 font-medium space-y-1 print:text-slate-600">
                                        {scheme.contactPerson && <p>Attn: {scheme.contactPerson}</p>}
                                        {scheme.email && <p className="lowercase">{scheme.email}</p>}
                                        {scheme.phone && <p>{scheme.phone}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:text-right space-y-8 print:text-right">
                            <div className="space-y-2">
                                <div className="flex items-center justify-end gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-3xl font-black tracking-tighter">MEDFINANCE360</span>
                                </div>
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] print:text-slate-400">
                                    <p>Medical Services Limited</p>
                                    <p>123 Health Avenue, Lusaka, Zambia</p>
                                    <p>TPIN: 1001234567 | Reg: 220199</p>
                                </div>
                            </div>

                            <div className="inline-block bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] text-left min-w-[320px] backdrop-blur-md shadow-xl print:bg-slate-50 print:border-slate-200 print:text-black">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 print:text-slate-500">Total Amount Due</p>
                                <p className="text-5xl font-black text-primary tabular-nums tracking-tighter print:text-black">K {Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest print:border-slate-200 print:text-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                    Due Date: {new Date(invoice.periodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/5 print:bg-slate-200"></div>
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] px-4 whitespace-nowrap print:text-slate-400">
                            Billing Period: {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                        </h4>
                        <div className="h-px flex-1 bg-white/5 print:bg-slate-200"></div>
                    </div>

                    {/* Matrix Table - Dark Mode Optimized */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse border border-white/5 print:border-slate-300">
                            <thead className="bg-white/[0.03] text-[9px] font-black text-white/40 uppercase tracking-widest print:bg-slate-100 print:text-slate-700">
                                <tr>
                                    <th className="px-3 py-4 border border-white/5 w-24 print:border-slate-300">Date</th>
                                    <th className="px-3 py-4 border border-white/5 min-w-[140px] print:border-slate-300">Patient Details</th>
                                    <th className="px-3 py-4 border border-white/5 w-24 print:border-slate-300">ID / Policy</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Cons</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Nurs</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Lab</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Rad</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Dent</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Lodg</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Surg</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Phar</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Phys</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Sun</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Ant</th>
                                    <th className="px-2 py-4 border border-white/5 text-right print:border-slate-300">Oth</th>
                                    <th className="px-3 py-4 border border-white/5 text-right bg-white/[0.05] text-white font-black print:bg-slate-200 print:text-black print:border-slate-300">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-[10px] font-medium text-white/70 print:text-black">
                                {rows.map((row, index) => (
                                    <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-3 py-2 border border-white/5 text-white/40 whitespace-nowrap print:border-slate-200">{row.date}</td>
                                        <td className="px-3 py-2 border border-white/5 text-white font-bold truncate print:border-slate-200">{row.patientName}</td>
                                        <td className="px-3 py-2 border border-white/5 font-mono text-[9px] text-white/50 print:border-slate-200">{row.manNumber || row.policyNumber || '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.consultation > 0 ? row.consultation.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.nursingCare > 0 ? row.nursingCare.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.laboratory > 0 ? row.laboratory.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.radiology > 0 ? row.radiology.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.dental > 0 ? row.dental.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.lodging > 0 ? row.lodging.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.surgicalls > 0 ? row.surgicals.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.pharmacy > 0 ? row.pharmacy.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.physio > 0 ? row.physio.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.sundries > 0 ? row.sundries.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.antenatal > 0 ? row.antenatal.toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 border border-white/5 text-right tabular-nums print:border-slate-200">{row.other > 0 ? row.other.toLocaleString() : '-'}</td>
                                        <td className="px-3 py-2 border border-white/5 text-right font-black text-white bg-white/[0.04] tabular-nums print:bg-slate-100 print:text-black print:border-slate-200">{row.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-white/[0.05] text-[10px] font-black text-white print:bg-slate-200 print:text-black">
                                <tr>
                                    <td colSpan="3" className="px-4 py-4 border border-white/5 text-right uppercase tracking-[0.2em] print:border-slate-300">Monthly Totals</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.consultation.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.nursingCare.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.laboratory.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.radiology.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.dental.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.lodging.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.surgicals.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.pharmacy.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.physio.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.sundries.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.antenatal.toLocaleString()}</td>
                                    <td className="px-2 py-4 border border-white/5 text-right tabular-nums print:border-slate-300">{totals.other.toLocaleString()}</td>
                                    <td className="px-4 py-4 border border-white/5 text-right text-primary text-xs print:text-black print:border-slate-300">{totals.grandTotal.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Summary & Signatures Section */}
                    <div className="mt-20 flex flex-col lg:flex-row justify-between items-start gap-16">
                        <div className="w-full lg:max-w-md space-y-12">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] print:text-slate-500">Breakdown Summary</p>
                                <div className="space-y-3 bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 print:bg-slate-50 print:border-slate-200">
                                    {[
                                        { label: 'Consultation', value: totals.consultation },
                                        { label: 'Laboratory Services', value: totals.laboratory },
                                        { label: 'Radiology / Imaging', value: totals.radiology },
                                        { label: 'Pharmacy / Supplies', value: totals.pharmacy },
                                        { label: 'Other Clinic Services', value: (totals.dental + totals.lodging + totals.surgicals + totals.drRound + totals.food + totals.physio + totals.sundries + totals.antenatal + totals.other) }
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                            <span className="text-white/40 print:text-slate-500">{item.label}</span>
                                            <span className="tabular-nums print:text-black">K {item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-lg font-black print:border-slate-200">
                                        <span className="text-primary uppercase tracking-tighter print:text-black">Grand Total</span>
                                        <span className="tabular-nums print:text-black">K {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:max-w-2xl flex flex-col justify-end h-full pt-12 lg:pt-0">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-16 print:grid-cols-3">
                                <div className="space-y-3">
                                    <div className="h-px bg-white/20 print:bg-slate-400"></div>
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] print:text-slate-500">Prepared By (Accounts)</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-px bg-white/20 print:bg-slate-400"></div>
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] print:text-slate-500">Checked By</p>
                                </div>
                                <div className="space-y-3 hidden print:block">
                                    <div className="h-px bg-slate-400"></div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Authorized Signatory</p>
                                </div>
                            </div>

                            <div className="mt-16 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border-l-2 border-primary/40 print:from-slate-100 print:to-slate-50 print:border-slate-400 print:text-slate-600">
                                <p className="text-[9px] font-bold text-white/40 leading-relaxed uppercase tracking-widest print:text-slate-500 italic">
                                    Please make all checks payable to "MEDFINANCE360 Medical Services LTD".
                                    Payments are due within 30 days of the invoice date.
                                    Query any discrepancies within 7 working days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Print Styles Overrides */}
            <style>{`
                @media print {
                    @page { margin: 15mm; size: landscape; }
                    body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
                    * { border-color: #cbd5e1 !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:bg-slate-50 { background-color: #f8fafc !important; }
                    .print\\:bg-slate-100 { background-color: #f1f5f9 !important; }
                    .print\\:bg-slate-200 { background-color: #e2e8f0 !important; }
                    .print\\:text-black { color: black !important; }
                    .print\\:text-slate-400 { color: #94a3b8 !important; }
                    .print\\:text-slate-500 { color: #64748b !important; }
                    .print\\:text-slate-600 { color: #475569 !important; }
                    .print\\:text-slate-700 { color: #334155 !important; }
                    .print\\:border-slate-200 { border-color: #e2e8f0 !important; }
                    .print\\:border-slate-300 { border-color: #cbd5e1 !important; }
                    .print\\:border-slate-400 { border-color: #94a3b8 !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:rounded-none { border-radius: 0 !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:p-4 { padding: 1rem !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
