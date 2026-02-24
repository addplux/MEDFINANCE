import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2, CreditCard, Mail, Phone, MapPin, AlignLeft, Info } from 'lucide-react';
import { receivablesAPI } from '../../services/apiService';

const CorporateAccountForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        creditLimit: '',
        paymentTerms: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        if (isEdit) {
            fetchAccount();
        }
    }, [id]);

    const fetchAccount = async () => {
        try {
            setLoading(true);
            const response = await receivablesAPI.corporate.getById(id);
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching account:', error);
            alert('Failed to load account details');
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

        if (!formData.companyName.trim()) {
            alert('Company name is required');
            return;
        }

        try {
            setLoading(true);
            if (isEdit) {
                await receivablesAPI.corporate.update(id, formData);
                alert('Corporate account updated successfully');
            } else {
                await receivablesAPI.corporate.create(formData);
                alert('Corporate account created successfully');
            }
            navigate('/app/receivables/corporate');
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Failed to save corporate account');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                    <p className="text-white/40 font-black uppercase tracking-widest text-xs">Accessing Portfolio Details...</p>
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
                        onClick={() => navigate('/app/receivables/corporate')}
                        className="p-4 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                            {isEdit ? 'Modify Account' : 'New Account'}
                        </h1>
                        <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-primary" />
                            {isEdit ? 'Update existing corporate portfolio' : 'Register a new institutional client account'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[4rem] blur-xl opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none"></div>

                <div className="relative bg-black/60 border border-white/5 rounded-[4rem] shadow-2xl p-12 backdrop-blur-xl">
                    <div className="space-y-12">
                        {/* Section: Basic Information */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/5"></div>
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] px-4 whitespace-nowrap">Corporate Identity</h4>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Company Full Legal Name *</label>
                                    <div className="relative group/input">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5"
                                            placeholder="ENTER COMPANY NAME..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Key Account Manager / Contact</label>
                                    <div className="relative group/input">
                                        <AlignLeft className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="contactPerson"
                                            value={formData.contactPerson}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5"
                                            placeholder="FULL NAME..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Direct Contact Phone</label>
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
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Official Email Address</label>
                                    <div className="relative group/input">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5"
                                            placeholder="DEPT@COMPANY.COM..."
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Physical / Billing Address</label>
                                    <div className="relative group/input">
                                        <MapPin className="absolute left-6 top-6 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-3xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5 min-h-[100px]"
                                            placeholder="COMPLETE PHYSICAL LOCATION..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Account Governance */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/5"></div>
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] px-4 whitespace-nowrap">Financial Governance</h4>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Credit Limit (ZMW)</label>
                                    <div className="relative group/input">
                                        <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            name="creditLimit"
                                            value={formData.creditLimit}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/10"
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Settlement Cycle (Days)</label>
                                    <div className="relative group/input">
                                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            name="paymentTerms"
                                            value={formData.paymentTerms}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/10"
                                            placeholder="30"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Account Visibility</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-8 text-sm font-bold text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="active" className="bg-bg-primary text-white">ACTIVE OPS</option>
                                        <option value="suspended" className="bg-bg-primary text-highlight">SUSPENDED</option>
                                        <option value="closed" className="bg-bg-primary text-white/20">CLOSED / ARCHIVED</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section: Internal Notes */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Internal Audit Notes & Special Terms</label>
                            <div className="relative group/input">
                                <Info className="absolute left-6 top-6 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-[2.5rem] py-4 pl-14 pr-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all placeholder:text-white/5 min-h-[120px]"
                                    placeholder="ENTER ANY SPECIAL REQUIREMENTS OR INTERNAL NOTES..."
                                />
                            </div>
                        </div>

                        {/* Final Actions */}
                        <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-8 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => navigate('/app/receivables/corporate')}
                                className="w-full md:w-auto px-12 py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all active:scale-95"
                                disabled={loading}
                            >
                                Abandon Changes
                            </button>
                            <button
                                type="submit"
                                className="w-full md:w-auto flex items-center justify-center gap-3 px-16 py-4 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_40px_rgba(255,0,204,0.4)]"
                                disabled={loading}
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'UPDATING...' : isEdit ? 'Commit Changes' : 'Initialize Portfolio'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CorporateAccountForm;
