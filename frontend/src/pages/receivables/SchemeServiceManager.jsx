import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { schemeServicesAPI, setupAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft, Plus, Search, Trash2, RefreshCw, DollarSign,
    CheckCircle2, Shield, Edit2, Save, X
} from 'lucide-react';

const categoryColors = {
    opd: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ipd: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    pharmacy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    laboratory: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    radiology: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const fmt = (n) => `K${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * SchemeServiceManager
 * Accessible at /app/receivables/schemes/:id/services
 * Allows admins to define which services a scheme covers and at what price.
 */
const SchemeServiceManager = () => {
    const { id: schemeId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [covered, setCovered] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [coveredIds, setCoveredIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(null); // serviceId being saved
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [catFilter, setCatFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await schemeServicesAPI.getByCoverageScheme(schemeId);
            if (res.data?.success) {
                setCovered(res.data.covered);
                setAllServices(res.data.allServices);
                setCoveredIds(res.data.coveredIds);
            }
        } catch { addToast('error', 'Failed to load scheme services.'); }
        finally { setLoading(false); }
    }, [schemeId]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async (service) => {
        setSaving(service.id);
        try {
            await schemeServicesAPI.upsert(schemeId, { serviceId: service.id, schemePrice: null, isCovered: true });
            addToast('success', `${service.serviceName} added to scheme coverage.`);
            load();
        } catch { addToast('error', 'Failed to add service.'); }
        finally { setSaving(null); }
    };

    const handleRemove = async (serviceId, name) => {
        if (!window.confirm(`Remove "${name}" from this scheme's coverage?`)) return;
        try {
            await schemeServicesAPI.remove(schemeId, serviceId);
            addToast('success', `${name} removed from coverage.`);
            load();
        } catch { addToast('error', 'Failed to remove service.'); }
    };

    const startEdit = (ss) => {
        setEditingId(ss.id);
        setEditPrice(ss.schemePrice != null ? String(ss.schemePrice) : '');
    };

    const handleSavePrice = async (ss) => {
        setSaving(ss.serviceId);
        try {
            await schemeServicesAPI.upsert(schemeId, {
                serviceId: ss.serviceId,
                schemePrice: editPrice !== '' ? Number(editPrice) : null,
                isCovered: true
            });
            addToast('success', 'Price updated successfully.');
            setEditingId(null);
            load();
        } catch { addToast('error', 'Failed to save price.'); }
        finally { setSaving(null); }
    };

    // Services not yet in scheme
    const uncovered = allServices.filter(s => !coveredIds.includes(s.id));
    const filteredUncovered = uncovered.filter(s =>
        (catFilter === 'all' || s.category === catFilter) &&
        (search === '' || s.serviceName.toLowerCase().includes(search.toLowerCase()) || s.serviceCode.toLowerCase().includes(search.toLowerCase()))
    );
    const categories = ['all', ...new Set(allServices.map(s => s.category))];

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary" />
                        Scheme Service Coverage & Pricing
                    </h1>
                    <p className="text-xs text-white/40 mt-1">Define which services this scheme covers and set custom prices per service.</p>
                </div>
            </div>

            {/* Covered Services */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-sm font-bold text-white">Covered Services</h2>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{covered.length} services</span>
                    </div>
                    <button onClick={load} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-text-secondary text-sm">Loading...</div>
                ) : covered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Shield className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-text-secondary text-sm">No services added yet. Add services below.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-text-secondary">
                                    <th className="px-6 py-4">Service</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Std. Price</th>
                                    <th className="px-6 py-4">Scheme Price</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {covered.map(ss => (
                                    <tr key={ss.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-white">{ss.service?.serviceName}</div>
                                            <div className="text-xs text-text-secondary font-mono">{ss.service?.serviceCode}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${categoryColors[ss.service?.category] || categoryColors.other}`}>
                                                {ss.service?.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                                            {fmt(ss.service?.price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === ss.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editPrice}
                                                        onChange={e => setEditPrice(e.target.value)}
                                                        placeholder="Leave blank = standard"
                                                        className="w-32 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleSavePrice(ss)} disabled={saving === ss.serviceId} className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors">
                                                        {saving === ss.serviceId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${ss.schemePrice != null ? 'text-amber-400' : 'text-text-secondary'}`}>
                                                        {ss.schemePrice != null ? fmt(ss.schemePrice) : <span className="text-xs italic opacity-50">Standard</span>}
                                                    </span>
                                                    <button onClick={() => startEdit(ss)} className="p-1 hover:bg-white/10 text-white/30 hover:text-white rounded transition-colors">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemove(ss.serviceId, ss.service?.serviceName)}
                                                className="p-1.5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-lg transition-colors"
                                                title="Remove from coverage"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Services */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                        <Plus className="w-4 h-4 text-accent" />
                        Add Services to Coverage
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search services..."
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCatFilter(c)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${catFilter === c ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/5 text-white/50 hover:text-white border border-white/10'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {filteredUncovered.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary text-sm">
                            {search ? 'No matching uncovered services.' : 'All services have been added to this scheme.'}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {filteredUncovered.map(s => (
                                <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{s.serviceName}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs font-mono text-text-secondary">{s.serviceCode}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${categoryColors[s.category] || categoryColors.other}`}>{s.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-text-secondary">{fmt(s.price)}</span>
                                        <button
                                            onClick={() => handleAdd(s)}
                                            disabled={saving === s.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-xs font-semibold rounded-xl transition-colors disabled:opacity-40"
                                        >
                                            {saving === s.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchemeServiceManager;
