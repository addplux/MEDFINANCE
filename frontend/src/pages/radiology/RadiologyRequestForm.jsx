import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { radiologyAPI, patientAPI, setupAPI, visitAPI } from '../../services/apiService';
import { Save, ArrowLeft, Search, User, Activity, Clock, ChevronRight, AlertCircle } from 'lucide-react';

const SidebarQueue = ({ onSelect, selectedVisitId }) => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const response = await visitAPI.getDepartmentQueue('Radiology');
            setQueue(response.data || []);
        } catch (error) {
            console.error('Error fetching radiology queue:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-80 flex-shrink-0 bg-white/5 border-r border-white/10 h-[calc(100vh-80px)] flex flex-col animate-fade-in">
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Radiology Queue
                    </h2>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] font-bold">
                        {queue.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
                {loading && queue.length === 0 ? (
                    <div className="p-4 text-center text-xs text-white/20 uppercase tracking-widest font-bold">Loading...</div>
                ) : queue.length === 0 ? (
                    <div className="p-8 text-center">
                        <Activity className="w-8 h-8 text-white/5 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 leading-relaxed">
                            No patients<br />waiting for scans
                        </p>
                    </div>
                ) : (
                    queue.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className={`w-full text-left p-3 rounded-xl transition-all border group relative overflow-hidden ${
                                selectedVisitId === item.id 
                                ? 'bg-primary/20 border-primary/40 shadow-lg shadow-primary/10' 
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                            }`}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                    selectedVisitId === item.id ? 'bg-primary text-white' : 'bg-white/5 text-white/40'
                                }`}>
                                    {item.patient?.firstName?.[0]}{item.patient?.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white truncate uppercase tracking-tight">
                                        {item.patient?.firstName} {item.patient?.lastName}
                                    </div>
                                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">
                                        {item.visitNumber}
                                    </div>
                                </div>
                                <ChevronRight className={`w-3 h-3 transition-transform ${selectedVisitId === item.id ? 'text-primary translate-x-1' : 'text-white/10'}`} />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

const RadiologyRequestForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paramVisitId = searchParams.get('visitId');

    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        patientId: '',
        visitId: '',
        selectedScans: [],
        priority: 'routine',
        clinicalNotes: '',
        searchTerm: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, [paramVisitId]);

    const fetchInitialData = async () => {
        try {
            const sRes = await setupAPI.services.getAll();
            const allServices = sRes.data || [];
            const rScans = allServices.filter(s =>
                s.department?.departmentName?.toLowerCase().includes('radiology') ||
                s.category?.toLowerCase() === 'radiology' ||
                s.departmentId === 3
            );
            setScans(rScans.length > 0 ? rScans : allServices);
            
            if (paramVisitId) {
                const visitRes = await visitAPI.getById(paramVisitId);
                handlePatientSelect(visitRes.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const handlePatientSelect = (visit) => {
        setSelectedVisit(visit);
        
        // Match assigned items with available scans
        const assignedItems = visit.assignedItems || [];
        const preSelectedScanIds = scans
            .filter(s => assignedItems.some(item => item.name === (s.serviceName || s.name)))
            .map(s => s.id);

        setFormData(prev => ({
            ...prev,
            patientId: visit.patientId,
            visitId: visit.id,
            selectedScans: preSelectedScanIds,
            clinicalNotes: visit.clinicalNotes || ''
        }));
    };

    const toggleScan = (scanId) => {
        setFormData(prev => ({
            ...prev,
            selectedScans: prev.selectedScans.includes(scanId)
                ? prev.selectedScans.filter(id => id !== scanId)
                : [...prev.selectedScans, scanId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || formData.selectedScans.length === 0) {
            alert('Please select a patient and at least one scan procedure.');
            return;
        }

        try {
            setLoading(true);
            await radiologyAPI.requests.create({
                patientId: formData.patientId,
                visitId: formData.visitId,
                serviceIds: formData.selectedScans,
                priority: formData.priority,
                clinicalNotes: formData.clinicalNotes
            });

            // Automatically notify cashier if visitId is available
            if (formData.visitId) {
                await visitAPI.update(formData.visitId, { queueStatus: 'pending_cashier' });
            }

            alert('Radiology request created successfully!');
            navigate('/app/radiology/dashboard');
        } catch (error) {
            console.error('Failed to create request:', error);
            alert('Failed to create radiology request');
        } finally {
            setLoading(false);
        }
    };

    const filteredScans = (scans || []).filter(s =>
        (s.serviceName || '').toLowerCase().includes((formData.searchTerm || '').toLowerCase()) ||
        (s.category || '').toLowerCase().includes((formData.searchTerm || '').toLowerCase())
    );

    const isPaid = selectedVisit?.billingSummary?.status === 'paid' || selectedVisit?.patient?.paymentMethod !== 'cash';

    return (
        <div className="flex h-full overflow-hidden bg-black/20 rounded-2xl border border-white/5 animate-fade-in">
            <SidebarQueue onSelect={handlePatientSelect} selectedVisitId={formData.visitId} />

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                Radiology <span className="text-primary">Request</span>
                            </h1>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                                Medical imaging & diagnostic radiology order
                            </p>
                        </div>
                        <button onClick={() => navigate('/app/radiology/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>

                    {!formData.visitId ? (
                        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                            <Activity className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
                            <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Select a patient from the queue to start</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                            {/* Patient Info Card */}
                            <div className="p-8 rounded-[40px] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <User className="w-32 h-32 text-white" />
                                </div>
                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Imaging Context</div>
                                        <h2 className="text-4xl font-black text-white uppercase tracking-tight italic">
                                            {selectedVisit?.patient?.firstName} {selectedVisit?.patient?.lastName}
                                        </h2>
                                        <div className="flex gap-4 mt-6 text-[11px] font-black uppercase tracking-[0.15em] text-white/40">
                                            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10"># {selectedVisit?.patient?.patientNumber}</span>
                                            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-white/60">{selectedVisit?.visitNumber}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                                            isPaid 
                                            ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                                            : 'bg-orange-500/20 text-orange-400 border-orange-500/20'
                                        }`}>
                                            {isPaid ? 'Paid & Valid' : 'Payment Gate Active'}
                                        </div>
                                        {!isPaid && (
                                            <div className="mt-3 text-[10px] font-black text-orange-400/60 uppercase tracking-tighter flex items-center justify-end gap-2">
                                                <AlertCircle className="w-3 h-3" /> Revenue Policy Enforced
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Priority Level</label>
                                        <select
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-primary/20 appearance-none italic"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="routine">Routine</option>
                                            <option value="urgent">Urgent</option>
                                            <option value="stat">STAT (Emergency)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Clinical/Imaging Notes</label>
                                        <textarea
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white h-24 italic"
                                            value={formData.clinicalNotes}
                                            onChange={e => setFormData({ ...formData, clinicalNotes: e.target.value })}
                                            placeholder="Indications for imaging procedure..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select Procedures</label>
                                        <div className="relative w-48">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                className="w-full h-8 pl-9 pr-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white outline-none"
                                                value={formData.searchTerm}
                                                onChange={e => setFormData({ ...formData, searchTerm: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="border border-white/5 rounded-[20px] max-h-64 overflow-y-auto custom-scrollbar bg-black/20">
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-white/5 sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-3 text-left w-10"></th>
                                                    <th className="p-3 text-left font-black text-white/20 uppercase tracking-widest">Procedure</th>
                                                    <th className="p-3 text-right font-black text-white/20 uppercase tracking-widest">K</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 font-bold text-white/80">
                                                {filteredScans.map(scan => (
                                                    <tr
                                                        key={scan.id}
                                                        className={`hover:bg-white/[0.05] transition-all cursor-pointer ${formData.selectedScans.includes(scan.id) ? 'bg-primary/10 text-primary italic' : ''}`}
                                                        onClick={() => toggleScan(scan.id)}
                                                    >
                                                        <td className="p-3">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.selectedScans.includes(scan.id) ? 'bg-primary border-primary' : 'border-white/10 bg-white/5'}`}>
                                                                {formData.selectedScans.includes(scan.id) && <Save className="w-2.5 h-2.5 text-white" />}
                                                            </div>
                                                        </td>
                                                        <td className="p-3">{scan.serviceName || scan.name}</td>
                                                        <td className="p-3 text-right">{(scan.price || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 rounded-[50px] bg-white/[0.03] border border-white/10 flex items-center justify-between shadow-inner">
                                <div>
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 font-mono italic">Procedures Selected</div>
                                    <div className="text-4xl font-black text-white tracking-tighter italic">
                                        {formData.selectedScans.length} <span className="text-xl text-white/40 not-italic ml-1 font-bold tracking-widest">ITEMS</span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/app/radiology/dashboard')}
                                        className="h-16 px-10 rounded-full text-[11px] font-black uppercase tracking-widest text-white/40 border border-white/5 hover:bg-white/5 transition-all italic"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || (!isPaid && selectedVisit?.patient?.paymentMethod === 'cash') || formData.selectedScans.length === 0}
                                        className={`h-16 px-14 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all italic ${
                                            loading || (!isPaid && selectedVisit?.patient?.paymentMethod === 'cash') || formData.selectedScans.length === 0
                                            ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                            : 'bg-primary text-white hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 active:shadow-none'
                                        }`}
                                    >
                                        {loading ? 'Processing...' : 'Submit Order'}
                                    </button>
                                </div>
                            </div>

                            {!isPaid && selectedVisit?.patient?.paymentMethod === 'cash' && (
                                <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[30px] flex items-center gap-6 animate-fade-in relative overflow-hidden">
                                    <AlertCircle className="w-8 h-8 text-orange-500 relative z-10" />
                                    <p className="text-[11px] font-black text-orange-100/80 uppercase tracking-widest leading-relaxed relative z-10">
                                        Imaging procedures require upfront clearance. <br />
                                        <span className="text-orange-400 font-mono italic">Standard Hospital Revenue Policy #101 Enforced.</span>
                                    </p>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RadiologyRequestForm;
