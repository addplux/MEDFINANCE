import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fundAPI, ledgerAPI } from '../../services/apiService';
import { ArrowLeft, Plus, Download, Upload, Clock, CreditCard, RefreshCw } from 'lucide-react';

const FundDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [fund, setFund] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionType, setTransactionType] = useState('deposit');
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        referenceNumber: '',
        offsetAccountId: '',
        transactionDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fundRes, accRes] = await Promise.all([
                fundAPI.getById(id),
                ledgerAPI.accounts.getAll()
            ]);
            setFund(fundRes.data);
            const allAccs = accRes.data.data || accRes.data;
            // Bank/Cash accounts for offset
            setAccounts(allAccs.filter(a => ['asset'].includes(a.accountType)));
        } catch (error) {
            console.error('Failed to load fund details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            await fundAPI.createTransaction(id, {
                ...formData,
                transactionType,
                amount: parseFloat(formData.amount)
            });
            setShowTransactionModal(false);
            setFormData({
                amount: '',
                description: '',
                referenceNumber: '',
                offsetAccountId: '',
                transactionDate: new Date().toISOString().split('T')[0]
            });
            loadData();
        } catch (error) {
            alert('Failed to record transaction: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading || !fund) return <div className="p-12 text-center text-text-secondary">Loading fund data...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/funds')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight">{fund.fundName}</h1>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{fund.fundCode} • {fund.fundType}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setTransactionType('deposit'); setShowTransactionModal(true); }}
                        className="btn btn-primary"
                    >
                        <Upload className="w-4 h-4 mr-2" /> Deposit
                    </button>
                    <button 
                        onClick={() => { setTransactionType('withdrawal'); setShowTransactionModal(true); }}
                        className="btn btn-secondary border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                    >
                        <Download className="w-4 h-4 mr-2" /> Withdrawal
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-white/10">
                    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" /> Current Balance
                    </div>
                    <div className="text-3xl font-black text-emerald-400">K {parseFloat(fund.balance).toLocaleString()}</div>
                </div>
                <div className="glass-card p-6 border-white/10">
                    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                        <RefreshCw className="w-4 h-4 text-blue-400" /> Linked GL Account
                    </div>
                    <div className="font-bold text-white text-lg">
                        {fund.account ? `${fund.account.accountCode} - ${fund.account.accountName}` : 'No Link'}
                    </div>
                </div>
                <div className="glass-card p-6 border-white/10">
                    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" /> Last Activity
                    </div>
                    <div className="font-bold text-white text-lg">
                        {fund.transactions?.[0] ? new Date(fund.transactions[0].transactionDate).toLocaleDateString() : 'Never'}
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="glass-card overflow-hidden border-white/10">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Recent Transactions</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Date</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Type</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Description / Reference</th>
                            <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {fund.transactions?.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 text-center">
                                    <div className="font-bold text-white uppercase text-xs">{new Date(tx.transactionDate).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter ${
                                        tx.transactionType === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                        {tx.transactionType}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-white font-medium">{tx.description}</div>
                                    <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{tx.referenceNumber || 'No Reference'}</div>
                                </td>
                                <td className={`p-4 text-right font-black ${tx.transactionType === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tx.transactionType === 'deposit' ? '+' : '-'}K {parseFloat(tx.amount).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md border-white/20 shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Record {transactionType}</h2>
                        </div>
                        <form onSubmit={handleTransaction} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1">Amount (K) *</label>
                                <input 
                                    type="number" 
                                    className="modal-input" 
                                    required 
                                    value={formData.amount}
                                    onChange={e => setFormData({...formData, amount: e.target.value})}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1">Description *</label>
                                <textarea 
                                    className="modal-input" 
                                    required 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    rows="2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1">Reference</label>
                                    <input 
                                        type="text" 
                                        className="modal-input" 
                                        value={formData.referenceNumber}
                                        onChange={e => setFormData({...formData, referenceNumber: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        className="modal-input" 
                                        value={formData.transactionDate}
                                        onChange={e => setFormData({...formData, transactionDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            {fund.accountId && (
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-1">Offset GL Account *</label>
                                    <select 
                                        className="modal-input" 
                                        required 
                                        value={formData.offsetAccountId}
                                        onChange={e => setFormData({...formData, offsetAccountId: e.target.value})}
                                    >
                                        <option value="">Select Bank / Cash Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.accountCode} - {acc.accountName}</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-text-secondary mt-1 uppercase font-bold">This account will be debited for deposits or credited for withdrawals.</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowTransactionModal(false)} className="btn btn-ghost text-[10px] font-black uppercase">Cancel</button>
                                <button type="submit" className="btn btn-primary text-[10px] font-black uppercase">Record Transaction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FundDetail;
