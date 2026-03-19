import React, { useRef } from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';

const PaymentReceiptModal = ({ isOpen, onClose, receipt, patient }) => {
    const printRef = useRef();

    if (!isOpen || !receipt) return null;

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '', 'width=800,height=900');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Receipt - ZHMIS</title>
                    <style>
                        body { font-family: monospace; padding: 20px; color: #000; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .text-xl { font-size: 24px; margin-bottom: 5px; }
                        .text-sm { font-size: 14px; }
                        .mb-4 { margin-bottom: 16px; }
                        .mb-8 { margin-bottom: 32px; }
                        .flex { display: flex; justify-content: space-between; }
                        .border-t { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
                        .border-b { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .receipt-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        h1, p { margin: 0; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-secondary w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Actions */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h2 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Payment Successful
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                            <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Printable Area - Hidden from UI, only used for extracting HTML, wait, we can just show it and extract its HTML but restyle it */}
                <div className="p-6 overflow-y-auto bg-white text-black" ref={printRef}>
                    <div className="text-center mb-6">
                        <div className="text-xl font-bold uppercase tracking-widest text-[#0a192f] mb-1">MedFinance360</div>
                        <div className="text-sm text-gray-500 font-medium">Official Payment Receipt</div>
                    </div>

                    <div className="border-t border-b border-gray-300 py-3 mb-4 space-y-1 text-sm font-medium text-gray-700">
                        <div className="flex justify-between">
                            <span>Receipt #:</span>
                            <span className="font-bold text-black">{receipt.receiptNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date:</span>
                            <span className="font-bold text-black">{new Date(receipt.paymentDate || receipt.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span className="font-bold text-black uppercase">{receipt.receiver?.firstName} {receipt.receiver?.lastName}</span>
                        </div>
                    </div>

                    <div className="mb-4 space-y-1 text-sm font-medium text-gray-700">
                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Patient Details</div>
                        <div className="font-bold text-black text-base">{patient?.firstName} {patient?.lastName}</div>
                        <div>ID: {patient?.patientNumber}</div>
                        <div className="capitalize">Method: {receipt.paymentMethod?.replace('_', ' ')}</div>
                    </div>

                    <div className="border-t border-gray-300 pt-3 mt-4 space-y-2">
                        <div className="flex justify-between text-sm font-bold text-gray-700">
                            <span>Description</span>
                            <span>Amount</span>
                        </div>
                        <div className="flex justify-between text-base font-black text-black">
                            <span>{receipt.notes || (receipt.billType ? `Payment for ${receipt.billType}` : 'Advance Deposit')}</span>
                            <span>{formatCurrency(receipt.amount)}</span>
                        </div>
                    </div>

                    <div className="mt-8 text-center border-t border-gray-300 pt-4">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total Paid</div>
                        <div className="text-2xl font-black text-[#0a192f]">{formatCurrency(receipt.amount)}</div>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400 font-medium italic">
                        Thank you for your payment
                        <br />
                        Printed on {new Date().toLocaleString()}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="w-full btn btn-secondary py-3 font-black uppercase tracking-widest text-xs"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentReceiptModal;
