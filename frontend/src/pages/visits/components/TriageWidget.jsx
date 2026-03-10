import React, { useState, useEffect } from 'react';
import { vitalsAPI } from '../../../services/apiService';
import { Activity, Heart, Thermometer, Wind, Scale, Save, CheckCircle2 } from 'lucide-react';

const TriageWidget = ({ visitId, patientId, queueStatus, onVitalsSaved }) => {
    const [loading, setLoading] = useState(false);
    const [vitals, setVitals] = useState(null);
    const [form, setForm] = useState({
        bloodPressure: '',
        temperature: '',
        pulse: '',
        respiratoryRate: '',
        spo2: '',
        weight: '',
        height: '',
        bmi: '',
        notes: ''
    });

    useEffect(() => {
        const loadVitals = async () => {
            try {
                const res = await vitalsAPI.getByVisit(visitId);
                setVitals(res.data);
            } catch (err) {
                // If 404, no vitals recorded yet.
            }
        };
        loadVitals();
    }, [visitId]);

    const calculateBMI = (w, h) => {
        if (!w || !h) return '';
        const wNum = parseFloat(w);
        const hNum = parseFloat(h) / 100; // cm to m
        if (hNum > 0) return (wNum / (hNum * hNum)).toFixed(1);
        return '';
    };

    const handleFormChange = (k, v) => {
        setForm(prev => {
            const next = { ...prev, [k]: v };
            if (k === 'weight' || k === 'height') {
                next.bmi = calculateBMI(next.weight || prev.weight, next.height || prev.height);
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                visitId,
                patientId,
                ...form
            };
            const res = await vitalsAPI.create(payload);
            setVitals(res.data);
            if (onVitalsSaved) onVitalsSaved();
        } catch (err) {
            alert('Failed to save vitals');
        } finally {
            setLoading(false);
        }
    };

    if (vitals) {
        return (
            <div className="card p-5 bg-gradient-to-br from-blue-900 to-indigo-900 border border-blue-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-accent" /> Triage Completed
                    </h3>
                    <span className="text-xs text-white opacity-70 font-medium">Recorded by {vitals.recordedBy?.firstName} {vitals.recordedBy?.lastName}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-400 p-1.5 bg-red-500/10 rounded-lg" />
                        <div><p className="text-xs text-white opacity-60">BP</p><p className="font-bold text-white">{vitals.bloodPressure || '—'}</p></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                        <Thermometer className="w-8 h-8 text-orange-400 p-1.5 bg-orange-500/10 rounded-lg" />
                        <div><p className="text-xs text-white opacity-60">Temp</p><p className="font-bold text-white">{vitals.temperature ? `${vitals.temperature}°C` : '—'}</p></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-green-500 p-1.5 bg-green-500/10 rounded-lg" />
                        <div><p className="text-xs text-white opacity-60">Pulse / SpO2</p><p className="font-bold text-white">{vitals.pulse || '—'} / {vitals.spo2 ? `${vitals.spo2}%` : '—'}</p></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                        <Scale className="w-8 h-8 text-purple-400 p-1.5 bg-purple-500/10 rounded-lg" />
                        <div><p className="text-xs text-white opacity-60">Weight / BMI</p><p className="font-bold text-white">{vitals.weight || '—'}kg / {vitals.bmi || '—'}</p></div>
                    </div>
                </div>
            </div>
        );
    }

    if (queueStatus !== 'pending_triage') return null;

    return (
        <div className="card p-5 border border-orange-200 shadow-[0_0_15px_rgba(251,146,60,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" /> Record Vitals (Triage)
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="form-group">
                        <label className="form-label text-xs">Blood Pressure (mmHg)</label>
                        <input type="text" placeholder="120/80" value={form.bloodPressure} onChange={e => handleFormChange('bloodPressure', e.target.value)} className="form-input py-1.5 text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Temperature (°C)</label>
                        <input type="number" step="0.1" placeholder="36.5" value={form.temperature} onChange={e => handleFormChange('temperature', e.target.value)} className="form-input py-1.5 text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Pulse (bpm)</label>
                        <input type="number" placeholder="72" value={form.pulse} onChange={e => handleFormChange('pulse', e.target.value)} className="form-input py-1.5 text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">SpO2 (%)</label>
                        <input type="number" placeholder="98" value={form.spo2} onChange={e => handleFormChange('spo2', e.target.value)} className="form-input py-1.5 text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Resp. Rate (bpm)</label>
                        <input type="number" placeholder="16" value={form.respiratoryRate} onChange={e => handleFormChange('respiratoryRate', e.target.value)} className="form-input py-1.5 text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Weight (kg)</label>
                        <input type="number" step="0.1" placeholder="70.5" value={form.weight} onChange={e => handleFormChange('weight', e.target.value)} className="form-input py-1.5 text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Height (cm)</label>
                        <input type="number" step="0.1" placeholder="175" value={form.height} onChange={e => handleFormChange('height', e.target.value)} className="form-input py-1.5 text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs text-white opacity-80">BMI</label>
                        <input type="number" disabled value={form.bmi} className="form-input py-1.5 text-sm bg-white/5 border-white/10 text-white" />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loading} className="btn btn-primary bg-orange-500 hover:bg-orange-600 border-orange-500 text-sm py-1.5">
                        <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Vitals & Send to Doctor'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TriageWidget;
