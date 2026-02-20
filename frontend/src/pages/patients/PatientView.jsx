import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI, receivablesAPI } from '../../services/apiService';
import {
    ArrowLeft, Edit, History, Phone, Mail, MapPin, User, CreditCard,
    Shield, Clipboard, Printer, Calendar, AlertCircle
} from 'lucide-react';

const TYPE_BADGE = {
    nhima: { label: 'NHIMA', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    cash: { label: 'Cash', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    corporate: { label: 'Corporate', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    private_prepaid: { label: 'Private Prepaid', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    staff: { label: 'Staff', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
    foc: { label: 'FOC', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    emergency: { label: 'Emergency', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    scheme: { label: 'Scheme', bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
    exempted: { label: 'Exempted', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
};

const InfoRow = ({ icon: Icon, label, value }) => (
    value ? (
        <div className="flex items-start gap-3 py-2">
            <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
                <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
        </div>
    ) : null
);

const Section = ({ title, children }) => (
    <div className="card p-5 space-y-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
        {children}
    </div>
);

const calcAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const PatientView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [res, schemesRes] = await Promise.all([
                    patientAPI.getById(id),
                    receivablesAPI.schemes.getAll({ status: 'active' }).catch(() => ({ data: [] }))
                ]);
                setPatient(res.data);
                setSchemes(schemesRes.data || []);
            } catch (err) {
                setError('Failed to load patient record.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-gray-400 animate-pulse">Loading patient record…</div>
        </div>
    );

    if (error || !patient) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-600">{error || 'Patient not found'}</p>
            <button onClick={() => navigate('/app/patients')} className="btn btn-secondary">Back to Patients</button>
        </div>
    );

    const badge = TYPE_BADGE[patient.paymentMethod] || { label: patient.paymentMethod, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    const age = calcAge(patient.dateOfBirth);
    const apiBase = import.meta.env.VITE_API_URL || '';

    return (
        <div className="space-y-5 pb-10">
            {/* Top nav */}
            <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => navigate('/app/patients')} className="btn btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Patient Master Record</h1>
                    <p className="text-sm text-gray-500">Complete patient profile and classification</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => navigate(`/app/patients/${id}/history`)}
                        className="btn btn-secondary"
                    >
                        <History className="w-4 h-4" />
                        Visit History
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="btn btn-secondary"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={() => navigate(`/app/patients/${id}/edit`)}
                        className="btn btn-primary"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </button>
                </div>
            </div>

            {/* Profile card */}
            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                        {patient.photoUrl ? (
                            <img
                                src={`${apiBase}${patient.photoUrl}`}
                                alt={patient.firstName}
                                className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <span className="text-white text-3xl font-bold">
                                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {patient.firstName} {patient.lastName}
                            </h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {badge.label}
                            </span>
                        </div>
                        <p className="text-gray-500 font-mono text-sm">{patient.patientNumber}</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-600">
                            <span className="capitalize">{patient.gender}</span>
                            {age !== null && <span>{age} years old</span>}
                            {patient.dateOfBirth && (
                                <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                            )}
                        </div>
                        {patient.nrc && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
                                <CreditCard className="w-3.5 h-3.5" />
                                NRC: {patient.nrc}
                            </div>
                        )}
                    </div>

                    {/* Balance & Visit Summary */}
                    <div className="flex-shrink-0 flex flex-col gap-2 min-w-[180px]">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Outstanding Balance</p>
                            <p className={`text-2xl font-bold mt-1 ${parseFloat(patient.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ZMW {parseFloat(patient.balance || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div
                            className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center cursor-pointer hover:bg-indigo-100 transition-colors"
                            onClick={() => navigate(`/app/visits?search=${patient.patientNumber}`)}
                        >
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Total Hospital Visits</p>
                            <p className="text-xl font-bold text-indigo-700">{patient.totalVisits || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Contact Info */}
                <Section title="Contact Information">
                    <InfoRow icon={Phone} label="Phone" value={patient.phone} />
                    <InfoRow icon={Mail} label="Email" value={patient.email} />
                    <InfoRow icon={MapPin} label="Address" value={patient.address} />
                </Section>

                {/* Next of Kin */}
                <Section title="Next of Kin">
                    <InfoRow icon={User} label="Name" value={patient.emergencyContact} />
                    <InfoRow icon={Phone} label="Phone" value={patient.emergencyPhone} />
                    <InfoRow
                        icon={User}
                        label="Relationship"
                        value={patient.nextOfKinRelationship}
                    />
                    {!patient.emergencyContact && (
                        <p className="text-xs text-gray-400 italic">No next of kin recorded</p>
                    )}
                </Section>

                {/* Classification */}
                <Section title="Patient Classification">
                    <InfoRow icon={Shield} label="Billing Type" value={badge.label} />
                    <InfoRow icon={Shield} label="Patient Type" value={patient.patientType?.toUpperCase()} />
                    <InfoRow icon={Clipboard} label="Registered Service" value={patient.registeredService} />
                    <InfoRow icon={Clipboard} label="Cost Category" value={patient.costCategory?.replace('_', ' ')} />
                    <InfoRow icon={Clipboard} label="Ward" value={patient.ward?.replace(/_/g, ' ')} />
                    <InfoRow icon={Clipboard} label="Member Status" value={patient.memberStatus} />
                    <InfoRow icon={Clipboard} label="Member Rank" value={patient.memberRank} />
                </Section>

                {/* NHIMA / Scheme details - Only if applicable */}
                {(patient.paymentMethod === 'nhima' || patient.nhimaNumber) && (
                    <Section title="NHIMA Details">
                        <InfoRow icon={Shield} label="NHIMA Number" value={patient.nhimaNumber} />
                        <InfoRow icon={Clipboard} label="Policy Number" value={patient.policyNumber} />
                    </Section>
                )}

                {(patient.paymentMethod === 'corporate' || patient.paymentMethod === 'scheme' || patient.policyNumber) && (
                    <Section title="Scheme / Corporate Details">
                        <InfoRow icon={Clipboard} label="Scheme Name" value={schemes.find(s => s.id === patient.schemeId)?.name || 'Not Specified'} />
                        <InfoRow icon={Clipboard} label="Policy Number" value={patient.policyNumber} />
                        <InfoRow icon={Clipboard} label="Member Rank" value={patient.memberRank} />
                        <InfoRow icon={Clipboard} label="Member Suffix" value={patient.memberSuffix?.toString()} />
                    </Section>
                )}

                {/* Financial Balances */}
                <Section title="Department Balances">
                    {[
                        { label: 'Nursing Care', key: 'nursingCare' },
                        { label: 'Laboratory', key: 'laboratory' },
                        { label: 'Radiology', key: 'radiology' },
                        { label: 'Pharmacy', key: 'pharmacy' },
                        { label: 'Lodging', key: 'lodging' },
                        { label: 'Surgicals', key: 'surgicals' },
                        { label: 'Dr. Round', key: 'drRound' },
                        { label: 'Food', key: 'food' },
                        { label: 'Physio', key: 'physio' },
                        { label: 'Sundries', key: 'sundries' },
                        { label: 'Antenatal', key: 'antenatal' },
                    ].filter(f => parseFloat(patient[f.key] || 0) !== 0).map(f => (
                        <div key={f.key} className="flex justify-between items-center py-1 text-sm border-b border-gray-50 last:border-0">
                            <span className="text-gray-500">{f.label}</span>
                            <span className="font-semibold text-gray-800">ZMW {parseFloat(patient[f.key]).toFixed(2)}</span>
                        </div>
                    ))}
                    {[
                        'nursingCare', 'laboratory', 'radiology', 'pharmacy', 'lodging', 'surgicals',
                        'drRound', 'food', 'physio', 'sundries', 'antenatal'
                    ].every(k => parseFloat(patient[k] || 0) === 0) && (
                            <p className="text-xs text-gray-400 italic">No department balances recorded</p>
                        )}
                </Section>

                {/* Record Info */}
                <Section title="Visit Summary">
                    <div className="flex flex-col gap-3 py-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total Encounters</span>
                            <span className="font-bold text-gray-800">{patient.totalVisits || 0}</span>
                        </div>
                        <button
                            onClick={() => navigate(`/app/visits?search=${patient.patientNumber}`)}
                            className="w-full py-2 px-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Clipboard className="w-3.5 h-3.5" />
                            View Encounter History
                        </button>
                    </div>
                </Section>

                <Section title="Record Information">
                    <InfoRow icon={Calendar} label="Registered On" value={patient.createdAt ? new Date(patient.createdAt).toLocaleString() : null} />
                    <InfoRow icon={Calendar} label="Last Updated" value={patient.updatedAt ? new Date(patient.updatedAt).toLocaleString() : null} />
                </Section>
            </div>

            {/* Visit History shortcut */}
            <div className="card p-5 flex items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Patient Visit History</h3>
                    <p className="text-sm text-gray-500">View all OPD, IPD, Lab, Pharmacy and other billing records for this patient.</p>
                </div>
                <button
                    onClick={() => navigate(`/app/patients/${id}/history`)}
                    className="btn btn-primary flex-shrink-0"
                >
                    <History className="w-4 h-4" />
                    View Full History
                </button>
            </div>
        </div>
    );
};

export default PatientView;
