import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { FileText, Search, Filter } from 'lucide-react';

const JournalEntries = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
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
            // Assuming apiService has a flexible get method or we use raw axios if not
            // If api.ledger doesn't exist, we might need to add it or use api.get
            const response = await api.get('/ledger/journal-entries', { params });

            // Adjust based on actual API response structure (ledgerController returns { data, total, ... })
            setEntries(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to load journal entries:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
                    <p className="text-gray-600 mt-1">General Ledger Transactions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 flex gap-4">
                <div className="max-w-xs w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        No journal entries found
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{new Date(entry.entryDate).toLocaleDateString()}</td>
                                        <td className="font-mono text-sm">{entry.entryNumber}</td>
                                        <td>
                                            <div className="font-medium">{entry.description}</div>
                                            <div className="text-xs text-gray-500 mt-1">
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
