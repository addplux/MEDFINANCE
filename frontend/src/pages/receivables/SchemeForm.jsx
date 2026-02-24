import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Hash, Zap, Mail, Phone, AlignLeft, Info } from 'lucide-react';
import api from '../../services/apiClient';

const SchemeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        schemeCode: '',
        schemeName: '',
        schemeType: 'insurance',
        discountRate: '',
        contactPerson: '',
        phone: '',
        email: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        if (isEdit) {
            fetchScheme();
        }
    }, [id]);

    const fetchScheme = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/receivables/schemes/${id}`);
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching scheme:', error);
            alert('Failed to load scheme details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.schemeCode.trim() || !formData.schemeName.trim()) {
            alert('Scheme code and name are required');
            return;
        }

        try {
            setLoading(true);
            if (isEdit) {
                await api.put(`/receivables/schemes/${id}`, formData);
                alert('Scheme updated successfully');
            } else {
                await api.post('/receivables/schemes', formData);
                alert('Scheme created successfully');
            }
            navigate('/app/receivables/schemes');
        } catch (error) {
            console.error('Error saving scheme:', error);
            alert('Failed to save scheme');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                    <p className="text-white/40 font-black uppercase tracking-widest text-xs">Accessing Scheme Blueprint...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/app/receivables/schemes')}
                        className="p-4 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                            {isEdit ? 'Configure Scheme' : 'Launch New Scheme'}
                        </h1>
                        <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Shield className="w-3 h-3 text-primary" />
                            {isEdit ? 'Modify existing insurance or discount program' : 'Design a new strategic provider program'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[4rem] blur-xl opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none"></div>

                <div className="relative bg-black/60 border border-white/5 rounded-[4rem] shadow-2xl p-12 backdrop-blur-xl">
                    <div className="space-y-12">
                        {/* Section: Scheme Identity */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/5"></div>
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] px-4 whitespace-nowrap">Scheme Blueprint</h4>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Unique Identifier / Code *</label>
                                    <div className="relative group/input">
                                        <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="schemeCode"
                                            value={formData.schemeCode}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5 uppercase"
                                            placeholder="E.G. INS-ZAM-001"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Scheme Marketing Name *</label>
                                    <div className="relative group/input">
                                        <Shield className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="schemeName"
                                            value={formData.schemeName}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5"
                                            placeholder="E.G. MADISON PLATINUM..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Classification Type</label>
                                    <select
                                        name="schemeType"
                                        value={formData.schemeType}
                                        onChange={handleChange}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-8 text-sm font-bold text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="insurance" className="bg-bg-primary text-white">INSURANCE PROGRAM</option>
                                        <option value="corporate" className="bg-bg-primary text-white">CORPORATE DIRECT</option>
                                        <option value="government" className="bg-bg-primary text-white">GOVERNMENT / NHIMA</option>
                                        <option value="ngo" className="bg-bg-primary text-white">NGO / NON-PROFIT</option>
                                        <option value="other" className="bg-bg-primary text-white">OTHER CLASSIFICATION</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Strategic Discount Rate (%)</label>
                                    <div className="relative group/input">
                                        <Zap className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            name="discountRate"
                                            value={formData.discountRate}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/10"
                                            placeholder="0.00"
                                            step="0.01"
                                            max="100"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Stakeholder Contact */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/5"></div>
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] px-4 whitespace-nowrap">Stakeholder Registry</h4>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Principle Contact Person</label>
                                    <div className="relative group/input">
                                        <AlignLeft className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="contactPerson"
                                            value={formData.contactPerson}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5"
                                            placeholder="MANAGER NAME..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Institutional Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-8 text-sm font-bold text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="active" className="bg-bg-primary text-green-500">PROGRAM ACTIVE</option>
                                        <option value="inactive" className="bg-bg-primary text-white/20">PROGRAM DECOMMISSIONED</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Direct Line</label>
                                    <div className="relative group/input">
                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5"
                                            placeholder="+260..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Audit Trail Notification Email</label>
                                    <div className="relative group/input">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5"
                                            placeholder="SCHEMES@PROVIDER.COM..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Contextual Intelligence */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Internal Strategic Notes & SLA Terms</label>
                            <div className="relative group/input">
                                <Info className="absolute left-6 top-6 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-[2.5rem] py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5 min-h-[120px]"
                                    placeholder="ENTER ANY SPECIAL REQUIREMENTS OR SERVICE LEVEL AGREEMENT TERMS..."
                                />
                            </div>
                        </div>

                        {/* Final Actions */}
                        <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-8 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => navigate('/app/receivables/schemes')}
                                className="w-full md:w-auto px-12 py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all active:scale-95"
                                disabled={loading}
                            >
                                Abandon Blueprint
                            </button>
                            <button
                                type="submit"
                                className="w-full md:w-auto flex items-center justify-center gap-3 px-16 py-4 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_40px_rgba(255,0,204,0.4)]"
                                disabled={loading}
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'SAVING BLUEPRINT...' : isEdit ? 'Update Configuration' : 'Launch Program'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SchemeForm;
