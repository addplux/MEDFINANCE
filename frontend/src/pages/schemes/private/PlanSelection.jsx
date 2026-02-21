import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, Plus, Edit2, Trash2, Users, DollarSign,
    ChevronDown, ChevronUp, Star, Zap, X, Save, Search,
    UserPlus, CheckCircle, AlertCircle, Clock, Loader
} from 'lucide-react';
import { patientAPI, prepaidPlanAPI } from '../../../services/apiService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PlanIcon = ({ icon, size = 20 }) => {
    if (icon === 'star') return <Star size={size} />;
    if (icon === 'zap') return <Zap size={size} />;
    return <ShieldCheck size={size} />;
};

const fmt = (n) => `ZK ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Component ────────────────────────────────────────────────────────────────
const PlanSelection = () => {
    const [plans, setPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [expandedPlan, setExpandedPlan] = useState(null);
    const [search, setSearch] = useState('');

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [assignPlan, setAssignPlan] = useState(null);
    const [saving, setSaving] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    const showMessage = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 4000);
    };

    // Load plans from DB
    const loadPlans = useCallback(async () => {
        setPlansLoading(true);
        try {
            const res = await prepaidPlanAPI.getAll();
            setPlans(res.data || []);
        } catch {
            showMessage('error', 'Failed to load plans');
        } finally {
            setPlansLoading(false);
        }
    }, []);

    // Load all prepaid members
    const loadMembers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await patientAPI.getAll({ paymentMethod: 'private_prepaid', limit: 500 });
            setMembers(res.data?.data || []);
        } catch {
            showMessage('error', 'Failed to load members');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPlans(); loadMembers(); }, [loadPlans, loadMembers]);

    // Members for a given plan (match by planKey or plan name lowercase)
    const membersOnPlan = (plan) =>
        members.filter(m => {
            const mp = (m.memberPlan || '').toLowerCase();
            return mp === (plan.planKey || '').toLowerCase() || mp === plan.name.toLowerCase();
        });

    // Unassigned members (no plan)
    const unassigned = members.filter(m => !m.memberPlan || m.memberPlan.trim() === '');

    // Filtered view for assign modal
    const filteredForAssign = members.filter(m => {
        const name = `${m.firstName} ${m.lastName} ${m.patientNumber}`.toLowerCase();
        return name.includes(memberSearch.toLowerCase());
    });

    // ── Edit plan handler — persists to DB ────────────────────────────────────
    const openEdit = (plan) => {
        setEditingPlan({ ...plan, benefits: Array.isArray(plan.benefits) ? plan.benefits : [] });
        setShowEditModal(true);
    };

    const savePlan = async () => {
        setSaving(true);
        try {
            const payload = {
                ...editingPlan,
                monthlyPremium: Number(editingPlan.monthlyPremium),
                annualPremium: Number(editingPlan.annualPremium),
                coverageLimit: Number(editingPlan.coverageLimit),
                benefits: Array.isArray(editingPlan.benefits) ? editingPlan.benefits : editingPlan.benefits.split('\n').filter(Boolean)
            };
            await prepaidPlanAPI.update(editingPlan.id, payload);
            await loadPlans();
            setShowEditModal(false);
            showMessage('success', `${editingPlan.name} plan saved to database.`);
        } catch {
            showMessage('error', 'Failed to save plan.');
        } finally {
            setSaving(false);
        }
    };

    // ── Assign member to plan ──────────────────────────────────────────────────
    const openAssign = (plan) => {
        setAssignPlan(plan);
        setMemberSearch('');
        setShowAssignModal(true);
    };

    const assignMemberToPlan = async (member, planId) => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('memberPlan', planId || '');
            await patientAPI.update(member.id, fd);
            await loadMembers();
            showMessage('success', `${member.firstName} ${member.lastName} assigned to ${planId || 'No Plan'}.`);
        } catch {
            showMessage('error', 'Failed to update member plan.');
        } finally {
            setSaving(false);
        }
    };

    const removePlan = async (member) => {
        await assignMemberToPlan(member, '');
    };

    // ── Filtered plans ─────────────────────────────────────────────────────────
    const filteredPlans = plans.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Plan Selection</h1>
                    <p className="text-sm text-text-secondary mt-1">Manage and assign private prepaid plan tiers to members</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search plans…"
                            className="pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>
            </div>

            {/* Alert */}
            {alert && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {alert.msg}
                </div>
            )}

            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Plans', value: plans.length, icon: ShieldCheck, color: '#6366f1' },
                    { label: 'Total Members', value: members.length, icon: Users, color: '#0ea5e9' },
                    { label: 'Unassigned', value: unassigned.length, icon: AlertCircle, color: '#f59e0b' },
                    { label: 'Avg Monthly Premium', value: plans.length > 0 ? `ZK ${(plans.reduce((s, p) => s + Number(p.monthlyPremium), 0) / plans.length).toFixed(0)}` : 'ZK 0', icon: DollarSign, color: '#10b981' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="glass-card p-4 flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: color + '22' }}>
                            <Icon size={18} style={{ color }} />
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">{label}</p>
                            <p className="text-lg font-bold text-text-primary">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPlans.map(plan => {
                    const planMembers = membersOnPlan(plan);
                    const isExpanded = expandedPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className="glass-card overflow-hidden transition-all duration-300"
                            style={{ borderTop: `3px solid ${plan.color}` }}
                        >
                            {/* Card Header */}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl" style={{ background: plan.color + '22' }}>
                                            <PlanIcon icon={plan.icon} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary text-base">{plan.name} Plan</h3>
                                            <p className="text-xs text-text-secondary">{planMembers.length} members</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => openAssign(plan)} className="p-1.5 rounded-lg hover:bg-white/10 text-text-secondary hover:text-accent transition-colors" title="Assign member">
                                            <UserPlus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="mb-3">
                                    <span className="text-2xl font-bold text-text-primary">{fmt(plan.monthlyPremium)}</span>
                                    <span className="text-xs text-text-secondary ml-1">/ month</span>
                                </div>
                                <p className="text-xs text-text-secondary mb-3 leading-relaxed">{plan.description}</p>

                                {/* Coverage limit chip */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: plan.color + '22', color: plan.color }}>
                                        Cover: {fmt(plan.coverageLimit)}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-text-secondary">
                                        Annual: {fmt(plan.annualPremium)}
                                    </span>
                                </div>

                                {/* Benefits toggle */}
                                <button
                                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                                    className="w-full flex items-center justify-between text-xs text-text-secondary hover:text-text-primary transition-colors py-1"
                                >
                                    <span>View Benefits ({plan.benefits.length})</span>
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>

                                {isExpanded && (
                                    <ul className="mt-2 space-y-1.5">
                                        {plan.benefits.map((b, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                                <CheckCircle size={12} className="mt-0.5 shrink-0" style={{ color: plan.color }} />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Members mini-list */}
                            {planMembers.length > 0 && (
                                <div className="border-t border-border/50 px-5 py-3">
                                    <p className="text-xs text-text-secondary mb-2 font-medium">Enrolled Members</p>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {planMembers.slice(0, 5).map(m => (
                                            <div key={m.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                                        style={{ background: plan.color }}
                                                    >
                                                        {(m.firstName?.[0] || '') + (m.lastName?.[0] || '')}
                                                    </div>
                                                    <span className="text-xs text-text-primary">{m.firstName} {m.lastName}</span>
                                                </div>
                                                <span className="text-[10px] text-text-secondary">{m.patientNumber}</span>
                                            </div>
                                        ))}
                                        {planMembers.length > 5 && (
                                            <p className="text-[10px] text-text-secondary text-center pt-1">+{planMembers.length - 5} more</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action footer */}
                            <div className="border-t border-border/50 px-5 py-3">
                                <button
                                    onClick={() => openAssign(plan)}
                                    className="w-full py-2 text-xs font-semibold rounded-xl transition-all"
                                    style={{ background: plan.color + '22', color: plan.color }}
                                >
                                    + Assign Member
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Unassigned Members */}
            {unassigned.length > 0 && (
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-amber-400" />
                        <h3 className="font-semibold text-text-primary text-sm">Unassigned Members ({unassigned.length})</h3>
                        <span className="text-xs text-amber-400 ml-auto">Assign them to a plan below</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left py-2 px-3 text-xs text-text-secondary font-medium">Member</th>
                                    <th className="text-left py-2 px-3 text-xs text-text-secondary font-medium">Patient No.</th>
                                    <th className="text-left py-2 px-3 text-xs text-text-secondary font-medium">Balance</th>
                                    <th className="text-right py-2 px-3 text-xs text-text-secondary font-medium">Assign Plan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unassigned.map(m => (
                                    <tr key={m.id} className="border-b border-border/30 hover:bg-white/5">
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px] font-bold text-amber-400">
                                                    {(m.firstName?.[0] || '') + (m.lastName?.[0] || '')}
                                                </div>
                                                <span className="text-text-primary font-medium">{m.firstName} {m.lastName}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-text-secondary">{m.patientNumber}</td>
                                        <td className="py-2 px-3 text-emerald-400 font-medium">{fmt(m.balance || 0)}</td>
                                        <td className="py-2 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {plans.map(plan => (
                                                    <button
                                                        key={plan.id}
                                                        onClick={() => assignMemberToPlan(m, plan.planKey)}
                                                        className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                                                        style={{ background: plan.color + '22', color: plan.color }}
                                                    >
                                                        {plan.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Edit Plan Modal ─────────────────────────────────────────────── */}
            {showEditModal && editingPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-[#1a1f2e] border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-base font-bold text-text-primary">Edit {editingPlan.name} Plan</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-text-secondary mb-1 block">Monthly Premium (ZK)</label>
                                    <input
                                        type="number"
                                        value={editingPlan.monthlyPremium}
                                        onChange={e => setEditingPlan(p => ({ ...p, monthlyPremium: Number(e.target.value) }))}
                                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary mb-1 block">Annual Premium (ZK)</label>
                                    <input
                                        type="number"
                                        value={editingPlan.annualPremium}
                                        onChange={e => setEditingPlan(p => ({ ...p, annualPremium: Number(e.target.value) }))}
                                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-text-secondary mb-1 block">Coverage Limit (ZK)</label>
                                <input
                                    type="number"
                                    value={editingPlan.coverageLimit}
                                    onChange={e => setEditingPlan(p => ({ ...p, coverageLimit: Number(e.target.value) }))}
                                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-secondary mb-1 block">Description</label>
                                <textarea
                                    rows={2}
                                    value={editingPlan.description}
                                    onChange={e => setEditingPlan(p => ({ ...p, description: e.target.value }))}
                                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-secondary mb-1 block">Benefits (one per line)</label>
                                <textarea
                                    rows={5}
                                    value={editingPlan.benefits.join('\n')}
                                    onChange={e => setEditingPlan(p => ({ ...p, benefits: e.target.value.split('\n') }))}
                                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
                            <button onClick={savePlan} className="px-5 py-2 text-sm font-semibold bg-accent text-white rounded-xl hover:bg-accent/80 flex items-center gap-2">
                                <Save size={14} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Member Modal ─────────────────────────────────────────── */}
            {showAssignModal && assignPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-[#1a1f2e] border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div>
                                <h2 className="text-base font-bold text-text-primary">Assign to {assignPlan.name} Plan</h2>
                                <p className="text-xs text-text-secondary mt-0.5">Select a member to assign or move</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
                        </div>
                        <div className="px-6 pt-4">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                    placeholder="Search member name or ID…"
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 py-3 space-y-2">
                            {filteredForAssign.length === 0 && (
                                <p className="text-center text-xs text-text-secondary py-6">No members found.</p>
                            )}
                            {filteredForAssign.map(m => {
                                const currentPlan = plans.find(p => (p.planKey || '').toLowerCase() === (m.memberPlan || '').toLowerCase() || p.name.toLowerCase() === (m.memberPlan || '').toLowerCase());
                                const isOnThisPlan = (m.memberPlan || '').toLowerCase() === (assignPlan.planKey || assignPlan.name || '').toLowerCase();
                                return (
                                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                style={{ background: currentPlan ? currentPlan.color : '#6b7280' }}
                                            >
                                                {(m.firstName?.[0] || '') + (m.lastName?.[0] || '')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{m.firstName} {m.lastName}</p>
                                                <p className="text-xs text-text-secondary">{m.patientNumber} · {currentPlan ? currentPlan.name + ' Plan' : 'No Plan'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isOnThisPlan ? (
                                                <span className="text-xs px-2 py-1 rounded-full text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
                                                    <CheckCircle size={11} /> Enrolled
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => assignMemberToPlan(m, assignPlan.planKey)}
                                                    disabled={saving}
                                                    className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-50"
                                                    style={{ background: assignPlan.color + '22', color: assignPlan.color }}
                                                >
                                                    Assign
                                                </button>
                                            )}
                                            {isOnThisPlan && (
                                                <button
                                                    onClick={() => removePlan(m)}
                                                    disabled={saving}
                                                    className="text-xs px-2 py-1 rounded-xl text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                                    title="Remove from plan"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-6 py-4 border-t border-border text-right">
                            <button onClick={() => setShowAssignModal(false)} className="px-5 py-2 text-sm bg-accent text-white rounded-xl hover:bg-accent/80 font-semibold">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanSelection;
