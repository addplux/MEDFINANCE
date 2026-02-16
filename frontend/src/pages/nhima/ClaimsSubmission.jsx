import React, { useState, useEffect } from 'react';
import { Plus, Send, FileText } from 'lucide-react';

const ClaimsSubmission = () => {
    const [claims, setClaims] = useState([]);
    const [selectedBills, setSelectedBills] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock data for pending bills
    const pendingBills = [
        { id: 1, billNumber: 'OPD-2026-001', patient: 'John Doe', amount: 250.00, date: '2026-02-15' },
        { id: 2, billNumber: 'OPD-2026-002', patient: 'Jane Smith', amount: 180.00, date: '2026-02-15' },
        { id: 3, billNumber: 'IPD-2026-001', patient: 'Bob Johnson', amount: 1500.00, date: '2026-02-14' },
    ];

    const handleSelectBill = (billId) => {
        setSelectedBills(prev =>
            prev.includes(billId)
                ? prev.filter(id => id !== billId)
                : [...prev, billId]
        );
    };

    const handleSubmitClaims = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            alert(`${selectedBills.length} claim(s) submitted successfully!`);
            setSelectedBills([]);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Claims Submission</h1>
                    <p className="text-gray-600 mt-1">Submit claims to NHIMA for reimbursement</p>
                </div>
                <button
                    onClick={handleSubmitClaims}
                    disabled={selectedBills.length === 0 || loading}
                    className="btn btn-primary"
                >
                    <Send className="w-5 h-5" />
                    Submit {selectedBills.length > 0 && `(${selectedBills.length})`}
                </button>
            </div>

            {/* Pending Bills Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Pending NHIMA Bills</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedBills.length === pendingBills.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedBills(pendingBills.map(b => b.id));
                                            } else {
                                                setSelectedBills([]);
                                            }
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th>Bill Number</th>
                                <th>Patient</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingBills.map((bill) => (
                                <tr key={bill.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedBills.includes(bill.id)}
                                            onChange={() => handleSelectBill(bill.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="font-medium">{bill.billNumber}</td>
                                    <td>{bill.patient}</td>
                                    <td>{new Date(bill.date).toLocaleDateString()}</td>
                                    <td className="font-semibold">K {bill.amount.toLocaleString()}</td>
                                    <td>
                                        <button className="btn btn-sm btn-secondary">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClaimsSubmission;
