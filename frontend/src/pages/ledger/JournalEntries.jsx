import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';
import { ledgerAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
    FileText, Search, Filter, Plus, Send,
    ChevronDown, ChevronRight, Calendar,
    Hash, User, ArrowUpRight, ArrowDownRight,
    Activity, Clock, CheckCircle2, MoreHorizontal
} from 'lucide-react';

const JournalEntries = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postingId, setPostingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedEntry, setExpandedEntry] = useState(null);

    useEffect(() => {
        loadEntries();
    }, [currentPage, statusFilter]);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 20,
                status: statusFilter || undefined
            };
            const response = await ledgerAPI.journals.getAll(params);
            setEntries(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to load journal entries:', error);
            addToast('error', 'Failed to load journal entries');
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e, id) => {
        e.stopPropagation(); // Don't expand row when clicking Post
        if (!window.confirm('Are you sure you want to post this journal entry to the ledger? This action cannot be undone.')) {
            return;
        }

        setPostingId(id);
        try {
            await api.post(`/ledger/journals/${id}/post`);
            addToast('success', 'Journal entry posted successfully.');
            loadEntries();
        } catch (error) {
            console.error('Failed to post journal entry:', error);
            addToast('error', error.response?.data?.error || 'Failed to post journal entry.');
        } finally {
            setPostingId(null);
        }
    };

    const toggleExpand = (id) => {
        setExpandedEntry(expandedEntry === id ? null : id);
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-2xl">
                            <FileText className="text-accent" size={32} />
                        </div>
                        General Ledger Journals
                    </h1>
                    <p className="text-sm text-text-secondary mt-1 ml-14">System-wide double-entry transaction record</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/app/ledger/journal-entries/new"
                        className="btn bg-accent text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Entry
                    </Link>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                    {[
                        { id: '', label: 'All Entries', icon: Activity },
                        { id: 'draft', label: 'Drafts', icon: Clock },
                        { id: 'posted', label: 'Posted', icon: CheckCircle2 },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === tab.id ? 'bg-accent text-white shadow-lg' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search reference or description..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-white placeholder:text-white/20"
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="glass-card overflow-hidden border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-white/10">
                                <th className="py-4 pl-6 pr-3 w-10"></th>
                                <th className="py-4 px-3">Date & Number</th>
                                <th className="py-4 px-3">Narrative</th>
                                <th className="py-4 px-3 text-right">Debit Balance</th>
                                <th className="py-4 px-3 text-right">Credit Balance</th>
                                <th className="py-4 px-3">Status</th>
                                <th className="py-4 pl-3 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                                            <span className="text-xs font-black uppercase tracking-widest text-text-secondary">Syncing Ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-text-secondary opacity-40">
                                            <Hash size={48} />
                                            <p className="text-sm font-bold tracking-tight">No Journal Entries Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <React.Fragment key={entry.id}>
                                        <tr
                                            onClick={() => toggleExpand(entry.id)}
                                            className={`group hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedEntry === entry.id ? 'bg-white/[0.03]' : ''}`}
                                        >
                                            <td className="py-4 pl-6 pr-3">
                                                {expandedEntry === entry.id ? <ChevronDown size={16} className="text-accent" /> : <ChevronRight size={16} className="text-text-secondary" />}
                                            </td>
                                            <td className="py-4 px-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(entry.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="font-mono text-xs font-bold text-text-primary tracking-wider uppercase mt-0.5">
                                                        {entry.entryNumber}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-3">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text-primary text-sm truncate max-w-[200px]">
                                                        {entry.description}
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5">
                                                        <Hash size={10} /> {entry.reference || 'No Ref'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-3 text-right">
                                                <span className="font-black text-emerald-400">
                                                    K {Number(entry.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="py-4 px-3 text-right">
                                                <span className="font-black text-rose-400">
                                                    K {Number(entry.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${entry.status === 'posted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${entry.status === 'posted' ? 'bg-emerald-400' : 'bg-amber-400'} ${entry.status === 'draft' ? 'animate-pulse' : ''}`} />
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td className="py-4 pl-3 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {entry.status === 'draft' && (
                                                        <button
                                                            onClick={(e) => handlePost(e, entry.id)}
                                                            disabled={postingId === entry.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            {postingId === entry.id ? (
                                                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <Send size={12} />
                                                            )}
                                                            Post
                                                        </button>
                                                    )}
                                                    <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Detail View */}
                                        {expandedEntry === entry.id && (
                                            <tr className="bg-white/[0.04] border-l-2 border-l-accent animate-in slide-in-from-top-2 duration-300">
                                                <td colSpan="7" className="p-6">
                                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                                        <div className="lg:col-span-1 space-y-4">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Created By</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                                                        <User size={14} />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-text-primary capitalize">
                                                                        {entry.creator?.firstName} {entry.creator?.lastName}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Reference ID</p>
                                                                <p className="text-xs font-mono text-text-primary">{entry.id}</p>
                                                            </div>
                                                        </div>
                                                        <div className="lg:col-span-3">
                                                            <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/5">
                                                                <table className="w-full text-left text-xs">
                                                                    <thead>
                                                                        <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-text-secondary border-b border-white/5">
                                                                            <th className="py-2 px-4">Account Code & Name</th>
                                                                            <th className="py-2 px-4">Line Memo</th>
                                                                            <th className="py-2 px-4 text-right">Debit</th>
                                                                            <th className="py-2 px-4 text-right">Credit</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-white/5">
                                                                        {entry.lines?.map((line, idx) => (
                                                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                                                <td className="py-2.5 px-4 font-bold">
                                                                                    <span className="text-[10px] text-text-secondary font-mono mr-2">{line.account?.accountCode}</span>
                                                                                    {line.account?.accountName}
                                                                                </td>
                                                                                <td className="py-2.5 px-4 text-text-secondary text-[11px] italic">
                                                                                    {line.description || '-'}
                                                                                </td>
                                                                                <td className="py-2.5 px-4 text-right font-mono text-emerald-400/80">
                                                                                    {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                                                                                </td>
                                                                                <td className="py-2.5 px-4 text-right font-mono text-rose-400/80">
                                                                                    {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white/5 p-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JournalEntries;
