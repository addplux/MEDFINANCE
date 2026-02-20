import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, patientAPI } from '../../services/apiService';
import { Search, ArrowRight, User as UserIcon, AlertCircle } from 'lucide-react';

const PatientLedger = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [unpaidBills, setUnpaidBills] = useState([]);
    const [selectedBills, setSelectedBills] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const response = await patientAPI.getAll();
            setPatients(response.data.data || response.data || []);
        } catch (error) {
            console.error('Failed to load patients:', error);
        }
    };

    const fetchUnpaidBills = async (patientId) => {
        if (!patientId) return;
        try {
            setLoading(true);
            const response = await billingAPI.patient.getUnpaidBills(patientId);
            setUnpaidBills(response.data || []);
            setSelectedBills([]); // Reset selection when patient changes
        } catch (error) {
            console.error('Failed to fetch unpaid bills:', error);
            setUnpaidBills([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientChange = (e) => {
        const id = e.target.value;
        setSelectedPatientId(id);
        if (id) {
            fetchUnpaidBills(id);
        } else {
            setUnpaidBills([]);
        }
    };

    const handleSelectBill = (billId) => {
        setSelectedBills(prev =>
            prev.includes(billId) ? prev.filter(id => id !== billId) : [...prev, billId]
        );
    };

    const handleSelectAll = () => {
        if (selectedBills.length === unpaidBills.length) {
            setSelectedBills([]);
        } else {
            setSelectedBills(unpaidBills.map(b => b.id));
        }
    };

    const handleProceedToPayment = () => {
        if (selectedBills.length === 0) return;

        const billsToPay = unpaidBills.filter(b => selectedBills.includes(b.id));
        navigate('/app/cash/payments/new', { state: { patientId: selectedPatientId, billsToPay } });
    };

    const totalSelectedAmount = unpaidBills
        .filter(b => selectedBills.includes(b.id))
        .reduce((sum, b) => sum + Number(b.netAmount || b.totalAmount || 0), 0);

    const filteredPatients = patients.filter(p =>
        (p.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.patientNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cashier Queue</h1>
                    <p className="text-gray-600 mt-1">Search patients and clear outstanding bills</p>
                </div>
            </div>

            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="form-label text-gray-700">Search Patient Name or ID</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Start typing to filter..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input pl-11"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label text-gray-700">Select Patient to View Bills</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={selectedPatientId}
                                onChange={handlePatientChange}
                                className="form-select pl-11"
                            >
                                <option value="">-- Choose a patient --</option>
                                {filteredPatients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.patientNumber} - {p.firstName} {p.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {selectedPatientId && (
                <div className="card overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            Outstanding Bills
                        </h2>
                        {unpaidBills.length > 0 && (
                            <span className="badge badge-warning">
                                {unpaidBills.length} Unpaid Bill(s)
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={unpaidBills.length > 0 && selectedBills.length === unpaidBills.length}
                                            onChange={handleSelectAll}
                                            disabled={unpaidBills.length === 0}
                                        />
                                    </th>
                                    <th>Date</th>
                                    <th>Department</th>
                                    <th>Bill No</th>
                                    <th>Description</th>
                                    <th className="text-right">Amount (K)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                            Searching departments...
                                        </td>
                                    </tr>
                                ) : unpaidBills.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12">
                                            <div className="max-w-xs mx-auto text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p className="text-lg font-medium text-gray-600 mb-1">No Unpaid Bills</p>
                                                <p className="text-sm">This patient has no outstanding balances.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    unpaidBills.map((bill) => (
                                        <tr key={`${bill.department}-${bill.id}`}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedBills.includes(bill.id) ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => handleSelectBill(bill.id)}
                                        >
                                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                                    checked={selectedBills.includes(bill.id)}
                                                    onChange={() => handleSelectBill(bill.id)}
                                                />
                                            </td>
                                            <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className="badge bg-gray-100 text-gray-700 font-medium">
                                                    {bill.department}
                                                </span>
                                            </td>
                                            <td className="font-mono text-sm text-gray-500">{bill.billNumber}</td>
                                            <td className="text-gray-900">{bill.description || '-'}</td>
                                            <td className="text-right font-semibold text-gray-900">
                                                {Number(bill.netAmount || bill.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sticky Action Footer */}
            {selectedBills.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 shadow-lg transform transition-transform z-40">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-900">{selectedBills.length}</span> bill(s) selected
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                Total: K {totalSelectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <button
                            onClick={handleProceedToPayment}
                            className="btn btn-primary px-8"
                        >
                            Pay Selected Bills
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLedger;
