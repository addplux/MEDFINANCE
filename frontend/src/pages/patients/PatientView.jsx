import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI, receivablesAPI, visitAPI, recordsAPI, billingAPI } from '../../services/apiService';
import {
    ArrowLeft, Edit, History, Phone, Mail, MapPin, User, CreditCard,
    Shield, Clipboard, Printer, Calendar, AlertCircle, PlusCircle, Stethoscope,
    Crown, Users, ChevronDown, ChevronUp, ExternalLink,
    DollarSign, RefreshCw, Download, FileText, Activity
} from 'lucide-react';
import NewAdmissionModal from '../../components/admissions/NewAdmissionModal';
import ManualChargeModal from '../../components/shared/ManualChargeModal';
import { useToast } from '../../context/ToastContext';

const TYPE_BADGE = {
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
        <div className="flex items-start gap-2 py-1 print:py-0">
            <Icon className="w-3.5 h-3.5 text-text-tertiary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wider text-text-tertiary font-bold leading-none mb-0.5 print:text-[8px]">{label}</p>
                <p className="text-[13px] font-semibold text-text-primary print:text-black print:text-[11px] print:leading-tight truncate">{value}</p>
            </div>
        </div>
    ) : null
);

const Section = ({ title, children }) => (
    <div className="card p-4 print:p-2 print:space-y-0.5 print:border print:border-gray-200">
        <h3 className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.1em] mb-2 print:mb-1 print:text-black print:text-[9px]">{title}</h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);



// ── Rank badge colours ────────────────────────────────────────────────────────
const RANK_BADGE = {
    principal: { label: 'Principal', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-600' },
    spouse:    { label: 'Spouse',    bg: 'bg-pink-100 dark:bg-pink-900/30',   text: 'text-pink-800 dark:text-pink-300',   border: 'border-pink-300 dark:border-pink-600' },
    child:     { label: 'Child',     bg: 'bg-sky-100 dark:bg-sky-900/30',     text: 'text-sky-800 dark:text-sky-300',     border: 'border-sky-300 dark:border-sky-600' },
    dependant: { label: 'Dependant', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-800 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-600' },
    other:     { label: 'Other',     bg: 'bg-gray-100 dark:bg-gray-800',      text: 'text-gray-700 dark:text-gray-300',   border: 'border-gray-300 dark:border-gray-600' },
};

const STATUS_DOT = {
    active:        'bg-emerald-500',
    suspended:     'bg-amber-500',
    closed:        'bg-red-500',
    not_collected: 'bg-gray-400',
};

const calcAge = (dob) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

// ── Family Member Card ────────────────────────────────────────────────────────
const FamilyMemberCard = ({ member, navigate, apiBase }) => {
    const rankInfo = RANK_BADGE[member.memberRank] || RANK_BADGE.other;
    const age = calcAge(member.dateOfBirth);
    const statusColor = STATUS_DOT[member.memberStatus] || 'bg-gray-400';

    return (
        <button
            onClick={() => navigate(`/app/patients/${member.id}`)}
            className="w-full text-left group flex items-center gap-3 p-3 rounded-xl border border-border-color hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {member.photoUrl ? (
                    <img src={`${apiBase}${member.photoUrl}`} alt={member.firstName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/10" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-primary ${statusColor}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                    {member.firstName} {member.lastName}
                </p>
                <p className="text-[11px] text-text-tertiary font-mono">{member.patientNumber}</p>
                {age !== null && (
                    <p className="text-[11px] text-text-tertiary">{age} yrs • {member.gender}</p>
                )}
            </div>

            {/* Rank badge + arrow */}
            <div className="flex flex-col items-end gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rankInfo.bg} ${rankInfo.text} ${rankInfo.border} uppercase tracking-wider`}>
                    {rankInfo.label}
                </span>
                <ExternalLink className="w-3 h-3 text-text-tertiary group-hover:text-primary transition-colors" />
            </div>
        </button>
    );
};

// ── Financial History / Statement Section ───────────────────────────────────
const BillingStatementSection = ({ patientId, onRefreshBalance }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = async () => {
        if (!open) setOpen(true);
        setLoading(true);
        try {
            const statementRes = await billingAPI.patient.getStatement(patientId);
            setData(statementRes.data);
        } catch (e) {
            setError('Failed to load financial statement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) load();
    }, [open]);

    const fmt = (n) => `K${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handlePrint = () => {
        if (!data) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Patient Statement</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .gov-header { text-align: center; border-bottom: 3px double #222; padding-bottom: 16px; margin-bottom: 20px; }
                        .gov-header .country { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #555; font-weight: 600; }
                        .gov-header .ministry { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #333; font-weight: 700; margin: 4px 0; }
                        .gov-header .hospital { font-size: 22px; font-weight: 900; color: #111; margin: 6px 0 2px; }
                        .gov-header .doc-title { font-size: 15px; font-weight: 600; color: #444; margin-top: 8px; letter-spacing: 1px; }
                        .meta { font-size: 11px; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f4f4f4; font-size: 12px; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="gov-header">
                        <div class="country">Republic of Zambia</div>
                        <div class="ministry">Ministry of Health</div>
                        <div class="hospital">Nchanga North General Hospital</div>
                        <div class="doc-title">Patient Billing Statement</div>
                    </div>
                    <p class="meta">Generated: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th class="text-right">Debit</th>
                                <th class="text-right">Credit</th>
                                <th class="text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.statement.map(s => `
                                <tr>
                                    <td>${new Date(s.date).toLocaleDateString()}</td>
                                    <td>${s.type}</td>
                                    <td>${s.description}</td>
                                    <td class="text-right">${s.debit > 0 ? fmt(s.debit) : '-'}</td>
                                    <td class="text-right">${s.credit > 0 ? fmt(s.credit) : '-'}</td>
                                    <td class="text-right font-bold">${fmt(s.balance)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    return (
        <div className="card overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-bold text-text-primary">Financial History & Statements</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
            </button>

            {open && (
                <div className="px-4 pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs text-text-tertiary uppercase tracking-widest font-bold">Transaction History</p>
                        <div className="flex gap-2">
                            <button onClick={load} className="p-1.5 hover:bg-white/5 rounded-lg text-text-tertiary hover:text-white transition-colors">
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {data && (
                                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white transition-colors">
                                    <Printer className="w-3 h-3" />
                                    Print Statement
                                </button>
                            )}
                        </div>
                    </div>

                    {loading && !data && (
                        <div className="py-8 text-center text-text-tertiary text-sm">Loading transactions...</div>
                    )}

                    {error && <p className="text-red-400 text-sm py-4">{error}</p>}

                    {data && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] uppercase tracking-widest text-text-tertiary border-b border-white/5">
                                        <th className="px-4 py-3 font-black">Date</th>
                                        <th className="px-4 py-3 font-black">Type</th>
                                        <th className="px-4 py-3 font-black">Description</th>
                                        <th className="px-4 py-3 font-black text-right">Debit</th>
                                        <th className="px-4 py-3 font-black text-right">Credit</th>
                                        <th className="px-4 py-3 font-black text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {data.statement.map((s, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-2.5 text-xs text-text-tertiary font-mono">{new Date(s.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase border ${
                                                    s.type === 'PAYMENT' || s.type === 'CREDIT' 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {s.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-white max-w-[200px] truncate">{s.description}</td>
                                            <td className="px-4 py-2.5 text-xs text-white text-right">{s.debit > 0 ? fmt(s.debit) : '-'}</td>
                                            <td className="px-4 py-2.5 text-xs text-emerald-400 text-right">{s.credit > 0 ? fmt(s.credit) : '-'}</td>
                                            <td className="px-4 py-2.5 text-xs font-bold text-white text-right">{fmt(s.balance)}</td>
                                        </tr>
                                    ))}
                                    {data.statement.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-xs text-text-tertiary italic">No transactions found for this patient.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
const FamilyTreeSection = ({ patientId, navigate, apiBase }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = async () => {
        if (data) { setOpen(o => !o); return; }
        setOpen(true);
        setLoading(true);
        try {
            const res = await patientAPI.getFamilyMembers(patientId);
            setData(res.data);
        } catch (e) {
            setError('Failed to load family members');
        } finally {
            setLoading(false);
        }
    };

    const spouses    = data?.family?.filter(m => m.memberRank === 'spouse')    || [];
    const children   = data?.family?.filter(m => m.memberRank === 'child')     || [];
    const dependants = data?.family?.filter(m => m.memberRank === 'dependant') || [];
    const others     = data?.family?.filter(m => !['spouse','child','dependant'].includes(m.memberRank)) || [];

    const groups = [
        { label: 'Spouse', members: spouses, color: 'text-pink-400' },
        { label: 'Children', members: children, color: 'text-sky-400' },
        { label: 'Dependants', members: dependants, color: 'text-violet-400' },
        { label: 'Others', members: others, color: 'text-gray-400' },
    ].filter(g => g.members.length > 0);

    return (
        <div className="card overflow-hidden">
            {/* Header / Toggle */}
            <button
                onClick={load}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-text-primary">Family Members</span>
                    {data && (
                        <span className="ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {data.family.length}
                        </span>
                    )}
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
            </button>

            {/* Body */}
            {open && (
                <div className="px-4 pb-4">
                    {loading && (
                        <div className="flex items-center gap-2 py-4 text-text-tertiary text-sm">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Loading family members…
                        </div>
                    )}
                    {error && <p className="text-red-400 text-sm py-2">{error}</p>}

                    {data && data.family.length === 0 && (
                        <p className="text-text-tertiary text-sm italic py-2">No linked family members found for policy <span className="font-mono font-bold text-text-secondary">{data.principal.policyNumber}</span>.</p>
                    )}

                    {data && data.family.length > 0 && (
                        <div className="space-y-5">
                            {/* Policy number pill */}
                            <div className="flex items-center gap-2 py-1">
                                <div className="h-px flex-1 bg-border-color" />
                                <span className="text-[11px] font-mono font-bold text-text-tertiary px-2 py-0.5 bg-bg-tertiary rounded-full border border-border-color">
                                    Policy: {data.principal.policyNumber}
                                </span>
                                <div className="h-px flex-1 bg-border-color" />
                            </div>

                            {/* Tree connector — principal node */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center flex-shrink-0">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-text-primary">
                                        {data.principal.firstName} {data.principal.lastName}
                                    </p>
                                    <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Principal</p>
                                </div>
                            </div>

                            {/* Branch line + member groups */}
                            <div className="ml-4 pl-4 border-l-2 border-dashed border-border-color space-y-4">
                                {groups.map(group => (
                                    <div key={group.label}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className={`w-3.5 h-3.5 ${group.color}`} />
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${group.color}`}>
                                                {group.label} ({group.members.length})
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {group.members.map(member => (
                                                <FamilyMemberCard
                                                    key={member.id}
                                                    member={member}
                                                    navigate={navigate}
                                                    apiBase={apiBase}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PatientView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
    const [isManualChargeModalOpen, setIsManualChargeModalOpen] = useState(false);
    const [sendingToDoctor, setSendingToDoctor] = useState(false);
    const [sendToDoctorResult, setSendToDoctorResult] = useState(null);

    const loadPatient = async () => {
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

    useEffect(() => {
        loadPatient();
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

    const patientScheme = patient.schemeId ? schemes.find(s => s.id === patient.schemeId) : null;

    return (
        <div className="space-y-4 pb-6 print:pb-0 print:space-y-2">
            {/* Top nav */}
            <div className="flex items-center gap-3 flex-wrap print:hidden">
                <button onClick={() => navigate('/app/patients')} className="btn btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <h1 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] print:text-black">Patient Master Record</h1>
                    <p className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest">Profile & Category</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={async () => {
                            try {
                                const notes = window.prompt('Reason for file request? (e.g. Doctor Consult, Audit):');
                                if (notes === null) return;
                                await recordsAPI.fileRequests.create({
                                    patientId: id,
                                    requestType: 'retrieval',
                                    urgency: 'normal',
                                    notes: notes || 'Standard retrieval'
                                });
                                alert('File request sent to Records department successfully!');
                            } catch (e) {
                                alert('Failed to create file request.');
                            }
                        }}
                        className="btn btn-secondary border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                    >
                        <Clipboard className="w-4 h-4" />
                        Request File
                    </button>
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
                        onClick={() => setIsManualChargeModalOpen(true)}
                        className="btn btn-secondary border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                    >
                        <DollarSign className="w-4 h-4" />
                        Manual Charge
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
            <div className="card p-3 print:p-2 print:border-none print:shadow-none">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 print:gap-4 print:items-center">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                        {patient.photoUrl ? (
                            <img
                                src={`${apiBase}${patient.photoUrl}`}
                                alt={patient.firstName}
                                className="w-20 h-20 rounded-xl object-cover border-2 border-white/10 shadow-lg"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg print:shadow-none print:border print:border-gray-200 print:from-gray-100 print:to-gray-100">
                                <span className="text-white print:text-black text-2xl font-bold">
                                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <h2 className="text-2xl font-bold text-text-primary print:text-black">
                                {patient.firstName} {patient.lastName}
                            </h2>
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {badge.label}
                            </span>
                        </div>
                        <p className="text-gray-500 font-mono text-sm">{patient.patientNumber}</p>
                        {patientScheme && (
                            <div className="flex justify-center sm:justify-start">
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold border bg-indigo-50/10 text-indigo-300 border-indigo-400/30">
                                    {patientScheme.schemeName}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-sm text-text-secondary">
                            <span className="capitalize">{patient.gender}</span>
                            {age !== null && (
                                <>
                                    <span className="text-text-tertiary">•</span>
                                    <span>{age} years old</span>
                                </>
                            )}
                            {patient.dateOfBirth && (
                                <>
                                    <span className="text-text-tertiary">•</span>
                                    <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                                </>
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
                    <div className="flex-shrink-0 flex flex-col sm:flex-row print:flex-row gap-3 min-w-[200px] print:min-w-0">
                        <div className="bg-bg-secondary rounded-2xl p-4 print:p-2 print:bg-transparent print:border-none border border-border-color text-center shadow-sm print:shadow-none">
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider print:text-[8px]">Outstanding Balance</p>
                            <p className={`text-2xl print:text-sm font-bold mt-2 print:mt-0 ${
                                patient.paymentMethod === 'private_prepaid' 
                                    ? (parseFloat(patient.balance || 0) < 0 ? 'text-rose-500' : 'text-emerald-500')
                                    : (parseFloat(patient.balance || 0) > 0 ? 'text-rose-500' : 'text-emerald-500')
                            }`}>
                                {patient.paymentMethod === 'private_prepaid'
                                    ? (parseFloat(patient.balance || 0) > 0 
                                        ? `ZMW ${parseFloat(patient.balance || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })} (Credit)`
                                        : parseFloat(patient.balance || 0) < 0 
                                            ? `-ZMW ${Math.abs(parseFloat(patient.balance || 0)).toLocaleString('en-ZM', { minimumFractionDigits: 2 })} (Debt)`
                                            : `ZMW 0.00`)
                                    : (parseFloat(patient.balance || 0) < 0 
                                        ? `ZMW ${Math.abs(parseFloat(patient.balance || 0)).toLocaleString('en-ZM', { minimumFractionDigits: 2 })} (Credit)`
                                        : parseFloat(patient.balance || 0) > 0 
                                            ? `-ZMW ${parseFloat(patient.balance || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })} (Debt)`
                                            : `ZMW 0.00`)
                                }
                            </p>
                        </div>
                        <div
                            className="bg-primary/5 rounded-2xl p-4 print:p-2 print:bg-transparent print:border-none border border-primary/20 text-center cursor-pointer hover:bg-primary/10 transition-colors shadow-sm print:shadow-none"
                            onClick={() => navigate(`/app/visits?search=${patient.patientNumber}`)}
                        >
                            <p className="text-[10px] text-text-secondary print:text-gray-600 font-bold uppercase tracking-wider print:text-[8px]">Total Hospital Visits</p>
                            <p className="text-xl print:text-sm font-bold text-primary print:text-black mt-1 print:mt-0">{patient.totalVisits || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 gap-3 print:gap-2">

                {/* RED ACCOUNT / CREDIT STOP WARNING */}
                {patient.paymentMethod === 'private_prepaid' && parseFloat(patient.balance || 0) < 0 && (
                    <div className="md:col-span-2 xl:col-span-3 bg-red-600/10 border-2 border-red-500 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-red-500 font-black uppercase tracking-widest text-sm">Credit Stop — Account in the Red</h3>
                            <p className="text-red-400 text-xs font-semibold">This prepaid account is overdrawn by ZMW {Math.abs(parseFloat(patient.balance)).toFixed(2)}. Services are automatically restricted.</p>
                        </div>
                        <button 
                            onClick={() => navigate(`/app/receivables/prepaid?search=${patient.patientNumber}`)}
                            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none px-4"
                        >
                            Process Top-Up
                        </button>
                    </div>
                )}

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


                {(patient.paymentMethod === 'corporate' || patient.paymentMethod === 'scheme' || patient.policyNumber) && (
                    <Section title="Scheme / Corporate Details">
                        <InfoRow icon={Clipboard} label="Scheme Name" value={patientScheme?.schemeName || 'Not Specified'} />
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
                        <div key={f.key} className="flex justify-between items-center py-1 text-sm border-b border-border-color last:border-0">
                            <span className="text-text-secondary">{f.label}</span>
                            <span className="font-semibold text-text-primary">ZMW {parseFloat(patient[f.key]).toFixed(2)}</span>
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
                    <div className="flex flex-col gap-3 py-1 print:py-0 print:gap-1">
                        <div className="flex justify-between items-center text-sm print:text-[11px]">
                            <span className="text-text-secondary print:text-black">Total Encounters</span>
                            <span className="font-bold text-text-primary print:text-black">{patient.totalVisits || 0}</span>
                        </div>
                        <button
                            onClick={() => navigate(`/app/visits?search=${patient.patientNumber}`)}
                            className="w-full py-2.5 px-4 bg-primary/5 text-primary rounded-full text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 mt-2"
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

            {/* ── Financial History Section ───────────────────────────────────── */}
            <BillingStatementSection 
                patientId={id} 
                onRefreshBalance={loadPatient}
            />

            {/* ── Family Hierarchy Tree — principal-rank patients only ─────────── */}
            {patient.memberRank === 'principal' && patient.policyNumber && (
                <FamilyTreeSection
                    patientId={id}
                    navigate={navigate}
                    apiBase={apiBase}
                />

            )}



            {/* Visit History shortcut */}
            <div className="card p-6 flex flex-col gap-6 mt-4 print:hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Patient Actions & History</h3>
                        <p className="text-sm text-text-secondary mt-1">Manage admissions, or view all OPD, IPD, Lab, and Pharmacy records.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap justify-end">
                        {/* Send to Doctor */}
                        <button
                            disabled={sendingToDoctor}
                            onClick={async () => {
                                if (!window.confirm(`Send ${patient.firstName} ${patient.lastName} to the doctor?\n\nThis will create a visit and auto-generate a consultation fee.`)) return;
                                setSendingToDoctor(true);
                                setSendToDoctorResult(null);
                                try {
                                    const res = await visitAPI.createConsultation({ patientId: patient.id });
                                    setSendToDoctorResult({ ok: true, msg: res.data.message, visitId: res.data.visit?.id });
                                } catch (err) {
                                    setSendToDoctorResult({ ok: false, msg: err.response?.data?.error || 'Failed to send patient to doctor.' });
                                } finally {
                                    setSendingToDoctor(false);
                                }
                            }}
                            className="btn bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 disabled:opacity-60 flex items-center gap-2"
                        >
                            <Stethoscope className="w-4 h-4" />
                            {sendingToDoctor ? 'Sending…' : 'Send to Doctor'}
                        </button>

                        <button
                            onClick={() => setIsAdmissionModalOpen(true)}
                            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
                        >
                            <PlusCircle className="w-5 h-5 mr-1" />
                            Admit Patient (IPD)
                        </button>
                        <button
                            onClick={() => navigate(`/app/patients/${id}/history`)}
                            className="btn btn-secondary flex-shrink-0"
                        >
                            <History className="w-4 h-4" />
                            View Full History
                        </button>
                    </div>
                </div>

                {/* Send to Doctor result banner */}
                {sendToDoctorResult && (
                    <div className={`w-full rounded-xl px-5 py-3 text-sm font-semibold flex items-start gap-3 ${sendToDoctorResult.ok
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}>
                        <span className="text-lg">{sendToDoctorResult.ok ? '✅' : '❌'}</span>
                        <div className="flex-1">
                            <p>{sendToDoctorResult.msg}</p>
                            {sendToDoctorResult.ok && sendToDoctorResult.visitId && (
                                <button
                                    onClick={() => navigate(`/app/visits/${sendToDoctorResult.visitId}`)}
                                    className="mt-1 underline text-blue-400 text-xs"
                                >
                                    Open Visit →
                                </button>
                            )}
                        </div>
                        <button onClick={() => setSendToDoctorResult(null)} className="text-white/40 hover:text-white transition-colors">✕</button>
                    </div>
                )}
            </div>



            {/* Modals */}
            <NewAdmissionModal
                isOpen={isAdmissionModalOpen}
                onClose={() => setIsAdmissionModalOpen(false)}
                initialPatient={patient}
                onSuccess={(admission) => {
                    setIsAdmissionModalOpen(false);
                }}
            />

            {isManualChargeModalOpen && (
                <ManualChargeModal
                    patient={patient}
                    onClose={() => setIsManualChargeModalOpen(false)}
                    onSuccess={() => {
                        loadPatient();
                        // Trigger statement refresh if needed?
                        // For now loadPatient updates balance in header
                    }}
                />
            )}
        </div>
    );
};

export default PatientView;
