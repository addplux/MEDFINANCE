import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, patientAPI } from '../../services/apiService';
import {
    Search, ArrowRight, AlertCircle, Clock, CheckCircle,
    Receipt, UserPlus, RefreshCw, Filter, Wallet, Info
} from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';

const fmt = (n) => `ZK ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
            setSelectedBills(response.data?.map(b => b.id) || []);
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

    // Columns for Live Queue
    const queueColumns = [
        {
            field: 'patient',
            headerName: 'Patient Name',
            flex: 1.5,
            renderCell: (params) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-[11px] font-bold text-orange-400 shrink-0 border border-orange-500/30">
                        {params.row.firstName[0]}{params.row.lastName[0]}
                    </div>
                    <div className="truncate">
                        <div className="font-bold text-white text-sm leading-tight">{params.row.firstName} {params.row.lastName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{params.row.patientNumber}</div>
                    </div>
                </div>
            )
        },
        {
            field: 'departments',
            headerName: 'Departments',
            flex: 1.2,
            renderCell: (params) => (
                <div className="flex flex-wrap gap-1">
                    {params.value.split(', ').map(d => (
                        <span key={d} className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-[9px] font-black text-white uppercase tracking-wider">
                            {d}
                        </span>
                    ))}
                </div>
            )
        },
        {
            field: 'totalAmount',
            headerName: 'Total Due',
            flex: 1,
            renderCell: (params) => (
                <span className="font-black text-amber-400">{fmt(params.value)}</span>
            )
        },
        {
            field: 'wait_time',
            headerName: 'Waiting',
            flex: 0.8,
            renderCell: (params) => {
                const mins = Math.floor((new Date() - new Date(params.row.lastRequest)) / (1000 * 60));
                return (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                        <Clock size={12} className={mins > 60 ? 'text-red-400' : 'text-emerald-400'} />
                        <span className="text-[11px] font-medium">{mins}m</span>
                    </div>
                );
            }
        },
        {
            field: 'action',
            headerName: '',
            sortable: false,
            width: 120,
            renderCell: (params) => (
                <button
                    onClick={() => handleSelectPatient(params.row.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${selectedPatientId === String(params.row.id) ? 'bg-orange-500 text-white' : 'bg-surface border border-border text-text-secondary hover:bg-white/5'}`}
                >
                    {selectedPatientId === String(params.row.id) ? 'Selected' : 'View Bill'}
                    <ArrowRight size={12} />
                </button>
            )
        }
    ];

    // Columns for Detailed Bills
    const billColumns = [
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 100,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            field: 'department',
            headerName: 'Dept',
            width: 100,
            renderCell: (params) => (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-bold uppercase border border-white/20 tracking-wider">
                    {params.value}
                </span>
            )
        },
        {
            field: 'description',
            headerName: 'Service Description',
            flex: 1.5,
            renderCell: (params) => (
                <span className="text-sm font-medium text-white">{params.value || 'General Bill'}</span>
            )
        },
        {
            field: 'amount',
            headerName: 'Amount',
            flex: 1,
            renderCell: (params) => (
                <span className="font-black text-white">
                    {fmt(params.row.netAmount || params.row.totalAmount || 0)}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6 pb-32 animate-fade-in">
            {/* Header Section */}
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPendingQueue}
                        className="btn bg-surface border border-border p-3 rounded-2xl hover:bg-white/5 group transition-all"
                        title="Refresh Queue"
                    >
                        <RefreshCw size={20} className={`text-text-secondary group-hover:text-accent ${queueLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Live Queue Container */}
            <div className="glass-card overflow-hidden border-orange-500/20 relative">
                <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Live Flow</span>
                    </div>
                </div>

                <div className="p-6 pb-2 border-b border-white/5">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        Active Unpaid Patients
                    </h2>
                    <p className="text-xs text-text-secondary mb-4 italic">Patients waiting at the cashier desk for settlement</p>
                </div>

                <div className="h-[450px] w-full">
                    <DataGrid
                        rows={pendingQueue}
                        columns={queueColumns}
                        loading={queueLoading}
                        disableSelectionOnClick
                        getRowHeight={() => 'auto'}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: '#ffffff',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                py: 2
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.03)'
                            }
                        }}
                        components={{
                            NoRowsOverlay: () => (
                                <div className="flex flex-col items-center justify-center h-full space-y-3 p-8">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                        <CheckCircle size={32} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary">Queue Clear</h3>
                                    <p className="text-sm text-text-secondary">All processed patients have been cleared.</p>
                                </div>
                            )
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Manual Search Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6 border-indigo-500/10 bg-indigo-500/5">
                        <h3 className="text-xs font-black text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Filter size={14} />
                            Manual Search
                        </h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Master Patient List..."
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

                            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 mt-6">
                                <div className="flex gap-3">
                                    <Info size={16} className="text-accent shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                        Use manual search if a patient presented a request slip but isn't visible in the live flow yet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed View - Table 2 */}
                <div className="lg:col-span-3">
                    {selectedPatientId ? (
                        <div className="glass-card overflow-hidden border-accent/20">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2">
                                <div>
                                    <h2 className="font-bold text-text-primary flex items-center gap-2">
                                        <Receipt size={18} className="text-accent" />
                                        Detailed Bill Breakdown
                                    </h2>
                                    <p className="text-[10px] text-text-secondary mt-0.5 uppercase tracking-widest">Select items to include in this receipt</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                                        {unpaidBills.length} PENDING ITEMS
                                    </span>
                                </div>
                            </div>

                            <div className="h-[450px] w-full">
                                <DataGrid
                                    rows={unpaidBills}
                                    columns={billColumns}
                                    loading={loading}
                                    checkboxSelection
                                    getRowHeight={() => 'auto'}
                                    onSelectionModelChange={(newSelection) => {
                                        setSelectedBills(newSelection);
                                    }}
                                    selectionModel={selectedBills}
                                    getRowId={(row) => row.id}
                                    sx={{
                                        border: 'none',
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            color: '#ffffff',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                        },
                                        '& .MuiDataGrid-cell': {
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                            color: '#ffffff',
                                            py: 1.5
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card h-[400px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5 bg-white/1">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                                <UserPlus className="text-white/20" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Selection Required</h3>
                            <p className="text-xs text-text-secondary max-w-xs mt-2">
                                Choose a patient record to verify outstanding departmental balances and generate receipts.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Sticky Footer */}
            {selectedBills.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
                    <div className="glass-card p-4 shadow-2xl shadow-accent/20 border-accent/30 bg-surface/90 backdrop-blur-xl flex items-center justify-between">
                        <div className="flex items-center gap-6 pl-4">
                            <div>
                                <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-1">Items Selected</p>
                                <p className="text-xl font-black text-text-primary">{selectedBills.length} <span className="text-xs font-medium text-text-secondary">bills</span></p>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest leading-none mb-1">Total Payable</p>
                                <p className="text-2xl font-black text-text-primary">{fmt(totalSelectedAmount)}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleProceedToPayment}
                            className="bg-accent text-white px-8 py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] hover:shadow-xl hover:shadow-accent/40 active:translate-y-[1px] transition-all flex items-center gap-3"
                        >
                            Process Payment
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLedger;
