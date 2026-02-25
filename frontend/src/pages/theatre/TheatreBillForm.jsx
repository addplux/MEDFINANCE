import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theatreAPI, patientAPI, setupAPI } from '../../services/apiService';
import { Save, X, User } from 'lucide-react';

const TheatreBillForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patientId: '',
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
    const [patients, setPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);
    const [selectedPatientName, setSelectedPatientName] = useState('');

    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [servicesRes, patientsRes] = await Promise.all([
                    setupAPI.services.getAll(),
                    patientAPI.getAll()
                ]);

                const allServices = servicesRes?.data?.data || servicesRes?.data || [];
                setServices(allServices.filter(s => s.department === 'Theatre' || s.category === 'theatre'));

                setPatients(patientsRes?.data?.data || patientsRes?.data || []);
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadInitialData();
    }, []);

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
            navigate('/app/theatre/dashboard');
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">New Theatre Bill</h1>
                    <p className="text-text-secondary">Create a new surgical procedure bill</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group relative">
                        <label className="label">Patient *</label>
                        {formData.patientId ? (
                            <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg border border-border-color">
                                <User className="w-4 h-4 text-primary" />
                                <span className="flex-1 font-medium">{selectedPatientName}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, patientId: '' });
                                        setSelectedPatientName('');
                                        setPatientSearch('');
                                    }}
                                    className="text-text-secondary hover:text-error transition-colors text-lg leading-none"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    placeholder="Search patient by name or ID..."
                                    value={patientSearch}
                                    onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                                    onFocus={() => setShowPatientList(true)}
                                    required
                                />
                                {showPatientList && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-color rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {(patients || [])
                                            .filter(p =>
                                                !patientSearch ||
                                                `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                                (p.patientNumber || '').toLowerCase().includes(patientSearch.toLowerCase())
                                            )
                                            .slice(0, 20)
                                            .map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2.5 hover:bg-primary/10 text-sm flex items-center gap-2 transition-colors"
                                                    onMouseDown={() => {
                                                        setFormData({ ...formData, patientId: p.id });
                                                        setSelectedPatientName(`${p.patientNumber ? p.patientNumber + ' — ' : ''}${p.firstName} ${p.lastName}`);
                                                        setPatientSearch('');
                                                        setShowPatientList(false);
                                                    }}
                                                >
                                                    <span className="text-xs text-text-secondary w-20 shrink-0">{p.patientNumber}</span>
                                                    <span className="font-medium">{p.firstName} {p.lastName}</span>
                                                </button>
                                            ))}
                                        {patients.filter(p =>
                                            !patientSearch ||
                                            `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                            (p.patientNumber || '').toLowerCase().includes(patientSearch.toLowerCase())
                                        ).length === 0 && (
                                                <div className="px-4 py-3 text-sm text-text-secondary">No patients found</div>
                                            )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="label">Procedure Date *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.procedureDate}
                            onChange={(e) => setFormData({ ...formData, procedureDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group md:col-span-2">
                        <label className="label">Procedure Type *</label>
                        <select
                            className="form-select w-full"
                            value={formData.procedureType}
                            onChange={handleServiceSelect}
                            required
                        >
                            <option value="">-- Select Surgical Procedure --</option>
                            {services.map(s => (
                                <option key={s.id} value={s.serviceName}>{s.serviceName}</option>
                            ))}
                            <option value="Other">Other (Custom Procedure)</option>
                        </select>
                        {formData.procedureType === 'Other' && (
                            <input
                                type="text"
                                className="form-input mt-2"
                                placeholder="Specify custom procedure"
                                onChange={(e) => setFormData({ ...formData, customProcedure: e.target.value })}
                                required
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label className="label">Surgeon Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.surgeonName}
                            onChange={(e) => setFormData({ ...formData, surgeonName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Anesthetist Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.anesthetistName}
                            onChange={(e) => setFormData({ ...formData, anesthetistName: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Theatre Charges (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.theatreCharges}
                            onChange={(e) => setFormData({ ...formData, theatreCharges: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Surgeon Fees (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.surgeonFees}
                            onChange={(e) => setFormData({ ...formData, surgeonFees: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Anesthetist Fees (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.anesthetistFees}
                            onChange={(e) => setFormData({ ...formData, anesthetistFees: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Consumables (K)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.consumables}
                            onChange={(e) => setFormData({ ...formData, consumables: e.target.value })}
                        />
                    </div>

                    <div className="form-group md:col-span-2">
                        <label className="label">Notes</label>
                        <textarea
                            className="form-textarea"
                            rows="3"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Amount:</span>
                        <span className="text-2xl font-bold text-primary-600">K{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/app/theatre/billing')}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Bill'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TheatreBillForm;
