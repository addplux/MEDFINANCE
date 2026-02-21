import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, patientAPI } from '../../services/apiService';
import { Search, ArrowRight, User as UserIcon, AlertCircle, Clock, CheckCircle, Receipt, UserPlus } from 'lucide-react';

const PatientLedger = () => {
    const navigate = useNavigate();
    const [pendingQueue, setPendingQueue] = useState([]);
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [unpaidBills, setUnpaidBills] = useState([]);
    const [selectedBills, setSelectedBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [queueLoading, setQueueLoading] = useState(true);

    useEffect(() => {
        loadPatients();
        fetchPendingQueue();
    }, []);

    const fetchPendingQueue = async () => {
        try {
            setQueueLoading(true);
            const response = await billingAPI.patient.getPendingQueue();
            setPendingQueue(response.data || []);
        } catch (error) {
            console.error('Failed to fetch pending queue:', error);
        } finally {
            setQueueLoading(false);
        }
    };

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
            setSelectedBills(response.data?.map(b => b.id) || []); // Default to selecting all
        } catch (error) {
            console.error('Failed to fetch unpaid bills:', error);
            setUnpaidBills([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = (patientId) => {
        setSelectedPatientId(patientId);
        fetchUnpaidBills(patientId);
        // Scroll to bills section
        window.scrollTo({ top: 400, behavior: 'smooth' });
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
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Receipt className="text-primary" size={32} />
                        Cashier Queue
                    </h1>
                    <p className="text-gray-600 mt-1">Automatically tracking unpaid services across all departments</p>
                </div>
                <button
                    onClick={fetchPendingQueue}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                    <Clock size={18} className={queueLoading ? 'animate-spin' : ''} />
                    Refresh Queue
                </button>
            </div>

            {/* Live Pending Queue */}
            <div className="card overflow-hidden border-orange-200 bg-orange-50/20">
                <div className="p-4 border-b border-orange-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        Live Pending Payments
                    </h2>
                    <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                        Real-time Queue
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr className="bg-orange-50/50">
                                <th>Patient</th>
                                <th>Pending Under</th>
                                <th>Total Due (K)</th>
                                <th>Items</th>
                                <th>Wait Time</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queueLoading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                                        <p className="text-orange-900/60 text-sm font-medium">Scanning departments for unpaid bills...</p>
                                    </td>
                                </tr>
                            ) : pendingQueue.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-16">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="text-emerald-500" size={32} />
                                            </div>
                                            <p className="text-xl font-bold text-gray-900 mb-1">Queue Clear!</p>
                                            <p className="text-gray-600">All departments have processed payments.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pendingQueue.map((p) => (
                                    <tr key={p.id} className="hover:bg-orange-50/50 transition-all border-b border-orange-50">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700">
                                                    {p.firstName[0]}{p.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{p.firstName} {p.lastName}</p>
                                                    <p className="text-xs text-orange-700/70 font-mono">{p.patientNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {p.departments.split(', ').map(d => (
                                                    <span key={d} className="px-2 py-0.5 rounded-lg bg-white border border-orange-200 text-[10px] font-bold text-orange-700 uppercase">
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="font-bold text-gray-900">
                                            {Number(p.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-gray-600 text-sm">{p.itemCount} bills</td>
                                        <td className="text-xs font-medium text-gray-500">
                                            {Math.floor((new Date() - new Date(p.lastRequest)) / (1000 * 60))} mins ago
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => handleSelectPatient(p.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto ${selectedPatientId === String(p.id) ? 'bg-orange-600 text-white shadow-lg' : 'bg-white border border-orange-300 text-orange-700 hover:bg-orange-100 shadow-sm'}`}
                                            >
                                                {selectedPatientId === String(p.id) ? 'Selected' : 'Open Bill'}
                                                <ArrowRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Search Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-6 border-blue-100 bg-blue-50/10">
                        <label className="text-sm font-bold text-blue-900 mb-4 block uppercase tracking-wider">Manual Bill Search</label>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <input
                                    type="text"
                                    placeholder="Patient Name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                                />
                            </div>

                            <select
                                value={selectedPatientId}
                                onChange={handlePatientChange}
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                            >
                                <option value="">-- Direct Patient Selection --</option>
                                {filteredPatients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.patientNumber} - {p.firstName} {p.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-6 pt-6 border-t border-blue-100">
                            <p className="text-xs text-blue-800/60 leading-relaxed font-medium">
                                <AlertCircle size={14} className="inline mr-1 mb-0.5" />
                                Use manual search if a patient doesn't appear in the live queue but claims to have a bill.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bill Details */}
                <div className="lg:col-span-2">
                    {selectedPatientId ? (
                        <div className="card overflow-hidden border-indigo-200">
                            <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50">
                                <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <Receipt size={20} />
                                    Detailed Bill Breakdown
                                </h2>
                                {unpaidBills.length > 0 && (
                                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                                        {unpaidBills.length} Unpaid Item(s)
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
                                            <th>Description</th>
                                            <th className="text-right">Amount (K)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-12">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                                                    <p className="text-gray-500 text-sm">Aggregating department bills...</p>
                                                </td>
                                            </tr>
                                        ) : unpaidBills.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-16">
                                                    <div className="max-w-xs mx-auto text-gray-400">
                                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                        <p className="text-lg font-bold text-gray-600 mb-1">Account Balanced</p>
                                                        <p className="text-sm">No outstanding bills found for this patient.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            unpaidBills.map((bill) => (
                                                <tr key={`${bill.department}-${bill.id}`}
                                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedBills.includes(bill.id) ? 'bg-indigo-50/50' : ''}`}
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
                                                    <td className="text-xs text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold uppercase border border-gray-200">
                                                            {bill.department}
                                                        </span>
                                                    </td>
                                                    <td className="text-sm font-medium text-gray-900">{bill.description || '-'}</td>
                                                    <td className="text-right font-bold text-gray-900">
                                                        {Number(bill.netAmount || bill.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="card h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50/30 border-dashed">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <UserPlus className="text-gray-300" size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Detailed View</h3>
                            <p className="text-gray-500 max-w-sm">
                                Select a patient from the **Live Pending Queue** above or use the manual search to view and process outstanding bills.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Action Footer */}
            {selectedBills.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-indigo-200 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transform transition-all z-50 animate-in slide-in-from-bottom-full">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Selection</span>
                                <span className="text-sm font-bold text-indigo-900">{selectedBills.length} Bill(s)</span>
                            </div>
                            <div className="h-10 w-px bg-indigo-100" />
                            <div className="flex flex-col text-right lg:text-left">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payable Amount</span>
                                <span className="text-2xl font-black text-gray-900">Total: K {totalSelectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleProceedToPayment}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95 transition-all flex items-center gap-3"
                        >
                            Approve Payment
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLedger;
