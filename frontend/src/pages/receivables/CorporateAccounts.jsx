import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, CreditCard, Wallet, ArrowUpRight, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';

const CorporateAccounts = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAccounts();
    }, [statusFilter]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const response = await api.get('/receivables/corporate', { params });
            setAccounts(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching corporate accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(account =>
        account.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Corporate Accounts</h1>
                    <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-primary" />
                        Manage company and employer billing portfolios
                    </p>
                </div>

                <button
                    onClick={() => navigate('/app/receivables/corporate/new')}
                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,0,204,0.3)] group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Initialize Account
                </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-sm">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Total Portfolios</p>
                    <p className="text-3xl font-black text-white">{accounts.length}</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-sm">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Active Accounts</p>
                    <p className="text-3xl font-black text-green-500">{accounts.filter(a => a.status === 'active').length}</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-sm md:col-span-2">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Total Receivables</p>
                    <p className="text-3xl font-black text-primary">
                        K {accounts.reduce((sum, a) => sum + parseFloat(a.outstandingBalance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-black/40 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-sm p-2">
                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 p-6 bg-white/[0.02] m-2 rounded-[2rem] border border-white/5">
                    <div className="relative flex-1 group">
                        <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH PORTFOLIOS BY NAME OR NUMBER..."
                            className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/10 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-white/5 border border-white/10 rounded-full py-3.5 px-8 text-[11px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[180px] cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all" className="bg-bg-primary text-white">ALL STATUS</option>
                        <option value="active" className="bg-bg-primary text-green-500">ACTIVE ONLY</option>
                        <option value="suspended" className="bg-bg-primary text-highlight">SUSPENDED</option>
                        <option value="inactive" className="bg-bg-primary text-white/40">INACTIVE</option>
                    </select>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-8">Account Details</th>
                                <th className="p-8">Contact Info</th>
                                <th className="p-8 text-right">Credit Ceiling</th>
                                <th className="p-8 text-right">Outstanding</th>
                                <th className="p-8">Status</th>
                                <th className="p-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-white/70">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center">Synchronizing Ledger...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                                <SearchX className="w-10 h-10 text-white/10" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-white uppercase tracking-tighter">No accounts found</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-2">Adjust your filters or reset search</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5 group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 transition-all">
                                                    <Building2 className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-white uppercase tracking-tight">{account.companyName}</p>
                                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest font-mono mt-0.5">{account.accountNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-1">
                                                <p className="text-white font-black uppercase tracking-tight">{account.contactPerson || '-'}</p>
                                                <p className="text-[10px] text-white/30 font-bold tracking-wider">{account.phone || 'No direct phone'}</p>
                                            </div>
                                        </td>
                                        <td className="p-8 text-right tabular-nums text-white/40 font-mono">
                                            K{parseFloat(account.creditLimit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-8 text-right tabular-nums font-black text-white bg-white/[0.01]">
                                            <div className="flex items-center justify-end gap-2 text-lg">
                                                K{parseFloat(account.outstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors" />
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${account.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    account.status === 'suspended' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        'bg-white/5 text-white/20 border-white/10'
                                                }`}>
                                                {account.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <button
                                                className="px-6 py-2 bg-white/5 hover:bg-primary text-[9px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white rounded-full border border-white/10 hover:border-primary transition-all active:scale-95"
                                                onClick={() => navigate(`/app/receivables/corporate/${account.id}`)}
                                            >
                                                Analyze
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CorporateAccounts;
