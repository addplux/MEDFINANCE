import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, FileText, Download, Users, Shield, ChevronDown } from 'lucide-react';
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
    const [showServicesDropdown, setShowServicesDropdown] = useState(false);
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
        <div className="min-h-screen flex flex-col bg-bg-primary overflow-x-auto text-text-primary">
            {/* Header */}
            <div className="flex-shrink-0 print:hidden bg-bg-secondary/40 backdrop-blur-xl border-b border-border-color px-4 md:px-6 py-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/app/receivables/schemes')}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-tertiary hover:text-text-primary"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            {scheme ? (
                                <>
                                    <h1 className="text-xl font-black text-text-primary font-sans tracking-tight uppercase">{scheme.schemeName}</h1>
                                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em]">Scheme Code: {scheme.schemeCode}</p>
                                </>
                            ) : (
                                <div className="animate-pulse h-8 w-48 bg-white/5 rounded-xl"></div>
                            )}
                        </div>
                    </div>

                    {/* Tabs (Suno Style - Text with Underline) */}
                    <div className="flex gap-6 border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('statement')}
                            className={`pb-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'statement' ? 'border-primary text-primary shadow-[0_10px_20px_rgba(255,0,204,0.1)]' : 'border-transparent text-white/40 hover:text-white'
                                }`}
                        >
                            Statement
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`pb-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'members' ? 'border-primary text-primary shadow-[0_10px_20px_rgba(255,0,204,0.1)]' : 'border-transparent text-white/40 hover:text-white'
                                }`}
                        >
                            Members
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`pb-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'invoices' ? 'border-primary text-primary shadow-[0_10px_20px_rgba(255,0,204,0.1)]' : 'border-transparent text-white/40 hover:text-white'
                                }`}
                        >
                            Invoices
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowServicesDropdown(!showServicesDropdown)}
                                className="pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 border-transparent text-white/40 hover:text-white flex items-center gap-1.5 transition-all"
                            >
                                <Shield className="w-3 h-3" />
                                Services & Pricing
                                <ChevronDown className={`w-3 h-3 transition-transform ${showServicesDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showServicesDropdown && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setShowServicesDropdown(false)} />
                                    <div className="absolute right-0 top-full mt-2 bg-bg-secondary border border-white/5 rounded-2xl shadow-2xl z-30 min-w-[200px] overflow-hidden animate-fade-in backdrop-blur-md">
                                        <button
                                            onClick={() => {
                                                setShowServicesDropdown(false);
                                                navigate(`/app/receivables/schemes/${id}/services`);
                                            }}
                                            className="w-full text-left px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2.5 border-b border-white/5"
                                        >
                                            <Shield className="w-3.5 h-3.5 text-primary" />
                                            Manage Services
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowServicesDropdown(false);
                                                setActiveTab('members');
                                            }}
                                            className="w-full text-left px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2.5"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-pink-400" />
                                            Patient Statements
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions (Only visible in Statement tab) */}
                    {activeTab === 'statement' && (
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Date Picker Pill */}
                            <div className="flex items-center gap-2 bg-bg-tertiary px-4 py-2 rounded-full border border-border-color shadow-inner group hover:bg-bg-elevated transition-all">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={dateRange.startDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-tighter focus:ring-0 text-text-secondary p-0 w-24 cursor-pointer"
                                />
                                <span className="text-text-tertiary font-black">-</span>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={dateRange.endDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-tighter focus:ring-0 text-text-secondary p-0 w-24 cursor-pointer"
                                />

                                <div className="h-4 w-px bg-white/10 mx-2" />

                                <button
                                    onClick={fetchStatement}
                                    className="text-white/40 hover:text-primary transition-all p-1"
                                    title="Refresh"
                                >
                                    <Calendar className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Print Button (Pill Style) */}
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,0,204,0.3)]"
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
            <div className="flex-1 flex flex-col min-h-0 min-w-0 px-4 md:px-6 pb-6 print:p-0">

                {/* Opening Balances Summary (If available) - Fixed at top of content if present */}
                <div className="flex-shrink-0">
                    {scheme && scheme.openingBalances && scheme.openingBalances.total > 0 && (
                        <div className="bg-bg-secondary/20 rounded-[2.5rem] shadow-2xl border border-border-color p-8 mb-8 print:hidden backdrop-blur-md">
                            <h2 className="text-xl font-black text-text-primary mb-6 uppercase tracking-tighter">Opening Balance Breakdown</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {Object.entries(scheme.openingBalances).map(([key, value]) => (
                                    key !== 'total' && value > 0 && (
                                        <div key={key} className="bg-bg-tertiary p-4 rounded-2xl border border-border-color shadow-inner group hover:bg-bg-elevated transition-all">
                                            <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                            <p className="text-xl font-black text-text-primary tabular-nums">{Number(value).toLocaleString()}</p>
                                        </div>
                                    )
                                ))}
                                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 col-span-2 md:col-span-1 shadow-[0_0_20px_rgba(255,0,204,0.1)]">
                                    <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1">Total Balance</p>
                                    <p className="text-2xl font-black text-primary tabular-nums">{Number(scheme.openingBalances.total).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'statement' ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-bg-secondary/10 shadow-2xl border border-border-color rounded-[3rem] overflow-hidden print:shadow-none print:border-none print:p-4 backdrop-blur-sm" ref={componentRef}>

                        {/* Statement Header - Fixed */}
                        <div className="flex-shrink-0 flex justify-between items-start p-10 pb-6 border-b border-border-color bg-bg-secondary/20">
                            <div>
                                <h2 className="text-3xl font-black text-text-primary mb-2 uppercase tracking-tighter">SCHEME BILLING STATEMENT</h2>
                                <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Statement Period: {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}</p>
                            </div>
                            {scheme && (
                                <div className="text-right">
                                    <h3 className="text-xl font-black text-primary uppercase tracking-tighter">{scheme.schemeName}</h3>
                                    <p className="text-text-secondary text-xs font-bold tracking-tight">Code: {scheme.schemeCode}</p>
                                    <p className="text-text-tertiary text-[10px] font-black uppercase tracking-[0.2em] mt-1">{scheme.schemeType} Scheme</p>
                                    {scheme.contactPerson && <p className="text-text-tertiary text-[10px] font-bold mt-2 italic opacity-60">Attn: {scheme.contactPerson}</p>}
                                </div>
                            )}
                        </div>

                        {/* Bill Table - Scrollable */}
                        <div className="flex-1 overflow-auto p-10 pt-0 custom-scrollbar">
                            <table className="w-full text-sm text-left relative">
                                <thead className="text-[10px] text-text-tertiary uppercase font-black tracking-widest bg-bg-secondary/40 border-y border-border-color sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 bg-transparent">Date</th>
                                        <th className="px-6 py-4 bg-transparent">Patient No.</th>
                                        <th className="px-6 py-4 bg-transparent">Patient Name</th>
                                        <th className="px-6 py-4 bg-transparent">Sex</th>
                                        <th className="px-6 py-4 bg-transparent">Dept</th>
                                        <th className="px-6 py-4 bg-transparent">Service / Description</th>
                                        <th className="px-6 py-4 text-right bg-transparent">Amount</th>
                                        <th className="px-6 py-4 text-right bg-transparent">Discount</th>
                                        <th className="px-6 py-4 text-right bg-transparent border-r border-border-color">Net Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color">
                                    {bills.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-text-tertiary italic">
                                                No bills found for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        bills.map((bill) => (
                                            <tr key={bill.id} className="hover:bg-bg-secondary/40 transition-colors group">
                                                <td className="px-6 py-4 text-text-primary whitespace-nowrap text-xs">{bill.billDate}</td>
                                                <td className="px-6 py-4 text-text-secondary font-mono text-[10px] tracking-tight">{bill.patient?.patientNumber}</td>
                                                <td className="px-6 py-4 text-text-primary font-bold tracking-tight">
                                                    {bill.patient?.firstName} {bill.patient?.lastName}
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary text-xs font-bold uppercase">{bill.patient?.gender}</td>
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                        const badges = {
                                                            OPD: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                                            Pharmacy: 'bg-green-500/20 text-green-300 border-green-500/30',
                                                            Laboratory: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                                                            Radiology: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                                                            Theatre: 'bg-red-500/20 text-red-300 border-red-500/30',
                                                            Maternity: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
                                                            Specialist: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                                                        };
                                                        const cls = badges[bill.billType] || 'bg-white/10 text-white/60 border-white/10';
                                                        return <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cls}`}>{bill.billType || 'OPD'}</span>;
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 text-text-primary text-xs font-medium">
                                                    {(() => {
                                                        // If this was an Excel/scheme import bill, parse the notes breakdown
                                                        if (bill.notes && bill.notes.startsWith('Scheme import:')) {
                                                            const labelMap = {
                                                                nursing: 'Nursing', consult: 'Consultation', dental: 'Dental',
                                                                lodge: 'Lodgement', surg: 'Surgery', drRound: 'Dr Round',
                                                                food: 'Food/Diet', physio: 'Physiotherapy',
                                                                pharmacy: 'Pharmacy', sundries: 'Sundries', antenatal: 'Antenatal'
                                                            };
                                                            const raw = bill.notes.replace('Scheme import:', '').trim();
                                                            const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
                                                            const nonZero = parts
                                                                .map(p => { const [k, v] = p.split('='); return { key: k?.trim(), val: parseFloat(v || 0) }; })
                                                                .filter(x => x.val > 0);
                                                            if (nonZero.length > 0) {
                                                                return (
                                                                    <div className="space-y-0.5">
                                                                        {nonZero.map(({ key, val }) => (
                                                                            <div key={key} className="flex items-center gap-1.5">
                                                                                <span className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">{labelMap[key] || key}:</span>
                                                                                <span className="text-text-primary font-bold">K{val.toLocaleString()}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                        // Non-import bill: show service name. If name was auto-set by import, clean it up
                                                        const rawName = bill.serviceName || bill.service?.serviceName || '';
                                                        if (/scheme.?import/i.test(rawName)) {
                                                            // e.g. "Scheme Import — Laboratory" → use dept-specific label
                                                            const deptLabel = { Laboratory: 'Laboratory Test', Radiology: 'Radiology Scan', Theatre: 'Theatre / Surgery', Maternity: 'Maternity', Pharmacy: 'Pharmacy / Drugs' };
                                                            return deptLabel[bill.billType] || bill.billType || 'Service';
                                                        }
                                                        return rawName || 'General Service';
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-text-primary tabular-nums">{Number(bill.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right text-text-tertiary tabular-nums">{Number(bill.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right font-black text-text-primary tabular-nums border-r border-border-color">{Number(bill.netAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-bg-tertiary font-black border-t border-border-color sticky bottom-0 z-10 shadow-2xl">
                                    <tr>
                                        <td colSpan="6" className="px-6 py-6 text-right text-text-tertiary uppercase tracking-[0.2em] text-[10px]">Grand Total</td>
                                        <td className="px-6 py-6 text-right text-primary bg-transparent text-lg tabular-nums">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-6 text-right text-text-tertiary bg-transparent tabular-nums">{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-6 text-right text-text-primary text-xl bg-transparent tabular-nums border-r border-border-color">{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Footer / Signature Area - Fixed at bottom of card */}
                        <div className="flex-shrink-0 mt-auto p-12 pt-8 flex justify-between items-end border-t border-border-color print:flex hidden">
                            <div className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">
                                <p>Generated on {new Date().toLocaleString()}</p>
                                <p>MEDFINANCE360 v1.0</p>
                            </div>
                            <div className="text-center">
                                <div className="w-64 border-b border-primary/40 mb-3 shadow-[0_5px_15px_rgba(255,0,204,0.2)]"></div>
                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Authorized Signature / Stamp</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'members' ? (
                    <SchemeMembers schemeId={id} schemeType={scheme?.schemeType} />
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
