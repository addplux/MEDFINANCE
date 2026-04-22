import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { maternityAPI, patientAPI, visitAPI, setupAPI } from '../../services/apiService';
import { ArrowLeft, Save, Search, User, Baby, DollarSign, FileText, Calendar, Activity, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import PatientSearchSelect from '../../components/shared/PatientSearchSelect';

const SidebarQueue = ({ onSelect, selectedVisitId }) => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const response = await visitAPI.getDepartmentQueue('Maternity');
            setQueue(response.data || []);
        } catch (error) {
            console.error('Error fetching maternity queue:', error);
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
                        <Clock className="w-3 h-3" /> Maternity Queue
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
                            No patients<br />waiting for maternity
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
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.1] hover:border-white/10'
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

const MaternityBillForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const paramPatientId = searchParams.get('patientId');
    const paramVisitId = searchParams.get('visitId');

    const [selectedVisit, setSelectedVisit] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        patientId: paramPatientId || '',
        visitId: paramVisitId || '',
        admissionDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        deliveryType: 'normal',
        doctorName: '',
        nurseName: '',
        bedCharges: 0,
        deliveryCharges: 0,
        doctorFees: 0,
        nurseFees: 0,
        medications: 0,
        labTests: 0,
        notes: ''
    });

    // Baby Details (JSON field)
    const [babyDetails, setBabyDetails] = useState({
        name: '',
        gender: 'male',
        weight: '',
        timeOfBirth: '',
        status: 'healthy'
    });

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            if (paramVisitId) {
                try {
                    const visitRes = await visitAPI.getById(paramVisitId);
                    const visit = visitRes.data;
                    setSelectedVisit(visit);
                    setFormData(prev => ({
                        ...prev,
                        patientId: visit.patientId,
                        visitId: visit.id,
                        doctorName: visit.assignedDoctor?.firstName ? `Dr. ${visit.assignedDoctor.firstName} ${visit.assignedDoctor.lastName}` : ''
                    }));
                } catch (error) {
                    console.error('Failed to load visit details:', error);
                }
            } else if (paramPatientId) {
                try {
                    const response = await patientAPI.getById(paramPatientId);
                    setSelectedVisit({ patient: response.data, patientId: response.data.id });
                    setFormData(prev => ({ ...prev, patientId: response.data.id }));
                } catch (error) {
                    console.error('Failed to load patient from URL:', error);
                }
            }
        };
        loadInitialData();
    }, [paramVisitId, paramPatientId]);

    const handlePatientSelect = (visit) => {
        setSelectedVisit(visit);
        setFormData(prev => ({
            ...prev,
            patientId: visit.patientId,
            visitId: visit.id,
            doctorName: visit.assignedDoctor?.firstName ? `Dr. ${visit.assignedDoctor.firstName} ${visit.assignedDoctor.lastName}` : ''
        }));
    };

    const calculateTotal = () => {
        return (
            parseFloat(formData.bedCharges || 0) +
            parseFloat(formData.deliveryCharges || 0) +
            parseFloat(formData.doctorFees || 0) +
            parseFloat(formData.nurseFees || 0) +
            parseFloat(formData.medications || 0) +
            parseFloat(formData.labTests || 0)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId) {
            alert('Please select a patient from the queue');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                totalAmount: calculateTotal(),
                babyDetails: babyDetails
            };

            await maternityAPI.bills.create(payload);

            // Automatically notify cashier if visitId is available
            if (formData.visitId) {
                await visitAPI.update(formData.visitId, { queueStatus: 'pending_cashier' });
            }

            navigate('/app/maternity');
        } catch (error) {
            console.error('Failed to create bill:', error);
            alert('Failed to create bill. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isPaid = selectedVisit?.billingSummary?.status === 'paid' || selectedVisit?.patient?.paymentMethod !== 'cash';

    return (
        <div className="flex h-full overflow-hidden bg-black/20 rounded-2xl border border-white/5 animate-fade-in">
            <SidebarQueue onSelect={handlePatientSelect} selectedVisitId={formData.visitId} />

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                            Maternity <span className="text-primary">Process</span>
                        </h1>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                            Record delivery records & financial entries
                        </p>
                    </div>

                    {!formData.visitId && !paramPatientId ? (
                        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                            <Baby className="w-12 h-12 text-white/10 mb-4 animate-bounce" />
                            <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Select an expectant mother from the queue</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                            {/* Mother's Info Card */}
                            <div className="p-8 rounded-[40px] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <User className="w-32 h-32 text-white" />
                                </div>
                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Patient Record</div>
                                        <h2 className="text-4xl font-black text-white uppercase tracking-tight italic">
                                            {selectedVisit?.patient?.firstName} {selectedVisit?.patient?.lastName}
                                        </h2>
                                        <div className="flex gap-4 mt-6 text-[11px] font-black uppercase tracking-[0.15em] text-white/40">
                                            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10"># {selectedVisit?.patient?.patientNumber}</span>
                                            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">{selectedVisit?.visitNumber || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                                            isPaid 
                                            ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                                            : 'bg-orange-500/20 text-orange-400 border-orange-500/20'
                                        }`}>
                                            {isPaid ? 'Cleared' : 'Payment Pending'}
                                        </div>
                                        {!isPaid && (
                                            <div className="mt-3 text-[10px] font-black text-orange-400/60 uppercase tracking-tighter flex items-center justify-end gap-2">
                                                <AlertCircle className="w-3 h-3" /> Gate Policy Active
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Delivery Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Delivery Info</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Delivery Type</label>
                                                <select
                                                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-primary/20 appearance-none italic"
                                                    value={formData.deliveryType}
                                                    onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="c-section">C-Section</option>
                                                    <option value="assisted">Assisted</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Admission Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white italic"
                                                    value={formData.admissionDate}
                                                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Primary Clinician</label>
                                            <input
                                                type="text"
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white italic"
                                                value={formData.doctorName}
                                                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Baby Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Baby Record</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Gender</label>
                                            <select
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-primary/20 italic"
                                                value={babyDetails.gender}
                                                onChange={(e) => setBabyDetails({ ...babyDetails, gender: e.target.value })}
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Weight (KG)</label>
                                            <input
                                                type="text"
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white italic"
                                                value={babyDetails.weight}
                                                onChange={(e) => setBabyDetails({ ...babyDetails, weight: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Output / Status</label>
                                            <select
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white italic"
                                                value={babyDetails.status}
                                                onChange={(e) => setBabyDetails({ ...babyDetails, status: e.target.value })}
                                            >
                                                <option value="healthy">Healthy</option>
                                                <option value="nicu">NICU Admission</option>
                                                <option value="observation">Observation</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Financial Data (K)</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Delivery', 'Bed', 'Doctor', 'Nurse'].map((label) => (
                                        <div key={label} className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">{label}</label>
                                            <input
                                                type="number"
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white italic"
                                                value={formData[`${label.toLowerCase()}${label === 'Bed' ? 'Charges' : (label === 'Delivery' ? 'Charges' : 'Fees')}`]}
                                                onChange={(e) => setFormData({ ...formData, [`${label.toLowerCase()}${label === 'Bed' ? 'Charges' : (label === 'Delivery' ? 'Charges' : 'Fees')}`]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-10 rounded-[50px] bg-white/[0.03] border border-white/10 flex items-center justify-between shadow-inner">
                                <div>
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 font-mono italic">Grand Total Projection</div>
                                    <div className="text-5xl font-black text-white tracking-tighter italic">
                                        ZK {calculateTotal().toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/app/maternity')}
                                        className="h-16 px-10 rounded-full text-[11px] font-black uppercase tracking-widest text-white/40 border border-white/5 hover:bg-white/5 transition-all italic underline-offset-8 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || (!isPaid && selectedVisit?.patient?.paymentMethod === 'cash')}
                                        className={`h-16 px-14 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all italic ${
                                            loading || (!isPaid && selectedVisit?.patient?.paymentMethod === 'cash')
                                            ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                            : 'bg-primary text-white hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 active:shadow-none'
                                        }`}
                                    >
                                        {loading ? 'Committing...' : 'Commit Record'}
                                    </button>
                                </div>
                            </div>

                            {!isPaid && selectedVisit?.patient?.paymentMethod === 'cash' && (
                                <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[30px] flex items-center gap-6 animate-fade-in relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent"></div>
                                    <AlertCircle className="w-8 h-8 text-orange-500 relative z-10" />
                                    <p className="text-[11px] font-black text-orange-100/80 uppercase tracking-widest leading-relaxed relative z-10">
                                        Admission pending cashier clearance. <br />
                                        <span className="text-orange-400 font-mono italic">Standard Hospital Revenue Policy #402 Enforced.</span>
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

export default MaternityBillForm;
