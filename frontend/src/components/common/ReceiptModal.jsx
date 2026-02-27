import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';

const HOSPITAL_NAME = 'NCHANGA NORTH GENERAL HOSPITAL';
const HOSPITAL_ADDRESS = 'P.O BOX 10063, CHINGOLA – ZAMBIA';
const HOSPITAL_TEL = 'Tel: 318333 / 313801';

const fmt = (n) => n > 0 ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00';

const ReceiptModal = ({ isOpen, onClose, data }) => {
    const printRef = useRef();

    if (!isOpen || !data) return null;

    const { payment, billDetails } = data;
    const patientName = payment?.patient ? `${payment.patient.firstName} ${payment.patient.lastName}` : 'Unknown Patient';
    const patientNumber = payment?.patient?.patientNumber || '-';
    const cashierName = payment?.receiver ? `${payment.receiver.firstName} ${payment.receiver.lastName}` : 'System Admin';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-white print:p-0">

            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] print:shadow-none print:w-full print:max-w-none print:h-auto">

                {/* Header Actions (Hidden when printing) */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 print:hidden shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Payment Receipt</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium rounded-lg transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Print Receipt
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Content Area */}
                <div
                    ref={printRef}
                    className="p-8 overflow-y-auto print:p-0 print:overflow-visible text-sm"
                >
                    {/* Hospital Global Styles Block for the specific modal scope */}
                    <style>{`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            .receipt-print-area, .receipt-print-area * {
                                visibility: visible;
                            }
                            .receipt-print-area {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                            @page {
                                margin: 5mm;
                            }
                        }
                    `}</style>

                    <div className="receipt-print-area font-mono text-gray-800">
                        {/* Header */}
                        <div className="text-center mb-6 pb-6 border-b-2 border-dashed border-gray-300">
                            <h1 className="text-xl font-bold mb-1">{HOSPITAL_NAME}</h1>
                            <p className="text-xs text-gray-600">{HOSPITAL_ADDRESS}</p>
                            <p className="text-xs text-gray-600">{HOSPITAL_TEL}</p>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center px-4">
                                <div className="text-left leading-tight">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Receipt No</p>
                                    <p className="font-bold text-base">{payment.receiptNumber || 'N/A'}</p>
                                </div>
                                <div className="text-right leading-tight">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date</p>
                                    <p className="font-bold">{new Date(payment.paymentDate).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Patient</p>
                                    <p className="font-bold">{patientName}</p>
                                    <p className="text-xs text-gray-600">ID: {patientNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">CASHIER</p>
                                    <p className="font-bold">{cashierName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="mb-6">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="py-2 font-bold uppercase text-[11px] tracking-wider">Description</th>
                                        <th className="py-2 font-bold uppercase text-[11px] tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-200 border-dashed">
                                        <td className="py-3">
                                            <p className="font-bold">{payment.billType || 'General Payment'} Payment</p>
                                            {billDetails?.service?.serviceName ? (
                                                <p className="text-xs text-gray-600">Service: {billDetails.service.serviceName}</p>
                                            ) : payment.notes ? (
                                                <p className="text-xs text-gray-600">{payment.notes}</p>
                                            ) : null}
                                        </td>
                                        <td className="py-3 text-right font-medium">ZMW {fmt(payment.amount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-between items-center py-4 border-t-2 border-black bg-gray-50 px-4 rounded-lg">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Method: {payment.paymentMethod?.toUpperCase()}</p>
                                {payment.referenceNumber && <p className="text-xs text-gray-600">Ref: {payment.referenceNumber}</p>}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Paid</p>
                                <p className="text-2xl font-black">ZMW {fmt(payment.amount)}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center text-xs text-gray-500">
                            <p>Thank you for using MedFinance360</p>
                            <p className="mt-1">Wishing you a quick recovery.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal; 
