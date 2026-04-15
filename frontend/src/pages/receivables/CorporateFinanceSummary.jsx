import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, TrendingUp, TrendingDown, Clock, CheckCircle,
    XCircle, FileText, ChevronRight, Search, DollarSign
} from 'lucide-react';
import { receivablesAPI } from '../../services/apiService';

const CorporateFinanceSummary = () => {
    const navigate = useNavigate();
    const [schemes, setSchemes] = useState([]);
    const [invoicesMap, setInvoicesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch all schemes
                const schemesRes = await receivablesAPI.schemes.getAll();
                const allSchemes = (schemesRes.data || []).filter(
                    s => s.schemeType === 'Corporate'
                );
                setSchemes(allSchemes);

                // Fetch all invoices (no filter — all statuses)
                const invoicesRes = await receivablesAPI.schemes.getAllInvoices({ limit: 1000 });
                const allInvoices = invoicesRes.data?.data || [];

                // Group invoices by schemeId
                const grouped = {};
                allInvoices.forEach(inv => {
                    const sid = inv.schemeId;
                    if (!grouped[sid]) grouped[sid] = [];
                    grouped[sid].push(inv);
                });
                setInvoicesMap(grouped);
            } catch (err) {
                console.error('Failed to load corporate finance data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calcStats = (schemeId) => {
        const invs = invoicesMap[schemeId] || [];
        const total = invs.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
        const paid = invs
            .filter(i => i.status === 'paid')
            .reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
        const rejected = invs
            .filter(i => i.status === 'rejected')
            .reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
        const outstanding = total - paid - rejected;
        return {
            total, paid, outstanding, rejected,
            count: invs.length,
            approvedCount: invs.filter(i => i.status === 'approved').length,
            rejectedCount: invs.filter(i => i.status === 'rejected').length,
            pendingCount: invs.filter(i => ['draft','sent','uploaded','final'].includes(i.status)).length,
        };
    };

    const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const filteredSchemes = schemes.filter(s =>
        s.schemeName?.toLowerCase().includes(search.toLowerCase())
    );

    // Grand totals
    const grandTotal = filteredSchemes.reduce((acc, s) => acc + calcStats(s.id).total, 0);
    const grandPaid = filteredSchemes.reduce((acc, s) => acc + calcStats(s.id).paid, 0);
    const grandOutstanding = filteredSchemes.reduce((acc, s) => acc + calcStats(s.id).outstanding, 0);

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase drop-shadow-sm">
                        Corporate Finance
                    </h1>
                    <p className="text-text-tertiary text-xs font-black uppercase tracking-[0.3em] mt-1 ml-1">
                        Per-scheme billing summary & receivables
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="SEARCH SCHEME..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-bg-secondary/40 backdrop-blur border border-border-color rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-text-primary uppercase tracking-widest placeholder:text-text-tertiary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Grand Totals Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Billed', value: grandTotal, color: 'text-text-primary', icon: DollarSign, bg: 'bg-primary/5 border-primary/20' },
                    { label: 'Total Paid', value: grandPaid, color: 'text-emerald-500', icon: CheckCircle, bg: 'bg-emerald-500/5 border-emerald-500/20' },
                    { label: 'Total Outstanding', value: grandOutstanding, color: 'text-amber-500', icon: Clock, bg: 'bg-amber-500/5 border-amber-500/20' },
                ].map(card => (
                    <div key={card.label} className={`${card.bg} backdrop-blur-md rounded-[2rem] p-7 border shadow-xl`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${card.color} opacity-70`}>{card.label}</p>
                        <div className="flex items-end justify-between">
                            <h2 className={`text-3xl font-black tracking-tighter tabular-nums ${card.color}`}>
                                {loading ? '—' : fmt(card.value)}
                            </h2>
                            <card.icon className={`w-8 h-8 ${card.color} opacity-20`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Per-Scheme Table */}
            <div className="bg-bg-secondary/40 backdrop-blur-md rounded-[2.5rem] border border-border-color shadow-2xl overflow-hidden">
                <div className="px-8 py-5 border-b border-border-color bg-bg-tertiary/20 flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary opacity-60" />
                    <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">Corporate Scheme Breakdown</h3>
                    <span className="ml-auto text-[10px] font-black text-text-tertiary opacity-60 uppercase tracking-widest">
                        {filteredSchemes.length} schemes
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : filteredSchemes.length === 0 ? (
                    <div className="p-16 text-center">
                        <Building2 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
                        <p className="text-text-tertiary font-black uppercase tracking-widest text-xs">No Corporate Schemes Found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-[10px] text-text-tertiary uppercase font-black tracking-[0.18em] bg-bg-tertiary/40 border-b border-border-color">
                                <tr>
                                    <th className="px-8 py-5">Scheme</th>
                                    <th className="px-6 py-5 text-right">Total Billed</th>
                                    <th className="px-6 py-5 text-right">Paid</th>
                                    <th className="px-6 py-5 text-right">Outstanding</th>
                                    <th className="px-6 py-5 text-right">Rejected</th>
                                    <th className="px-6 py-5 text-center">Invoices</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                    <th className="px-6 py-5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color/40">
                                {filteredSchemes.map(scheme => {
                                    const stats = calcStats(scheme.id);
                                    const paidPct = stats.total > 0 ? (stats.paid / stats.total) * 100 : 0;
                                    return (
                                        <tr
                                            key={scheme.id}
                                            className="hover:bg-primary/5 transition-all group cursor-pointer"
                                            onClick={() => navigate(`/app/receivables/invoices?schemeId=${scheme.id}`)}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                                                        {scheme.schemeName?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-text-primary uppercase tracking-widest text-xs">{scheme.schemeName}</p>
                                                        <p className="text-[10px] text-text-tertiary font-bold mt-0.5">{scheme.schemeType}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black tabular-nums text-text-primary">
                                                {fmt(stats.total)}
                                            </td>
                                            <td className="px-6 py-5 text-right font-black tabular-nums text-emerald-500">
                                                {fmt(stats.paid)}
                                            </td>
                                            <td className="px-6 py-5 text-right font-black tabular-nums text-amber-500">
                                                {fmt(stats.outstanding)}
                                            </td>
                                            <td className="px-6 py-5 text-right font-black tabular-nums text-red-400 text-xs">
                                                {fmt(stats.rejected)}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                                    {stats.count} invoices
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-center gap-2">
                                                    {/* Progress bar */}
                                                    <div className="w-24 h-1.5 bg-border-color rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all"
                                                            style={{ width: `${paidPct}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 text-[9px] font-black">
                                                        <span className="text-emerald-500">{stats.approvedCount} appr</span>
                                                        <span className="text-red-400">{stats.rejectedCount} rej</span>
                                                        <span className="text-amber-400">{stats.pendingCount} pend</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end">
                                                    <div className="p-2 rounded-xl group-hover:bg-primary/10 group-hover:text-primary text-text-tertiary transition-all">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Footer totals */}
                            <tfoot className="bg-bg-tertiary/30 border-t-2 border-border-color">
                                <tr>
                                    <td className="px-8 py-5 text-[10px] font-black text-text-tertiary uppercase tracking-widest">Grand Total</td>
                                    <td className="px-6 py-5 text-right font-black text-text-primary tabular-nums">{fmt(grandTotal)}</td>
                                    <td className="px-6 py-5 text-right font-black text-emerald-500 tabular-nums">{fmt(grandPaid)}</td>
                                    <td className="px-6 py-5 text-right font-black text-amber-500 tabular-nums">{fmt(grandOutstanding)}</td>
                                    <td colSpan="4" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CorporateFinanceSummary;
