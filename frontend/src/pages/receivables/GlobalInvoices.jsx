import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, Download, Eye, FileSpreadsheet, 
    CheckCircle, XCircle, Clock, UploadCloud, 
    ChevronLeft, ChevronRight, Hash, Building2
} from 'lucide-react';
import { receivablesAPI } from '../../services/apiService';
import { toast } from 'react-hot-toast';

const GlobalInvoices = ({ defaultStatus = '' }) => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [filters, setFilters] = useState({
        status: defaultStatus,
        schemeId: '',
        search: ''
    });

    const [schemes, setSchemes] = useState([]);

    useEffect(() => {
        setFilters(prev => ({ ...prev, status: defaultStatus }));
    }, [defaultStatus]);

    useEffect(() => {
        fetchSchemes();
        fetchInvoices();
    }, [page, filters.status, filters.schemeId]);

    const fetchSchemes = async () => {
        try {
            const response = await receivablesAPI.schemes.getAll();
            setSchemes(response.data);
        } catch (error) {
            console.error('Error fetching schemes:', error);
        }
    };

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 15,
                status: filters.status || undefined,
                schemeId: filters.schemeId || undefined,
            };
            const response = await receivablesAPI.schemes.getAllInvoices(params);
            setInvoices(response.data.data);
            setTotal(response.data.total);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await receivablesAPI.schemes.updateInvoiceStatus(id, newStatus);
            toast.success(`Invoice marked as ${newStatus}`);
            fetchInvoices();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleExportWOHMS = async (id, invoiceNo) => {
        try {
            toast.loading('Preparing professional export...', { id: 'export' });
            const response = await receivablesAPI.schemes.exportWOHMS(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `WOHMS_Export_${invoiceNo}.xlsx`);
            document.body.appendChild(link);
            link.click();
            toast.success('Export downloaded', { id: 'export' });
        } catch (error) {
            toast.error('Failed to export', { id: 'export' });
        }
    };

    const getStatusStyles = (status) => {
        const styles = {
            draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            final: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            sent: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
            uploaded: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
            approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
            paid: 'bg-green-500/10 text-green-500 border-green-500/20',
            cancelled: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        };
        return styles[status.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return <CheckCircle className="w-3 h-3" />;
            case 'rejected': return <XCircle className="w-3 h-3" />;
            case 'uploaded': return <UploadCloud className="w-3 h-3" />;
            case 'draft': return <Clock className="w-3 h-3" />;
            default: return <FileSpreadsheet className="w-3 h-3" />;
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in relative z-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-text-primary tracking-tighter uppercase mb-1 drop-shadow-sm">
                        Invoices Dashboard
                    </h1>
                    <p className="text-text-tertiary text-[10px] font-black uppercase tracking-[0.3em] ml-1">
                        Track submissions and professional exports
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[1.5rem] p-5 border border-border-color shadow-lg">
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-3">Total Submissions</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-base font-black text-text-primary tracking-tighter tabular-nums">{total}</h2>
                        <Hash className="w-5 h-5 text-primary opacity-20" />
                    </div>
                </div>
                <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[1.5rem] p-5 border border-border-color shadow-lg">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3">Approved</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-base font-black text-emerald-500 tracking-tighter tabular-nums">
                            {invoices.filter(i => i.status === 'approved').length}
                        </h2>
                        <CheckCircle className="w-5 h-5 text-emerald-500 opacity-20" />
                    </div>
                </div>
                <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[1.5rem] p-5 border border-border-color shadow-lg">
                    <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-3">Pending Review</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-base font-black text-yellow-500 tracking-tighter tabular-nums">
                            {invoices.filter(i => ['sent', 'uploaded'].includes(i.status)).length}
                        </h2>
                        <UploadCloud className="w-5 h-5 text-yellow-500 opacity-20" />
                    </div>
                </div>
                <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[1.5rem] p-5 border border-border-color shadow-lg">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3">Rejected</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-base font-black text-red-500 tracking-tighter tabular-nums">
                            {invoices.filter(i => i.status === 'rejected').length}
                        </h2>
                        <XCircle className="w-5 h-5 text-red-500 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[3rem] p-6 border border-border-color shadow-2xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="SEARCH INVOICE NO / PATIENT..."
                        className="w-full bg-bg-tertiary/50 border border-border-color rounded-[2rem] pl-16 pr-8 py-4 text-sm font-bold text-text-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-widest placeholder:text-text-tertiary/50"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <select 
                            className="w-full bg-bg-tertiary/50 border border-border-color rounded-[2rem] pl-14 pr-8 py-4 text-[10px] font-black text-text-secondary appearance-none cursor-pointer uppercase tracking-widest"
                            value={filters.schemeId}
                            onChange={(e) => setFilters({...filters, schemeId: e.target.value})}
                        >
                            <option value="">ALL SCHEMES</option>
                            {schemes.map(s => <option key={s.id} value={s.id}>{s.schemeName}</option>)}
                        </select>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <select 
                            className="w-full bg-bg-tertiary/50 border border-border-color rounded-[2rem] pl-14 pr-8 py-4 text-[10px] font-black text-text-secondary appearance-none cursor-pointer uppercase tracking-widest"
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                            <option value="">ALL STATUSES</option>
                            <option value="draft">DRAFT</option>
                            <option value="sent">SENT</option>
                            <option value="uploaded">UPLOADED</option>
                            <option value="approved">APPROVED</option>
                            <option value="rejected">REJECTED</option>
                            <option value="paid">PAID</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[3rem] shadow-2xl border border-border-color overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-[10px] text-text-tertiary uppercase font-black tracking-[0.2em] bg-bg-tertiary/50 border-b border-border-color">
                            <tr>
                                <th className="px-8 py-6">Invoice Details</th>
                                <th className="px-8 py-6">Payer Scheme</th>
                                <th className="px-8 py-6 text-right">Invoice Amount</th>
                                <th className="px-8 py-6">Submission Status</th>
                                <th className="px-8 py-6 text-center">External Portal</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-6"><div className="h-4 bg-bg-tertiary rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <FileSpreadsheet className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
                                        <p className="text-text-tertiary font-black uppercase tracking-widest text-xs">No invoices found</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-bg-secondary/40 transition-all group border-b border-border-color/30">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono font-black text-primary tracking-tight text-base leading-none">{inv.invoiceNumber}</span>
                                                <span className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">
                                                    Generated: {new Date(inv.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <Building2 className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="text-text-primary font-black uppercase tracking-widest text-[10px]">
                                                    {inv.scheme?.schemeName || 'Unknown Scheme'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-text-primary tabular-nums text-lg tracking-tighter">
                                            {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${getStatusStyles(inv.status)}`}>
                                                    {getStatusIcon(inv.status)}
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-2">
                                                {inv.status === 'sent' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(inv.id, 'uploaded')}
                                                        className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-cyan-500/20 transition-all"
                                                    >
                                                        Mark Uploaded
                                                    </button>
                                                )}
                                                {inv.status === 'uploaded' && (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(inv.id, 'approved')}
                                                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(inv.id, 'rejected')}
                                                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20 transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    onClick={() => navigate(`/app/receivables/invoices/${inv.id}`)}
                                                    className="p-3 bg-bg-tertiary/50 hover:bg-primary/10 text-text-tertiary hover:text-primary rounded-2xl transition-all shadow-sm border border-border-color"
                                                    title="View Matrix Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleExportWOHMS(inv.id, inv.invoiceNumber)}
                                                    className="p-3 bg-bg-tertiary/50 hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 rounded-2xl transition-all shadow-sm border border-border-color"
                                                    title="Professional WOHMS Export"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-bg-tertiary/20 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                        SHOWING PAGE {page} OF {totalPages} ({total} TOTAL INVOICES)
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            className="p-3 bg-bg-secondary hover:bg-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl border border-border-color transition-all"
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="w-5 h-5 text-text-secondary" />
                        </button>
                        <button 
                            className="p-3 bg-bg-secondary hover:bg-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl border border-border-color transition-all"
                            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="w-5 h-5 text-text-secondary" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalInvoices;
