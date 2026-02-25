import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, patientAPI } from '../../services/apiService';
import {
    Search, ArrowRight, AlertCircle, Clock, CheckCircle,
    Receipt, UserPlus, RefreshCw, Filter, Wallet, Info
} from 'lucide-react';

const fmt = (n) => `ZK ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DEPT_COLORS = {
    OPD: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Pharmacy: 'bg-green-500/20 text-green-300 border-green-500/30',
    Laboratory: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Radiology: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    Theatre: 'bg-red-500/20 text-red-300 border-red-500/30',
    Maternity: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    IPD: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

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
            setPendingQueue([]);
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
        if (!patientId) return [];
        try {
            setLoading(true);
            const response = await billingAPI.patient.getUnpaidBills(patientId);
            const bills = response.data || [];
            let uidCounter = 0;
            const uniqueBills = bills.map(b => ({
                ...b,
                uid: b.uid || `${b.billType || b.department || 'other'}-${b.id}-${uidCounter++}`
            }));
            setUnpaidBills(uniqueBills);
            setSelectedBills(uniqueBills.map(b => b.uid));
            return uniqueBills;
        } catch (error) {
            console.error('[Payments] API ERROR:', error.response || error);
            setUnpaidBills([]);
            setSelectedBills([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = async (id) => {
        setSelectedPatientId(String(id));
        setUnpaidBills([]);
        setSelectedBills([]);
        const bills = await fetchUnpaidBills(id);
        if (bills && bills.length > 0) {
            setSelectedBills(bills.map(b => b.uid));
        }
    };

    const handleProceedToPayment = () => {
        if (selectedBills.length === 0) return;
        const billsToPay = unpaidBills.filter(b => selectedBills.includes(b.uid));
        navigate('/app/cash/payments/new', { state: { patientId: selectedPatientId, billsToPay } });
    };

    const toggleBill = (uid) => {
        setSelectedBills(prev =>
            prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
        );
    };

    const toggleAll = () => {
        if (selectedBills.length === unpaidBills.length) {
            setSelectedBills([]);
        } else {
            setSelectedBills(unpaidBills.map(b => b.uid));
        }
    };

    const totalSelectedAmount = unpaidBills
        .filter(b => selectedBills.includes(b.uid))
        .reduce((sum, b) => sum + Number(b.netAmount || b.totalAmount || 0), 0);

    const filteredPatients = patients.filter(p =>
        (p.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.patientNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-32 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-2xl">
                            <Wallet className="text-accent" size={32} />
                        </div>
                        Cashier Queue
                    </h1>
                    <p className="text-sm text-text-secondary mt-1 ml-14">Unified billing engine tracking all active hospital departments</p>
                </div>
                <button
                    onClick={fetchPendingQueue}
                    className="btn bg-surface border border-border p-3 rounded-2xl hover:bg-white/5 group transition-all"
                    title="Refresh Queue"
                >
                    <RefreshCw size={20} className={`text-text-secondary group-hover:text-accent ${queueLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Live Queue Card */}
            <div className="glass-card overflow-hidden border-orange-500/20 relative">
                <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Live Flow</span>
                    </div>
                </div>
                <div className="p-6 pb-2 border-b border-white/5">
                    <h2 className="text-lg font-bold text-text-primary">Active Unpaid Patients</h2>
                    <p className="text-xs text-text-secondary mb-4 italic">Patients waiting at the cashier desk for settlement</p>
                </div>
                <div className="overflow-x-auto">
                    {queueLoading ? (
                        <div className="flex items-center justify-center h-32 text-text-secondary text-sm">Loading queue...</div>
                    ) : pendingQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle size={28} className="text-emerald-500" />
                            </div>
                            <h3 className="text-base font-bold text-text-primary">Queue Clear</h3>
                            <p className="text-xs text-text-secondary">All processed patients have been cleared.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-3 text-left">Patient</th>
                                    <th className="px-6 py-3 text-left">Departments</th>
                                    <th className="px-6 py-3 text-right">Total Due</th>
                                    <th className="px-6 py-3 text-left">Waiting</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pendingQueue.map((row, i) => {
                                    const mins = Math.floor((new Date() - new Date(row.lastRequest)) / (1000 * 60));
                                    const rowId = row.id || row.patientId || i;
                                    return (
                                        <tr key={rowId} className="hover:bg-white/[0.03] transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white text-sm">{row.firstName || 'Unknown'} {row.lastName || ''}</p>
                                                <p className="text-[10px] text-white/40 font-mono">{row.patientNumber || 'No ID'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(row.departments || '').split(', ').filter(Boolean).map(d => (
                                                        <span key={d} className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${DEPT_COLORS[d] || 'bg-white/10 text-white/60 border-white/10'}`}>{d}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-white">{fmt(row.totalAmount || 0)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} className={mins > 60 ? 'text-red-400' : 'text-emerald-400'} />
                                                    <span className="text-xs font-bold text-white/70">{mins}m</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleSelectPatient(rowId)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${selectedPatientId === String(rowId) ? 'bg-accent text-white shadow-lg' : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'}`}
                                                >
                                                    {selectedPatientId === String(rowId) ? 'Selected ✓' : 'Select Patient'}
                                                    <ArrowRight size={11} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Search + Bills Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Manual Search Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6 border-indigo-500/10 bg-indigo-500/5">
                        <h3 className="text-xs font-black text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Filter size={14} /> Manual Search
                        </h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search patient..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-xs outline-none focus:border-accent transition-all text-white placeholder:text-gray-500"
                                />
                            </div>
                            <div className="form-group border border-border bg-surface rounded-xl overflow-hidden px-2">
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        setSelectedPatientId(id);
                                        if (id) fetchUnpaidBills(id);
                                    }}
                                    className="w-full py-3 bg-transparent text-xs text-white outline-none"
                                >
                                    <option value="" className="bg-surface text-gray-400 italic">-- Quick Link --</option>
                                    {filteredPatients.map(p => (
                                        <option key={p.id} value={p.id} className="bg-surface text-white">
                                            {p.patientNumber} - {p.firstName} {p.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 mt-4">
                                <div className="flex gap-3">
                                    <Info size={15} className="text-accent shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                        Use manual search if a patient presented a request slip but isn't visible in the live flow yet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Bills */}
                <div className="lg:col-span-3">
                    {selectedPatientId ? (
                        <div className="glass-card overflow-hidden border-accent/20">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-text-primary flex items-center gap-2">
                                        <Receipt size={18} className="text-accent" /> Detailed Bill Breakdown
                                    </h2>
                                    <p className="text-[10px] text-text-secondary mt-0.5 uppercase tracking-widest">Check items to include in this receipt</p>
                                </div>
                                <span className="text-[10px] font-black bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                                    {unpaidBills.length} PENDING
                                </span>
                            </div>
                            {loading ? (
                                <div className="flex items-center justify-center h-40 text-text-secondary text-sm">Loading bills...</div>
                            ) : unpaidBills.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                                    <AlertCircle size={28} className="text-white/20" />
                                    <p className="text-sm text-text-secondary">No unpaid bills found for this patient.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 bg-white/[0.02]">
                                                <th className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBills.length === unpaidBills.length && unpaidBills.length > 0}
                                                        onChange={toggleAll}
                                                        className="rounded"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left">Date</th>
                                                <th className="px-4 py-3 text-left">Dept</th>
                                                <th className="px-4 py-3 text-left">Description</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {unpaidBills.map((bill) => {
                                                const isChecked = selectedBills.includes(bill.uid);
                                                const badgeCls = DEPT_COLORS[bill.department] || 'bg-white/10 text-white/60 border-white/10';
                                                const dateVal = bill.billDate || bill.procedureDate || bill.admissionDate || bill.consultationDate || bill.createdAt;
                                                return (
                                                    <tr
                                                        key={bill.uid}
                                                        className={`transition-colors cursor-pointer ${isChecked ? 'bg-accent/5' : 'hover:bg-white/[0.03]'}`}
                                                        onClick={() => toggleBill(bill.uid)}
                                                    >
                                                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleBill(bill.uid)}
                                                                className="rounded"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4 text-white/60 text-xs">
                                                            {dateVal ? new Date(dateVal).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeCls}`}>
                                                                {bill.department}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-white font-medium text-xs">{bill.description || 'General Bill'}</td>
                                                        <td className="px-4 py-4 text-right font-black text-white">{fmt(bill.netAmount || bill.totalAmount || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card h-[400px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                                <UserPlus className="text-white/20" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Selection Required</h3>
                            <p className="text-xs text-text-secondary max-w-xs mt-2">
                                Choose a patient from the queue above or use manual search to load their outstanding bills.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Footer */}
            {selectedBills.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
                    <div className="glass-card p-4 shadow-2xl border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between">
                        <div className="flex items-center gap-6 pl-4">
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Items Selected</p>
                                <p className="text-xl font-black text-white">{selectedBills.length} <span className="text-xs font-medium text-white/50">bills</span></p>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Total Payable</p>
                                <p className="text-2xl font-black text-white">{fmt(totalSelectedAmount)}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleProceedToPayment}
                            className="bg-accent text-white px-8 py-4 rounded-2xl font-black text-sm hover:opacity-90 hover:translate-y-[-2px] hover:shadow-xl transition-all flex items-center gap-3"
                        >
                            Process &amp; Clear Bills
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLedger;
