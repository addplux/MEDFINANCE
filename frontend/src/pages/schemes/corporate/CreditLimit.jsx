import React, { useState, useEffect } from 'react';
import { CreditCard, Save, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

const CreditLimit = () => {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [editingScheme, setEditingScheme] = useState(null);
    const [newLimit, setNewLimit] = useState('');

    useEffect(() => {
        fetchSchemes();
    }, []);

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/receivables/schemes?status=active&_t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSchemes(data);
            }
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLimit = async (schemeId) => {
        if (!newLimit || isNaN(newLimit)) return;

        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/receivables/schemes/${schemeId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ creditLimit: parseFloat(newLimit) })
            });

            if (response.ok) {
                setEditingScheme(null);
                setNewLimit('');
                fetchSchemes();
            } else {
                alert('Failed to update credit limit');
            }
        } catch (error) {
            console.error('Update limit error:', error);
            alert('An error occurred while updating');
        } finally {
            setUpdating(false);
        }
    };

    const calculateUtilization = (outstanding, limit) => {
        if (!limit || limit <= 0) return 0;
        return Math.min(Math.round((outstanding / limit) * 100), 100);
    };

    const getUtilizationColor = (percent) => {
        if (percent >= 90) return 'bg-rose-500';
        if (percent >= 70) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Credit Limit Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor and manage credit exposure for all corporate and insurance schemes</p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-48"></div>
                    ))}
                </div>
            ) : schemes.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
                    <p className="text-amber-700 font-semibold">No active schemes found.</p>
                    <p className="text-amber-600 text-sm mt-1">Please ensure schemes are created and activated under 'Member Management'.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schemes.map(scheme => {
                        const utilization = calculateUtilization(scheme.outstandingBalance || 0, scheme.creditLimit || 0);
                        const isEditing = editingScheme === scheme.id;

                        return (
                            <div key={scheme.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{scheme.schemeName}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            {(() => {
                                                const t = (scheme.schemeType || '').toLowerCase();
                                                const colors = { corporate: 'bg-blue-100 text-blue-700', insurance: 'bg-purple-100 text-purple-700', government: 'bg-amber-100 text-amber-700' };
                                                return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${colors[t] || 'bg-slate-100 text-slate-600'}`}>{t}</span>;
                                            })()}
                                            <span className="text-xs text-slate-400 font-mono">{scheme.schemeCode}</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-xl">
                                        <CreditCard className="w-5 h-5 text-slate-400" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Limit</p>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        value={newLimit}
                                                        onChange={(e) => setNewLimit(e.target.value)}
                                                        className="w-full text-sm p-1.5 border border-blue-400 rounded bg-blue-50 focus:outline-none ring-2 ring-blue-100"
                                                        placeholder="0.00"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateLimit(scheme.id)}
                                                        disabled={updating}
                                                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingScheme(scheme.id);
                                                        setNewLimit(scheme.creditLimit || '0');
                                                    }}
                                                    className="text-sm font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 group"
                                                >
                                                    K{(Number(scheme.creditLimit) || 0).toLocaleString()}
                                                    <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Outstanding</p>
                                            <p className="text-sm font-bold text-rose-600">K{(Number(scheme.outstandingBalance) || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                CREDIT UTILIZATION
                                            </span>
                                            <span className={`text-[10px] font-bold ${utilization > 90 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                {utilization}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                            <div
                                                className={`h-full transition-all duration-500 ${getUtilizationColor(utilization)}`}
                                                style={{ width: `${utilization}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {utilization >= 90 && (
                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-100">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Limit almost exceeded
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative group">
                    <div className="relative z-10">
                        <h4 className="text-lg font-bold">Financial Summary</h4>
                        <p className="text-slate-400 text-sm">Aggregated exposure across all active schemes</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mt-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Portfolio</p>
                                <p className="text-xl font-bold">K{schemes.reduce((acc, s) => acc + (Number(s.creditLimit) || 0), 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Outstanding</p>
                                <p className="text-xl font-bold text-rose-400">K{schemes.reduce((acc, s) => acc + (Number(s.outstandingBalance) || 0), 0).toLocaleString()}</p>
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available Credit</p>
                                <p className="text-xl font-bold text-emerald-400">K{(schemes.reduce((acc, s) => acc + (Number(s.creditLimit) || 0), 0) - schemes.reduce((acc, s) => acc + (Number(s.outstandingBalance) || 0), 0)).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <DollarSign className="w-48 h-48 rotate-12" />
                    </div>
                </div>
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 flex flex-col justify-between">
                    <div>
                        <h4 className="text-lg font-bold">Quick Actions</h4>
                        <p className="text-blue-100 text-sm">System management shortcuts</p>
                    </div>
                    <div className="space-y-2 mt-4">
                        <button onClick={() => window.print()} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">Export Report</button>
                        <button onClick={fetchSchemes} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">Refresh Data</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditLimit;

