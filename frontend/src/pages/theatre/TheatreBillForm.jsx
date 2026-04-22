import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { theatreAPI, patientAPI, setupAPI, visitAPI } from '../../services/apiService';
import { Save, X, User, Activity, Clock, ChevronRight, AlertCircle, Search } from 'lucide-react';
import PatientSearchSelect from '../../components/shared/PatientSearchSelect';

const SidebarQueue = ({ onSelect, selectedVisitId }) => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const response = await visitAPI.getDepartmentQueue('Theatre');
            setQueue(response.data || []);
        } catch (error) {
            console.error('Error fetching theatre queue:', error);
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
                        <Clock className="w-3 h-3" /> Theatre Queue
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
                            No patients<br />waiting for theatre
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
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
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

const TheatreBillForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const paramPatientId = searchParams.get('patientId');
    const paramVisitId = searchParams.get('visitId');

    const [formData, setFormData] = useState({
        patientId: paramPatientId || '',
        visitId: paramVisitId || '',
        procedureType: '',
        surgeonName: '',
        anesthetistName: '',
        procedureDate: new Date().toISOString().split('T')[0],
        theatreCharges: 0,
        surgeonFees: 0,
        anesthetistFees: 0,
        consumables: 0,
        notes: ''
    });
    const [services, setServices] = useState([]);
    const [selectedVisit, setSelectedVisit] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const servicesRes = await setupAPI.services.getAll();
                const allServices = servicesRes?.data?.data || servicesRes?.data || [];
                setServices(allServices.filter(s => s.department === 'Theatre' || s.category === 'theatre'));
                
                if (paramVisitId) {
                    const visitRes = await visitAPI.getById(paramVisitId);
                    setSelectedVisit(visitRes.data);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadInitialData();
    }, [paramVisitId]);

    const handlePatientSelect = (visit) => {
        setSelectedVisit(visit);
        setFormData(prev => ({
            ...prev,
            patientId: visit.patientId,
            visitId: visit.id,
            procedureType: visit.reasonForVisit === 'Consultation' ? '' : visit.reasonForVisit
        }));
    };

    const handleServiceSelect = (e) => {
        const serviceName = e.target.value;
        const selected = services.find(s => s.serviceName === serviceName);

        setFormData(prev => ({
            ...prev,
            procedureType: serviceName,
            theatreCharges: selected ? selected.price : prev.theatreCharges
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { ...formData };
            if (payload.procedureType === 'Other' && payload.customProcedure) {
                payload.procedureType = payload.customProcedure;
            }
            await theatreAPI.bills.create(payload);
            
            // Automatically notify cashier if visitId is available
            if (formData.visitId) {
                await visitAPI.update(formData.visitId, { queueStatus: 'pending_cashier' });
            }

            navigate('/app/theatre/billing');
        } catch (error) {
            console.error('Error creating theatre bill:', error);
            const detailMsg = error.response?.data?.details ? `: ${error.response.data.details}` : '';
            alert(`Failed to create theatre bill${detailMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = parseFloat(formData.theatreCharges || 0) +
        parseFloat(formData.surgeonFees || 0) +
        parseFloat(formData.anesthetistFees || 0) +
        parseFloat(formData.consumables || 0);

    return (
        <div className="flex h-full overflow-hidden bg-black/20 rounded-2xl border border-white/5 animate-fade-in">
            <SidebarQueue onSelect={handlePatientSelect} selectedVisitId={formData.visitId} />

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                            Theatre <span className="text-primary">Request</span>
                        </h1>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                            Process surgical assignments & billing
                        </p>
                    </div>

                    {!formData.visitId ? (
                        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                            <Activity className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
                            <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Select a patient from the queue to start</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                            {/* Patient Info Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <User className="w-24 h-24 text-white" />
                                </div>
                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Selected Patient</div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                                            {selectedVisit?.patient?.firstName} {selectedVisit?.patient?.lastName}
                                        </h2>
                                        <div className="flex gap-4 mt-4 text-[11px] font-black uppercase tracking-widest text-white/40">
                                            <span># {selectedVisit?.patient?.patientNumber}</span>
                                            <span className="text-white/10">•</span>
                                            <span className="text-white/60">{selectedVisit?.visitNumber}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg ${
                                            selectedVisit?.billingSummary?.status === 'paid' 
                                            ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                                            : 'bg-orange-500/20 text-orange-400 border-orange-500/20'
                                        }`}>
                                            {selectedVisit?.billingSummary?.status === 'paid' ? 'Paid' : 'Unpaid'}
                                        </div>
                                        {selectedVisit?.billingSummary?.status !== 'paid' && (
                                            <div className="mt-2 text-[9px] font-black text-orange-400/60 uppercase tracking-tighter">
                                                * Payment Gate Policy Active
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Procedure Type</label>
                                        <select
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-white/[0.08] transition-all"
                                            value={formData.procedureType}
                                            onChange={handleServiceSelect}
                                            required
                                        >
                                            <option value="">-- Select Procedure --</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.serviceName}>{s.serviceName}</option>
                                            ))}
                                            <option value="Other">Other (Custom Procedure)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Surgeon Name</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-primary/20"
                                            value={formData.surgeonName}
                                            onChange={(e) => setFormData({ ...formData, surgeonName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Procedure Date</label>
                                        <input
                                            type="date"
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-primary/20"
                                            value={formData.procedureDate}
                                            onChange={(e) => setFormData({ ...formData, procedureDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Theatre (K)</label>
                                            <input
                                                type="number"
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white"
                                                value={formData.theatreCharges}
                                                onChange={(e) => setFormData({ ...formData, theatreCharges: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Surgeon (K)</label>
                                            <input
                                                type="number"
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white"
                                                value={formData.surgeonFees}
                                                onChange={(e) => setFormData({ ...formData, surgeonFees: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Anesthetist Name</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white"
                                            value={formData.anesthetistName}
                                            onChange={(e) => setFormData({ ...formData, anesthetistName: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Notes / Indications</label>
                                        <textarea
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white h-24"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 flex items-center justify-between shadow-inner">
                                <div>
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Estimated Total</div>
                                    <div className="text-4xl font-black text-white tracking-tighter italic">
                                        K{totalAmount.toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/app/theatre/billing')}
                                        className="h-14 px-8 rounded-full text-xs font-black uppercase tracking-widest text-white/40 border border-white/5 hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || (selectedVisit?.billingSummary?.status !== 'paid' && selectedVisit?.patient?.paymentMethod === 'cash')}
                                        className={`h-14 px-10 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl transition-all ${
                                            loading || (selectedVisit?.billingSummary?.status !== 'paid' && selectedVisit?.patient?.paymentMethod === 'cash')
                                            ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                            : 'bg-primary text-white hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 active:shadow-none'
                                        }`}
                                    >
                                        {loading ? 'Processing...' : 'Complete Request'}
                                    </button>
                                </div>
                            </div>

                            {selectedVisit?.billingSummary?.status !== 'paid' && selectedVisit?.patient?.paymentMethod === 'cash' && (
                                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4 animate-bounce">
                                    <AlertCircle className="w-6 h-6 text-orange-500" />
                                    <p className="text-[11px] font-bold text-orange-100 uppercase tracking-wide">
                                        Patient must clear registry/clinic fees at the cashier before theatre processing.
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

export default TheatreBillForm;
