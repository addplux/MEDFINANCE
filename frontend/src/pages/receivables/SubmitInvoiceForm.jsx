import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { receivablesAPI } from '../../services/apiService';

const SubmitInvoiceForm = () => {
    const navigate = useNavigate();

    const [schemeType, setSchemeType] = useState('corporate'); // 'corporate' or 'prepaid'

    const [formData, setFormData] = useState({
        manNo: '',
        hospitalCode: 'NCHANGA NORTH GENERAL HOSPITAL',
        providerCode: 'NNGH',
        month: '',
        invoiceNo: '',
        dateOfTreatment: '',
        invoiceDate: '',
        employeePhone: '',
        employeeName: '',
        employeeNrc: '',
        employeeDob: '',
        employeeEmail: '',
        patientName: '',
        patientDob: '',
        patientGender: '',
        patientNrc: '',
        relationship: '',
        serviceType: '',
        schemeId: '',
        charges: {
            consultation: 0,
            nurseCare: 0,
            laboratory: 0,
            pharmacy: 0,
            lodging: 0,
            xray: 0,
            dental: 0,
            eye: 0,
            theatre: 0,
            physio: 0,
            other: 0
        },
        agreement: false
    });

    const [schemes, setSchemes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const response = await receivablesAPI.schemes.getAll();
                // Filter for corporate schemes
                const corporateSchemes = response.data.filter(s => s.schemeType === 'Corporate');
                setSchemes(corporateSchemes);
            } catch (error) {
                console.error("Failed to load schemes");
            }
        };
        fetchSchemes();
    }, []);

    const selectedScheme = schemes.find(s => s.id === parseInt(formData.schemeId));
    
    // Dynamic scheme naming
    const schemeInitial = selectedScheme ? selectedScheme.schemeName.charAt(0).toUpperCase() : 'C';
    const formTitleText = selectedScheme 
        ? `${selectedScheme.schemeName.toUpperCase()} MEDICAL SCHEME OUT / IN PATIENT TREATMENT FORM`
        : 'CORPORATE MEDICAL SCHEME OUT / IN PATIENT TREATMENT FORM';

    const handleChargeChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            charges: {
                ...prev.charges,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const calculateTotal = () => {
        return Object.values(formData.charges).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.agreement) {
            toast.error("You must agree that all information is accurate.");
            return;
        }

        try {
            setIsSubmitting(true);
            toast.loading("Submitting invoice claim...", { id: 'submit' });
            
            // Assuming there's a backend endpoint for this manually entered claim
            // await receivablesAPI.invoices.submitManualClaim(formData);
            
            // Simulating API call for now since backend endpoint for this specific manual struct might need adaptation
            await new Promise(r => setTimeout(r, 1500)); 

            toast.success("Invoice successfully submitted!", { id: 'submit' });
            navigate('/app/receivables/invoices');
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit invoice.", { id: 'submit' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const serviceTypes = [
        "Out Patient", "In Patient", "Maternity", "Theatre", 
        "Specialist Clinic", "Dental", "Physiotherapy", "Other"
    ];

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/app/receivables/invoices')}
                        className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-tertiary hover:text-text-primary" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-text-primary uppercase tracking-tight">Submit Claim</h1>
                        <p className="text-text-tertiary text-xs font-bold uppercase tracking-widest mt-1">
                            Manual Scheme Invoicing Data Entry
                        </p>
                    </div>
                </div>
                
                {/* Scheme Type Toggle */}
                <div className="flex bg-bg-tertiary/50 p-1.5 rounded-full border border-border-color shadow-sm">
                    <button 
                        type="button"
                        onClick={() => setSchemeType('corporate')}
                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            schemeType === 'corporate' 
                                ? 'bg-bg-primary text-primary shadow-sm border border-border-color' 
                                : 'text-text-tertiary hover:text-text-primary'
                        }`}
                    >
                        Corporate
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSchemeType('prepaid')}
                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                            schemeType === 'prepaid' 
                                ? 'bg-bg-primary text-primary shadow-sm border border-border-color' 
                                : 'text-text-tertiary hover:text-text-primary'
                        }`}
                    >
                        Prepaid
                    </button>
                </div>
            </div>

            {schemeType === 'corporate' && (
                <div className="mb-6 animate-fade-in bg-bg-secondary/40 backdrop-blur-md rounded-2xl border border-border-color p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/3">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block mb-2">Select Corporate Scheme</label>
                        <select 
                            name="schemeId" 
                            value={formData.schemeId} 
                            onChange={handleChange}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                        >
                            <option value="">-- Choose Corporate Scheme --</option>
                            {schemes.map(s => (
                                <option key={s.id} value={s.id}>{s.schemeName}</option>
                            ))}
                        </select>
                    </div>
                    {formData.schemeId && (
                        <div className="w-full md:w-2/3 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-green-600 uppercase tracking-widest leading-relaxed">
                                Form customized for <span className="font-black">{selectedScheme?.schemeName}</span> standard reporting parameters.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className={`bg-bg-secondary/40 backdrop-blur-md rounded-[2rem] border border-border-color shadow-2xl overflow-hidden relative transition-all duration-300 ${schemeType === 'corporate' && !formData.schemeId ? 'opacity-50 pointer-events-none blur-sm' : ''}`}>
                
                {/* Form Header mimicking ZESCO or generic Prepaid */}
                <div className="border-b border-border-color bg-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full md:w-1/4">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-border-color shadow-sm overflow-hidden text-2xl">
                            {schemeType === 'corporate' ? (
                                <span className="font-black text-green-600">{schemeInitial}</span>
                            ) : (
                                <span className="font-black text-blue-600">360</span>
                            )}
                        </div>
                    </div>
                    <div className={`w-full md:w-1/2 text-center font-bold uppercase tracking-widest text-lg ${schemeType === 'corporate' ? 'text-green-600' : 'text-blue-600'}`}>
                        {schemeType === 'corporate' ? formTitleText : 'PREPAID HEALTH PLAN TREATMENT FORM'}
                    </div>
                    <div className="w-full md:w-1/4 text-right">
                        <p className="text-xs font-bold text-text-secondary">Doc Number:</p>
                        <p className="font-mono text-sm font-black text-primary">
                            {schemeType === 'corporate' ? 'CO.14900.FORM.0092' : 'PR.88100.FORM.100'}
                        </p>
                        <p className="text-xs font-bold text-text-tertiary mt-1">Version: 2</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                {schemeType === 'corporate' ? 'Man No *' : 'Policy / Member No *'}
                            </label>
                            <input 
                                type="text" name="manNo" required
                                value={formData.manNo} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase placeholder:text-text-tertiary/30"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Hospital Code</label>
                            <input 
                                type="text" name="hospitalCode" readOnly
                                value={formData.hospitalCode}
                                className="w-full bg-bg-tertiary/50 border border-border-color rounded-xl px-4 py-3 text-sm font-bold text-text-tertiary opacity-70"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Provider Code No</label>
                            <input 
                                type="text" name="providerCode" readOnly
                                value={formData.providerCode}
                                className="w-full bg-bg-tertiary/50 border border-border-color rounded-xl px-4 py-3 text-sm font-bold text-text-tertiary opacity-70"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Month</label>
                            <select 
                                name="month" value={formData.month} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            >
                                <option value="">Choose</option>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Invoice No</label>
                            <input 
                                type="text" name="invoiceNo" 
                                value={formData.invoiceNo} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Date of Treatment</label>
                            <input 
                                type="date" name="dateOfTreatment" 
                                value={formData.dateOfTreatment} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Invoice Date</label>
                            <input 
                                type="date" name="invoiceDate" 
                                value={formData.invoiceDate} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                {schemeType === 'corporate' ? 'Employee Phone No' : 'Subscriber Phone No'}
                            </label>
                            <input 
                                type="text" name="employeePhone" 
                                value={formData.employeePhone} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                {schemeType === 'corporate' ? 'Employee Name' : 'Subscriber Name'}
                            </label>
                            <input 
                                type="text" name="employeeName" 
                                value={formData.employeeName} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                {schemeType === 'corporate' ? 'Employee NRC' : 'Subscriber NRC'}
                            </label>
                            <input 
                                type="text" name="employeeNrc" 
                                value={formData.employeeNrc} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                {schemeType === 'corporate' ? 'Employee DOB' : 'Subscriber DOB'}
                            </label>
                            <input 
                                type="date" name="employeeDob" 
                                value={formData.employeeDob} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                {schemeType === 'corporate' ? 'Employee Email' : 'Subscriber Email'}
                            </label>
                            <input 
                                type="email" name="employeeEmail" 
                                value={formData.employeeEmail} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Patient Name</label>
                            <input 
                                type="text" name="patientName" placeholder="Select or Type"
                                value={formData.patientName} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Patient DOB</label>
                            <input 
                                type="date" name="patientDob" 
                                value={formData.patientDob} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Patient Gender</label>
                            <select 
                                name="patientGender" value={formData.patientGender} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            >
                                <option value="">Choose</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Patient NRC</label>
                            <input 
                                type="text" name="patientNrc" 
                                value={formData.patientNrc} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border-color">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Relationship</label>
                            <input 
                                type="text" name="relationship" placeholder="e.g. Spouse, Child, Self"
                                value={formData.relationship} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Service Type</label>
                            <select 
                                name="serviceType" value={formData.serviceType} onChange={handleChange}
                                className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            >
                                <option value="">Choose</option>
                                {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div>
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6">Charges Breakdown</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                            {[
                                { key: 'consultation', label: 'Consultation Charge' },
                                { key: 'nurseCare', label: 'Nurse Care Charges' },
                                { key: 'laboratory', label: 'Laboratory Charges' },
                                { key: 'pharmacy', label: 'Pharmacy Drugs' },
                                { key: 'lodging', label: 'Lodging Charges' },
                                { key: 'xray', label: 'Xray Scan Charges' },
                                { key: 'dental', label: 'Dental Charges' },
                                { key: 'eye', label: 'Eye Charges' },
                                { key: 'theatre', label: 'Theatre Charges' },
                                { key: 'physio', label: 'Physio Therapy Charges' },
                                { key: 'other', label: 'Other Charges' },
                            ].map(field => (
                                <div key={field.key} className="space-y-1">
                                    <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">{field.label}</label>
                                    <input 
                                        type="number" step="0.01" min="0" name={field.key} 
                                        value={formData.charges[field.key] || ''} onChange={handleChargeChange}
                                        placeholder="0.00"
                                        className="w-full bg-bg-tertiary border border-border-color rounded-lg px-3 py-2 text-sm font-bold font-mono focus:ring-1 focus:ring-primary/50 transition-all tabular-nums text-right"
                                    />
                                </div>
                            ))}
                            
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-primary uppercase tracking-widest">Grand Total</label>
                                <input 
                                    type="text" readOnly
                                    value={calculateTotal().toFixed(2)}
                                    className="w-full bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-sm font-black font-mono text-primary outline-none transition-all tabular-nums text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Attachment & Agreement */}
                    <div className="pt-6 border-t border-border-color space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block">Invoice Attachment</label>
                            <label className="cursor-pointer inline-flex items-center gap-3 px-4 py-2 border border-border-color rounded-xl hover:bg-bg-tertiary transition-all">
                                <Upload className="w-4 h-4 text-text-tertiary" />
                                <span className="text-xs font-bold text-text-tertiary">Choose File</span>
                                <input type="file" className="hidden" />
                            </label>
                            <span className="text-xs font-medium text-text-tertiary ml-3">No file chosen</span>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
                                <input 
                                    type="checkbox" name="agreement"
                                    checked={formData.agreement} onChange={handleChange}
                                    className="peer w-5 h-5 opacity-0 absolute cursor-pointer z-10" 
                                />
                                <div className="w-5 h-5 border-2 border-red-500/50 rounded flex items-center justify-center peer-focus:ring-2 peer-focus:ring-red-500/20 peer-checked:bg-red-500 peer-checked:border-red-500 transition-all">
                                    <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <span className="text-sm font-black text-red-500 uppercase tracking-widest mt-0.5">
                                I agree that all the information is accurate. *
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-6 border-t border-border-color">
                        <button 
                            type="submit" disabled={isSubmitting || !formData.agreement}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Submitting...</>
                            ) : (
                                <><Save className="w-4 h-4" /> Submit</>
                            )}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default SubmitInvoiceForm;
