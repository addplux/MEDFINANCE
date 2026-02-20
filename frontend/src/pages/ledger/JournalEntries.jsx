import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/apiClient';
import { ledgerAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import { FileText, Search, Filter, Plus, Send } from 'lucide-react';

const JournalEntries = () => {
    const { addToast } = useToast();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postingId, setPostingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

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

            // Adjust based on actual API response structure (ledgerController returns { data, total, ... })
            setEntries(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to load journal entries:', error);
            addToast('error', 'Failed to load journal entries');
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (id) => {
        if (!window.confirm('Are you sure you want to post this journal entry to the ledger? This action cannot be undone.')) {
            return;
        }

        setPostingId(id);
        try {
            await api.post(`/ledger/journals/${id}/post`);
            addToast('success', 'Journal entry posted successfully.');
            loadEntries(); // Refresh the list
        } catch (error) {
            console.error('Failed to post journal entry:', error);
            addToast('error', error.response?.data?.error || 'Failed to post journal entry.');
        } finally {
            setPostingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Journal Entries</h1>
                    <p className="text-sm text-text-secondary mt-1">General Ledger Transactions</p>
                </div>
                <Link
                    to="/app/ledger/journal-entries/new"
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Journal Entry
                </Link>
            </div>

            {/* Filters */}
            <div className="card p-4 flex gap-4">
                <div className="max-w-xs w-full">
                    <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select w-full"
                    >
                        <option value="">All Statuses</option>
                        <option value="posted">Posted</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Entries Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table min-w-[800px]">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Entry Number</th>
                                <th>Description</th>
                                <th>Reference</th>
                                <th className="text-right">Debit</th>
                                <th className="text-right">Credit</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-text-secondary">
                                        No journal entries found
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="text-text-secondary">{new Date(entry.entryDate).toLocaleDateString()}</td>
                                        <td className="font-mono text-sm font-medium">{entry.entryNumber}</td>
                                        <td>
                                            <div className="font-medium text-text-primary">{entry.description}</div>
                                            <div className="text-xs text-text-secondary mt-1">
                                                Created by: {entry.creator?.firstName} {entry.creator?.lastName}
                                            </div>
                                        </td>
                                        <td className="text-sm">{entry.reference || '-'}</td>
                                        <td className="text-right font-mono">
                                            {Number(entry.totalDebit).toLocaleString()}
                                        </td>
                                        <td className="text-right font-mono">
                                            {Number(entry.totalCredit).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`badge ${entry.status === 'posted' ? 'badge-success' : 'badge-warning'}`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td>
                                            {entry.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePost(entry.id)}
                                                    disabled={postingId === entry.id}
                                                    className="btn btn-sm btn-primary flex items-center gap-2"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    {postingId === entry.id ? 'Posting...' : 'Post to Ledger'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="card-footer flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                                className="btn btn-sm btn-secondary"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                                className="btn btn-sm btn-secondary"
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
