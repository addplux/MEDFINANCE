import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield, Zap, Info, SearchX, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';

const Schemes = () => {
    const navigate = useNavigate();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        fetchSchemes();
    }, [statusFilter]);

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const response = await api.get('/receivables/schemes', { params });
            setSchemes(response.data || []);
        } catch (error) {
            console.error('Error fetching schemes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSchemes = schemes.filter(scheme => {
        const matchesSearch = scheme.schemeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            scheme.schemeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            scheme.schemeType?.toLowerCase().includes(searchTerm.toLowerCase());
            
        const schemeTypeRaw = scheme.schemeType || 'other';
        const matchesType = typeFilter === 'all' || schemeTypeRaw === typeFilter;
        
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter mb-2">All Schemes</h1>
                    <div className="flex flex-col gap-3 mt-1">
                        <p className="text-text-secondary text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Shield className="w-3 h-3 text-primary" />
                            Manage healthcare provider programs and credit lines
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(
                                schemes.reduce((acc, curr) => {
                                    const type = curr.schemeType || 'other';
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                }, {})
                            ).map(([type, count]) => (
                                <button 
                                    key={type} 
                                    onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all active:scale-95 ${
                                        typeFilter === type 
                                            ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(255,0,204,0.3)]' 
                                            : 'bg-bg-tertiary text-text-primary border-border-color hover:bg-bg-elevated hover:border-border-hover'
                                    }`}
                                >
                                    {type === 'other' ? 'prepaid' : type.replace(/_/g, ' ')} Schemes 
                                    <span className={`px-2 py-0.5 rounded-full ${typeFilter === type ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'}`}>
                                        {count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/app/receivables/schemes/new')}
                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,0,204,0.3)] group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Create New Scheme
                </button>
            </div>

            {/* Content Section */}
            <div className="bg-bg-secondary/40 border border-border-color rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-sm p-2">
                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 p-6 bg-bg-tertiary/20 m-2 rounded-[2rem] border border-border-color">
                    <div className="relative flex-1 group">
                        <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH SCHEMES BY NAME, CODE OR TYPE..."
                            className="w-full bg-bg-tertiary border border-border-color rounded-full py-3.5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-bg-elevated transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-bg-tertiary border border-border-color rounded-full py-3.5 px-8 text-[11px] font-black uppercase tracking-widest text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[180px] cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all" className="bg-bg-primary text-text-primary">ALL STATUS</option>
                        <option value="active" className="bg-bg-primary text-green-500">ACTIVE ONLY</option>
                        <option value="suspended" className="bg-bg-primary text-highlight">SUSPENDED</option>
                        <option value="inactive" className="bg-bg-primary text-text-tertiary">INACTIVE</option>
                    </select>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-bg-tertiary text-[10px] font-black text-text-tertiary uppercase tracking-widest border-b border-border-color">
                            <tr>
                                <th className="p-8">Scheme Identity</th>
                                <th className="p-8">Classification</th>
                                <th className="p-8 text-right">Discount Rate</th>
                                <th className="p-8">Contact Person</th>
                                <th className="p-8">Status</th>
                                <th className="p-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-text-primary">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center">Identifying Schemes...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSchemes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                                <SearchX className="w-10 h-10 text-white/10" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-white uppercase tracking-tighter">No schemes found</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-2">Adjust your filters or reset search</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSchemes.map((scheme) => (
                                    <tr key={scheme.id} className="hover:bg-bg-secondary/40 transition-colors border-b border-border-color group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border-color group-hover:bg-primary/20 transition-all">
                                                    <Shield className="w-6 h-6 text-text-tertiary group-hover:text-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-text-primary uppercase tracking-tight">{scheme.schemeName}</p>
                                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest font-mono mt-0.5">{scheme.schemeCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${scheme.schemeType === 'insurance' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                scheme.schemeType === 'government' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                {scheme.schemeType === 'other' ? 'prepaid' : scheme.schemeType}
                                            </span>
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`${scheme.discountRate > 0 ? 'text-highlight' : 'text-white/40'} font-black text-lg tabular-nums tracking-tighter`}>
                                                    {scheme.discountRate}%
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Standard Rate</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-1">
                                                <p className="text-white font-black uppercase tracking-tight">{scheme.contactPerson || '-'}</p>
                                                <p className="text-[10px] text-white/70 font-bold tracking-wider">{scheme.phone || 'No direct phone'}</p>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${scheme.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                scheme.status === 'suspended' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-white/5 text-white/20 border-white/10'
                                                }`}>
                                                {scheme.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <button
                                                className="px-6 py-2 bg-white/5 hover:bg-primary text-[9px] font-black uppercase tracking-[0.2em] text-white/80 hover:text-white rounded-full border border-white/10 hover:border-primary transition-all active:scale-95"
                                                onClick={() => navigate(`/app/receivables/schemes/${scheme.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Visual Insights Pill */}
            <div className="flex flex-wrap gap-4 py-4 px-8 bg-white/5 border border-white/10 rounded-[2.5rem] w-fit backdrop-blur-md">
                <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Total active connections:</span>
                    <span className="text-sm font-black text-white">{schemes.filter(s => s.status === 'active').length}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-accent" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Market Share (Top 3):</span>
                    <span className="text-sm font-black text-white uppercase tracking-tighter">NHIMA, MADISON, PRUDENTIAL</span>
                </div>
            </div>
        </div>
    );
};

export default Schemes;
