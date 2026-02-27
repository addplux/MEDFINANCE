import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ledgerAPI } from '../../services/apiService';
import {
    BookOpen, Plus, Search, Eye, Edit, Trash2,
    ChevronRight, ChevronDown, FolderTree, Info,
    ArrowUpRight, ArrowDownRight, Hash, Activity
} from 'lucide-react';

const ACCOUNT_TYPE_CONFIG = {
    asset: { label: 'Assets', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    liability: { label: 'Liabilities', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    equity: { label: 'Equity', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    revenue: { label: 'Revenue', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    expense: { label: 'Expenses', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
};

const AccountRow = ({ account, depth = 0, onEdit, onDelete, onView }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = account.children && account.children.length > 0;
    const config = ACCOUNT_TYPE_CONFIG[account.accountType] || ACCOUNT_TYPE_CONFIG.asset;

    return (
        <>
            <tr className="group hover:bg-white/[0.02] transition-colors border-b border-white/5">
                <td className="py-4 pl-4 pr-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                        {hasChildren ? (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 hover:bg-white/10 rounded transition-colors text-text-secondary"
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : (
                            <div className="w-6" /> // Spacer
                        )}
                        <div className="flex flex-col">
                            <span className="font-mono text-[11px] text-text-secondary font-bold tracking-wider uppercase">
                                {account.accountCode}
                            </span>
                            <span className="font-semibold text-text-primary text-sm group-hover:text-accent transition-colors">
                                {account.accountName}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="py-4 px-3 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color} ${config.border}`}>
                        {account.accountType}
                    </span>
                </td>
                <td className="py-4 px-3 text-right">
                    <div className="flex flex-col items-end">
                        <span className="font-black text-text-primary">
                            K {Number(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {account.balance !== 0 && (
                            <span className={`text-[10px] flex items-center gap-1 ${account.balance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {account.balance > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {account.balance > 0 ? 'Debit' : 'Credit'}
                            </span>
                        )}
                    </div>
                </td>
                <td className="py-4 px-3 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${account.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                        {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="py-4 pl-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onView(account.id)} className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all"><Eye size={16} /></button>
                        <button onClick={() => onEdit(account.id)} className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all"><Edit size={16} /></button>
                        <button onClick={() => onDelete(account.id)} className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-all"><Trash2 size={16} /></button>
                    </div>
                </td>
            </tr>
            {isExpanded && hasChildren && account.children.map(child => (
                <AccountRow
                    key={child.id}
                    account={child}
                    depth={depth + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                />
            ))}
        </>
    );
};

const ChartOfAccounts = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const response = await ledgerAPI.accounts.getAll();
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to load accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this account and all its historical associations? This action is critical.')) return;
        try {
            await ledgerAPI.accounts.delete(id);
            loadAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    // Build the tree structure and group by type
    const accountTree = useMemo(() => {
        const tree = { asset: [], liability: [], equity: [], revenue: [], expense: [] };

        // Filter by search term first if any
        let filtered = accounts;
        if (searchTerm) {
            filtered = accounts.filter(a =>
                a.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.accountCode.includes(searchTerm)
            );
        }

        // Only top-level accounts go into the root of each type
        filtered.filter(a => !a.parentId).forEach(a => {
            if (tree[a.accountType]) {
                tree[a.accountType].push({
                    ...a,
                    children: accounts.filter(child => child.parentId === a.id)
                });
            }
        });

        return tree;
    }, [accounts, searchTerm]);

    const tabs = [
        { id: 'all', label: 'All Accounts', icon: FolderTree },
        { id: 'asset', label: 'Assets', icon: Activity },
        { id: 'liability', label: 'Liabilities', icon: Info },
        { id: 'revenue', label: 'Revenue', icon: ArrowUpRight },
        { id: 'expense', label: 'Expenses', icon: ArrowDownRight },
    ];

    return (
        <div className="space-y-6 pb-20 animate-fade-in text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-2xl">
                            <BookOpen className="text-accent" size={32} />
                        </div>
                        Chart of Accounts
                    </h1>
                    <p className="text-sm text-text-secondary mt-1 ml-14">Hierarchical financial structure for MedFinance360 Ledger</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/app/ledger/accounts/new"
                        className="btn bg-accent text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add New Account
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {['asset', 'liability', 'revenue', 'expense'].map(type => {
                    const config = ACCOUNT_TYPE_CONFIG[type];
                    const total = accounts
                        .filter(a => a.accountType === type)
                        .reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
                    return (
                        <div key={type} className={`glass-card p-4 border-l-4 ${config.border.replace('border-', 'border-l-')}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">{config.label}</p>
                            <p className="text-xl font-black">K {Math.abs(total).toLocaleString()}</p>
                        </div>
                    );
                })}
            </div>

            {/* Navigation & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-accent text-white shadow-lg' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
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
                        placeholder="Quick search code or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-white placeholder:text-text-secondary"
                    />
                </div>
            </div>

            {/* Main Ledger Table */}
            <div className="glass-card overflow-hidden border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-white/10">
                                <th className="py-4 pl-6 pr-3">Account & Identifier</th>
                                <th className="py-4 px-3 hidden lg:table-cell">Classification</th>
                                <th className="py-4 px-3 text-right">Current Ledger Balance</th>
                                <th className="py-4 px-3 hidden md:table-cell">Posting Status</th>
                                <th className="py-4 pl-3 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                                            <span className="text-xs font-black uppercase tracking-widest text-text-secondary">Syncing Ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : Object.keys(accountTree).every(type => accountTree[type].length === 0) ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-text-secondary opacity-40">
                                            <Hash size={48} />
                                            <p className="text-sm font-bold tracking-tight">No Financial Accounts Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                Object.keys(accountTree).map(type => (
                                    (activeTab === 'all' || activeTab === type) && accountTree[type].length > 0 && (
                                        <React.Fragment key={type}>
                                            <tr className="bg-white/[0.02]">
                                                <td colSpan="5" className="py-3 px-6">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${ACCOUNT_TYPE_CONFIG[type].color}`}>
                                                        {ACCOUNT_TYPE_CONFIG[type].label}
                                                    </span>
                                                </td>
                                            </tr>
                                            {accountTree[type].map(account => (
                                                <AccountRow
                                                    key={account.id}
                                                    account={account}
                                                    onEdit={(id) => navigate(`/app/ledger/accounts/${id}/edit`)}
                                                    onDelete={handleDelete}
                                                    onView={(id) => navigate(`/app/ledger/accounts/${id}`)}
                                                />
                                            ))}
                                        </React.Fragment>
                                    )
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChartOfAccounts;
