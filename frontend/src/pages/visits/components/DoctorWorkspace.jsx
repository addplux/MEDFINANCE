import React, { useState, useEffect } from 'react';
import { visitAPI, setupAPI, billingAPI } from '../../../services/apiService';
import { Stethoscope, ClipboardList, Send, CheckCircle, Info, Activity, Beaker, Radio, Plus, Trash2, Search } from 'lucide-react';

const DoctorWorkspace = ({ visitId, patientId, paymentMethod, queueStatus, notes, onStatusChange }) => {
    const [loading, setLoading] = useState(false);
    const [clinicalNotes, setClinicalNotes] = useState(notes || '');
    
    // Order Basket States
    const [services, setServices] = useState([]);
    const [basket, setBasket] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const loadServices = async () => {
            try {
                const res = await setupAPI.services.getAll({ limit: 1000 });
                const data = res.data?.data || res.data || [];
                setServices(data.filter(s => s.isActive));
            } catch (err) {
                console.error('Failed to load services:', err);
            }
        };
        loadServices();
    }, [queueStatus]);

    const getPrice = (service) => {
        const tier = paymentMethod || 'cash';
        if (tier === 'cash' && Number(service.cashPrice) > 0) return Number(service.cashPrice);
        if (tier === 'corporate' && Number(service.corporatePrice) > 0) return Number(service.corporatePrice);
        if (tier === 'scheme' && Number(service.schemePrice) > 0) return Number(service.schemePrice);
        if (tier === 'staff' && Number(service.staffPrice) > 0) return Number(service.staffPrice);
        return Number(service.price); // Base fallback
    };

    const handleUpdateStatus = async (newStatus, assignedDepartment = null) => {
        if (!patientId && basket.length > 0) {
            alert('Cannot place orders: Patient ID is missing.');
            return;
        }

        setLoading(true);
        try {
            // 1. Post Basket Billing items First (Doctors Orders)
            if (basket.length > 0) {
                await Promise.all(basket.map(item => 
                    billingAPI.opd.create({
                        patientId,
                        serviceId: item.id,
                        quantity: 1,
                        paymentMethod: paymentMethod || 'cash',
                        notes: 'Doctor Order from Consultation'
                    })
                ));
            }

            // 2. Clear notes / movement updates
            const updatePayload = { notes: clinicalNotes };
            if (assignedDepartment) updatePayload.assignedDepartment = assignedDepartment;
            await visitAPI.update(visitId, updatePayload);
            await visitAPI.updateQueueStatus(visitId, newStatus);
            setBasket([]); // Clear basket
            if (onStatusChange) onStatusChange();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update patient status or post orders');
        } finally {
            setLoading(false);
        }
    };

    const addToBasket = (service) => {
        if (basket.some(item => item.id === service.id)) return;
        setBasket([...basket, service]);
    };

    const removeFromBasket = (serviceId) => {
        setBasket(basket.filter(item => item.id !== serviceId));
    };

    const filteredServices = services.filter(s => {
        const matchesSearch = s.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) || s.serviceCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    if (queueStatus === 'pending_triage') return null;

    if (queueStatus === 'ready_for_discharge') {
        return (
            <div className="card p-5 bg-gradient-to-br from-green-900 to-emerald-900 border border-green-800 mt-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" /> Patient Ready for Discharge / Billing
                </h3>
                <p className="text-sm text-white opacity-80 mt-1">
                    The patient's consultation is complete. They must clear any pending bills before final discharge.
                </p>
            </div>
        );
    }

    const categories = ['all', 'opd', 'laboratory', 'radiology', 'pharmacy', 'other'];

    return (
        <div className="card p-5 border border-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden mt-4">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />

            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-400" /> Doctor's Workspace
            </h3>

            <div className="space-y-4">
                <div className="form-group">
                    <label className="form-label text-xs font-semibold text-white opacity-80">Clinical Notes & Diagnosis</label>
                    <textarea
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        className="form-textarea text-sm min-h-[120px]"
                        placeholder="Enter patient complaints, examination findings, and diagnosis here..."
                    />
                </div>

                {/* --- Doctor's Orders (Service Picker) --- */}
                {queueStatus === 'with_doctor' && (
                    <div className="border-t border-dashed border-white/10 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Doctor's Orders (Diagnostics & Services)</h4>
                            <span className="text-[10px] font-black bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{basket.length} items ordered</span>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                <input 
                                    type="text"
                                    placeholder="Search services (e.g. FBC, X-Ray)..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="form-input pl-9 text-xs py-1.5 bg-white/5 border-white/10"
                                />
                            </div>
                            <select 
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="form-select text-xs py-1.5 w-32 bg-white/5 border-white/10"
                            >
                                {categories.map(c => <option key={c} value={c} className="bg-bg-secondary">{c.toUpperCase()}</option>)}
                            </select>
                        </div>

                        {/* Search Results (Compact Dropdown height cap) */}
                        <div className="max-h-40 overflow-y-auto bg-bg-secondary rounded-xl border border-white/10 custom-scrollbar divide-y divide-white/5">
                                {filteredServices.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-white/40">No services found</div>
                                ) : (
                                    filteredServices.slice(0, 10).map(s => (
                                        <div key={s.id} className="flex justify-between items-center p-2 hover:bg-white/5 cursor-pointer" onClick={() => addToBasket(s)}>
                                            <div>
                                                <p className="text-xs font-bold text-white">{s.serviceName}</p>
                                                <p className="text-[9px] font-mono text-white/40 uppercase">{s.category} • {s.serviceCode}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-emerald-400">ZK{getPrice(s).toLocaleString()}</span>
                                                <button className="p-1 hover:bg-purple-500/20 rounded text-purple-400"><Plus className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                        {/* Basket Items Grid/List */}
                        {basket.length > 0 && (
                            <div className="bg-white/5 rounded-xl border border-white/10 p-2 space-y-1.5">
                                {basket.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold text-white">{item.serviceName}</p>
                                            <p className="text-[9px] font-black uppercase text-text-tertiary select-none">{item.category}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-emerald-400">ZK{getPrice(item).toLocaleString()}</span>
                                            <button onClick={() => removeFromBasket(item.id)} className="p-1 hover:bg-red-500/20 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                    {queueStatus === 'waiting_doctor' && (
                        <button
                            onClick={() => handleUpdateStatus('with_doctor')}
                            disabled={loading}
                            className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600 text-sm py-1.5"
                        >
                            <Stethoscope className="w-4 h-4" /> Start Consultation
                        </button>
                    )}

                    {queueStatus === 'pending_results' && (
                        <div className="w-full mb-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-200 leading-relaxed">
                                <p className="font-bold mb-1 uppercase tracking-wider">Awaiting Diagnostics</p>
                                This patient has been moved to the pending results queue. Once lab results or X-rays are ready, click <b>Resume Consultation</b> below to finalize findings.
                            </div>
                        </div>
                    )}

                    {queueStatus === 'with_doctor' && (
                        <>
                            <button
                                onClick={() => handleUpdateStatus('pending_results')}
                                disabled={loading}
                                className="btn btn-secondary border-yellow-500 text-yellow-700 hover:bg-yellow-50 text-sm py-1.5"
                                title="Move to pending while patient goes for diagnostics"
                            >
                                <ClipboardList className="w-4 h-4 text-yellow-500" /> Awaiting Labs/X-Ray
                            </button>

                            <button
                                onClick={() => handleUpdateStatus('waiting_theatre', 'Theatre')}
                                disabled={loading}
                                className="btn bg-red-900/40 hover:bg-red-800 text-red-200 border-red-800 text-sm py-1.5"
                            >
                                <Activity className="w-4 h-4" /> Send to Theatre
                            </button>

                            <button
                                onClick={() => handleUpdateStatus('waiting_lab', 'Laboratory')}
                                disabled={loading}
                                className="btn bg-blue-900/40 hover:bg-blue-800 text-blue-200 border-blue-800 text-sm py-1.5"
                            >
                                <Beaker className="w-4 h-4" /> Send to Lab ({basket.filter(i => i.category === 'laboratory').length})
                            </button>

                            <button
                                onClick={() => handleUpdateStatus('waiting_radiology', 'Radiology')}
                                disabled={loading}
                                className="btn bg-indigo-900/40 hover:bg-indigo-800 text-indigo-200 border-indigo-800 text-sm py-1.5"
                            >
                                <Radio className="w-4 h-4" /> Send to Imaging ({basket.filter(i => i.category === 'radiology').length})
                            </button>

                            <button
                                onClick={() => handleUpdateStatus('ready_for_discharge', 'Pharmacy')}
                                disabled={loading}
                                className="btn bg-green-500 hover:bg-green-600 text-white border-green-500 text-sm py-1.5 ml-auto"
                            >
                                <Send className="w-4 h-4" /> Send to Pharmacy ({basket.filter(i => i.category === 'pharmacy').length})
                            </button>

                            <button
                                onClick={() => handleUpdateStatus('ready_for_discharge')}
                                disabled={loading}
                                className="btn bg-orange-500 hover:bg-orange-600 text-white border-orange-500 text-sm py-1.5"
                            >
                                <Send className="w-4 h-4" /> Ready for Discharge
                            </button>
                        </>
                    )}

                    {queueStatus === 'pending_results' && (
                        <button
                            onClick={() => handleUpdateStatus('with_doctor')}
                            disabled={loading}
                            className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600 text-sm py-1.5"
                        >
                            <Stethoscope className="w-4 h-4" /> Resume Consultation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorWorkspace;
