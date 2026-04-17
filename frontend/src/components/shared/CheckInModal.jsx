import React, { useState, useEffect } from 'react';
import { 
    X, 
    ChevronRight, 
    Building2, 
    Stethoscope, 
    FlaskConical, 
    Pill, 
    Scissors, 
    Baby, 
    Search, 
    Loader2, 
    CircleCheckBig,
    CreditCard,
    ArrowRight
} from 'lucide-react';
import { setupAPI, visitAPI } from '../../services/apiService';
import { useToast } from '../../context/ToastContext';

const DEPT_ICONS = {
    'Outpatient Department': Stethoscope,
    'Laboratory': FlaskConical,
    'Pharmacy': Pill,
    'Radiology': Search,
    'Specialist Clinic': Stethoscope,
    'Maternity': Baby,
    'Theatre': Scissors,
    'OPD': Stethoscope
};

const CATEGORY_MAP = {
    'Laboratory': 'laboratory',
    'Radiology': 'radiology',
    'Outpatient Department': 'opd',
    'OPD': 'opd',
    'Inpatient Department': 'ipd',
    'Specialist Clinic': 'opd'
};

const CheckInModal = ({ patient, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [reason, setReason] = useState('Consultation/Service');
    const [registryFee, setRegistryFee] = useState(patient?.referralType === 'bypass' ? 50 : 0);
    const [searchTerms, setSearchTerms] = useState({ dept: '', service: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoadingData(true);
            const [deptRes, serviceRes] = await Promise.all([
                setupAPI.departments.getAll(),
                setupAPI.setupAPI?.services?.getAll() || setupAPI.services.getAll()
            ]);
            
            const depts = deptRes.data || [];
            setDepartments(depts);
            setServices(serviceRes.data || []);

            // Auto-select OPD as default
            const opd = depts.find(d => d.departmentName?.toLowerCase().includes('outpatient'));
            if (opd) setSelectedDept(opd);

        } catch (error) {
            console.error('Failed to load check-in data:', error);
            addToast('Failed to load departments or services', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const handleCheckIn = async () => {
        if (!selectedDept || !selectedService) {
            addToast('Please select both a department and a service', 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                patientId: patient.id,
                departmentId: selectedDept.id,
                assignedDepartment: selectedDept.departmentName,
                serviceId: selectedService.id,
                reasonForVisit: reason,
                registryFee: Number(registryFee)
            };

            const response = await visitAPI.createConsultation(payload);
            addToast(response.data.message || 'Patient checked in successfully', 'success');
            onSuccess(response.data.visit);
            onClose();
        } catch (error) {
            console.error('Check-in failed:', error);
            addToast(error.response?.data?.error || 'Failed to check in patient', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredDepts = departments.filter(d => 
        d.departmentName?.toLowerCase().includes(searchTerms.dept.toLowerCase())
    );

    const filteredServices = services.filter(s => {
        const matchesSearch = s.serviceName?.toLowerCase().includes(searchTerms.service.toLowerCase());
        const mappedCat = CATEGORY_MAP[selectedDept?.departmentName];
        if (!mappedCat) return matchesSearch;
        return matchesSearch && s.category === mappedCat;
    });

    if (loadingData) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-bg-secondary p-10 rounded-3xl border border-white/10 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Initializing Check-In...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#0F0F0F] w-full max-w-4xl max-h-[90vh] rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col scale-in-center">
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <CircleCheckBig className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Patient Check-In</h2>
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                {patient?.firstName} {patient?.lastName} <span className="text-white/20">•</span> {patient?.patientNumber}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group"
                    >
                        <X className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Panel: Configuration */}
                    <div className="p-8 border-r border-white/5 flex flex-col gap-8 w-full lg:w-[400px]">
                        
                        {/* Summary Card */}
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Current Selection</h3>
                            
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    {(() => {
                                        const Icon = DEPT_ICONS[selectedDept?.departmentName] || Building2;
                                        return <Icon className="w-4 h-4 text-primary" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-text-secondary">Destination</p>
                                    <p className="text-sm font-black text-white">{selectedDept?.departmentName || 'Not Selected'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                                    <Search className="w-4 h-4 text-accent" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-text-secondary">Initial Service</p>
                                    <p className="text-sm font-black text-white truncate max-w-[200px]">{selectedService?.serviceName || 'Package Selected'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Registry Fee Input */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary flex items-center gap-2">
                                <CreditCard className="w-3 h-3" /> System Registry Fee (K)
                            </label>
                            <input 
                                type="number" 
                                className="form-input text-2xl font-black py-4 bg-white/[0.03] border-white/10"
                                value={registryFee}
                                onChange={e => setRegistryFee(e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-[10px] font-medium text-white/20 italic italic">
                                * K50 is the standard fee for new system entries.
                            </p>
                        </div>

                        {/* Reason / Notes */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Reason for Visit</label>
                            <textarea 
                                className="form-input min-h-[100px] bg-white/[0.03] border-white/10 text-sm"
                                placeholder="Add clinical notes or reason for visit..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right Panel: Selectors */}
                    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
                        
                        {/* Step 1: Department */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-white flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs">1</span> 
                                    Select Target Department
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                    <input 
                                        type="text" 
                                        placeholder="Search..." 
                                        className="bg-white/5 border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white"
                                        value={searchTerms.dept}
                                        onChange={e => setSearchTerms({...searchTerms, dept: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredDepts.map(dept => {
                                    const Icon = DEPT_ICONS[dept.departmentName] || Building2;
                                    const isSelected = selectedDept?.id === dept.id;
                                    return (
                                        <button
                                            key={dept.id}
                                            onClick={() => {
                                                setSelectedDept(dept);
                                                setSelectedService(null);
                                            }}
                                            className={`p-4 rounded-[24px] border transition-all text-left flex items-center gap-4 group ${
                                                isSelected 
                                                ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(255,0,204,0.1)]' 
                                                : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                                isSelected ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-white/10'
                                            }`}>
                                                <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-white/40'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-black text-sm uppercase tracking-wider ${isSelected ? 'text-white' : 'text-white/80'}`}>
                                                    {dept.departmentName}
                                                </p>
                                                <p className="text-[10px] text-white/40 font-bold">Standard Queue</p>
                                            </div>
                                            {isSelected && <ArrowRight className="w-4 h-4 text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 2: Service */}
                        <div className="space-y-4 pb-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-white flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs">2</span> 
                                    Select Service / Bill Item
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                    <input 
                                        type="text" 
                                        placeholder="Search services..." 
                                        className="bg-white/5 border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white"
                                        value={searchTerms.service}
                                        onChange={e => setSearchTerms({...searchTerms, service: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {filteredServices.length > 0 ? filteredServices.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelectedService(service)}
                                        className={`px-6 py-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                                            selectedService?.id === service.id
                                            ? 'bg-accent/10 border-accent'
                                            : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`w-2 h-2 rounded-full ${selectedService?.id === service.id ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
                                            <div>
                                                <p className={`text-sm font-bold ${selectedService?.id === service.id ? 'text-white' : 'text-white/60'}`}>
                                                    {service.serviceName}
                                                </p>
                                                <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-black">{service.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-accent">K {Number(service.price).toLocaleString()}</p>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="p-10 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">No matching services found for {selectedDept?.departmentName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                    <button 
                        onClick={onClose}
                        className="btn btn-secondary px-8 rounded-2xl"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    
                    <button 
                        onClick={handleCheckIn}
                        className="btn bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(255,0,204,0.2)] hover:shadow-[0_0_40px_rgba(255,0,204,0.4)] disabled:opacity-50 disabled:grayscale transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        disabled={loading || !selectedDept || !selectedService}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                        <span className="font-black uppercase tracking-widest text-base">Complete Check-In</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckInModal;
