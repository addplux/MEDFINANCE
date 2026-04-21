import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { payrollAPI } from '../../services/apiService';
import { Printer, Calendar, User, FileText, Download, ArrowLeft } from 'lucide-react';

const StaffMedicalStatement = ({ staffId, period, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (staffId && period) {
            fetchStatement();
        }
    }, [staffId, period]);

    const fetchStatement = async () => {
        try {
            setLoading(true);
            const response = await payrollAPI.getStaffStatement(staffId, { period });
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch staff statement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Generating Statement...</p>
            </div>
        );
    }

    if (!data || !data.staff) {
        return (
            <div className="text-center py-20">
                <p className="text-white/40 font-black uppercase tracking-widest">No deduction records found for this period.</p>
                <button onClick={onBack} className="mt-4 text-accent text-sm font-bold flex items-center gap-2 mx-auto uppercase">
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    const { staff, deductions, summary } = data;

    return (
        <div className="space-y-6">
            {/* Action Bar (Hidden in Print) */}
            <div className="flex items-center justify-between print:hidden">
                <button onClick={onBack} className="text-white/40 hover:text-white transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <ArrowLeft size={16} /> Back to List
                </button>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="btn bg-white/5 border-white/10 text-white hover:bg-white/10 flex items-center gap-2">
                        <Printer size={16} /> Print Bill Slip
                    </button>
                </div>
            </div>

            {/* Bill Slip Content */}
            <div className="bg-white text-black p-10 shadow-2xl rounded-sm print:shadow-none print:p-0 min-h-[500px]">
                {/* Header */}
                <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">MEDFINANCE360</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60 mt-1">Medical Care Facility • Billing Dept</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold uppercase tracking-tight">Staff Medical Statement</h2>
                        <p className="text-xs font-black uppercase text-black/40 mt-1">For Period: <span className="text-black">{period}</span></p>
                    </div>
                </div>

                {/* Staff Info */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">Benefit Recipient</p>
                        <p className="text-lg font-black uppercase leading-tight">{staff.firstName} {staff.lastName}</p>
                        <p className="text-sm font-bold opacity-60">Man Number: {staff.manNumber || 'N/A'}</p>
                        <p className="text-sm">{staff.email}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">Statement Summary</p>
                        <div className="space-y-1">
                            <p className="text-sm">Total Deductions: <span className="font-bold">{deductions.length} Items</span></p>
                            <p className="text-2xl font-black">ZK {Number(summary.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mb-12">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-y border-black/10">
                                <th className="py-3 text-left font-black uppercase tracking-widest">Date</th>
                                <th className="py-3 text-left font-black uppercase tracking-widest">Receipt #</th>
                                <th className="py-3 text-left font-black uppercase tracking-widest">Department</th>
                                <th className="py-3 text-right font-black uppercase tracking-widest">Amount (ZK)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {deductions.map((d, i) => (
                                <tr key={i} className="hover:bg-black/[0.02]">
                                    <td className="py-4 font-medium">{new Date(d.payment?.paymentDate || d.createdAt).toLocaleDateString()}</td>
                                    <td className="py-4 font-mono font-bold">{d.payment?.receiptNumber || d.description.split(': ')[1]?.split(' ')[0] || 'N/A'}</td>
                                    <td className="py-4 uppercase font-black opacity-60 tracking-wider">
                                        {d.payment?.billType || (d.description.includes('(') ? d.description.match(/\(([^)]+)\)/)?.[1] : 'General')}
                                    </td>
                                    <td className="py-4 text-right font-black">
                                        {Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-black">
                                <td colSpan="3" className="py-4 font-black uppercase text-right">Consolidated Total</td>
                                <td className="py-4 text-right font-black text-lg">
                                    ZK {Number(summary.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer / Signatures */}
                <div className="grid grid-cols-2 gap-20 pt-10 mt-auto">
                    <div className="border-t border-black/20 pt-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-8">Authorized Signature (Hospital Finance)</p>
                        <div className="border-b border-black/40 w-full h-8" />
                    </div>
                    <div className="border-t border-black/20 pt-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-8">Recipient Signature (Staff Member)</p>
                        <div className="border-b border-black/40 w-full h-8" />
                    </div>
                </div>

                {/* Legal Note */}
                <div className="mt-16 pt-6 border-t border-black/5 text-center px-20">
                    <p className="text-[8px] font-bold text-black/30 leading-relaxed uppercase tracking-widest">
                        This document serves as an official confirmation of medical services rendered and billed for salary deduction. 
                        Any discrepancies must be reported to the Finance Department within 48 hours of receipt.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffMedicalStatement;
