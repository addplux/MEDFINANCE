import React, { useState, useEffect } from 'react';
import { Download, Upload, Search, Link as LinkIcon, AlertCircle, CheckCircle, XCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { receivablesAPI } from '../../../services/apiService';
import { useToast } from '../../../context/ToastContext';

const CorporateMemberManagement = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [corporateSchemes, setCorporateSchemes] = useState([]);
    const [selectedScheme, setSelectedScheme] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Corporate Schemes on mount
    useEffect(() => {
        fetchSchemes();
    }, []);

    // Fetch members when a scheme is selected
    useEffect(() => {
        if (selectedScheme) {
            fetchMembers(selectedScheme);
        } else {
            setMembers([]);
        }
    }, [selectedScheme]);

    const fetchSchemes = async () => {
        try {
            const response = await receivablesAPI.schemes.getAll({ status: 'active' });
            setCorporateSchemes(response.data || []);
        } catch (error) {
            console.error('Failed to fetch corporate schemes:', error);
            addToast('error', 'Failed to load schemes.');
        }
    };

    const fetchMembers = async (schemeId) => {
        setLoading(true);
        try {
            const response = await receivablesAPI.schemes.getMembers(schemeId);
            setMembers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            addToast('error', 'Failed to load member list.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-detect scheme when file is chosen
    useEffect(() => {
        if (selectedFile && corporateSchemes.length > 0 && !selectedScheme) {
            try {
                const fileName = selectedFile.name.toLowerCase();
                const matchedScheme = corporateSchemes.find(scheme => {
                    const sName = scheme.schemeName ? scheme.schemeName.toLowerCase() : '';
                    const sCode = scheme.schemeCode ? scheme.schemeCode.toLowerCase() : '';
                    return (sName && fileName.includes(sName)) || (sCode && fileName.includes(sCode));
                });
                if (matchedScheme) {
                    setSelectedScheme(String(matchedScheme.id));
                }
            } catch (err) {
                console.error('Auto-detect failed:', err);
            }
        }
    }, [selectedFile, corporateSchemes]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedScheme) {
            addToast('warning', 'Please select a scheme and a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploading(true);
        try {
            const response = await receivablesAPI.schemes.importMembers(selectedScheme, formData);

            const { results } = response.data;
            addToast('success', `Upload successful! Added/Updated: ${results.success}.`);

            setSelectedFile(null);
            fetchMembers(selectedScheme);
        } catch (error) {
            console.error('Upload error:', error);
            const msg = error.response?.data?.error || 'Failed to upload roster. Check column names.';
            addToast('error', msg);
        } finally {
            setUploading(false);
        }
    };

    const toggleStatus = async (patientId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} this member?`)) return;

        try {
            await receivablesAPI.schemes.updateMemberStatus(selectedScheme, patientId, newStatus);
            setMembers(members.map(m => m.id === patientId ? { ...m, memberStatus: newStatus } : m));
            addToast('success', `Member ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`);
        } catch (error) {
            console.error('Status update error:', error);
            addToast('error', 'Failed to update member status.');
        }
    };

    const filteredMembers = members.filter(m =>
        m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.patientNumber && m.patientNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.nrc && m.nrc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedSchemeName = corporateSchemes.find(s => String(s.id) === String(selectedScheme))?.schemeName || 'Scheme';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Scheme Member Management</h1>
                <p className="text-sm text-white/50 mt-1">Select a scheme below to view and manage its members</p>
            </div>

            {/* Corporate Schemes Cards */}
            {corporateSchemes.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                    <p className="text-amber-700 font-semibold">No active schemes found.</p>
                    <p className="text-amber-600 text-sm mt-1">
                        Please create a scheme under <strong>'All Schemes'</strong>.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {corporateSchemes.map(scheme => {
                        const isSelected = String(selectedScheme) === String(scheme.id);
                        return (
                            <button
                                key={scheme.id}
                                onClick={() => setSelectedScheme(String(scheme.id))}
                                className={`text-left p-5 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${isSelected
                                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-bold text-white text-base">{scheme.schemeName || 'Unnamed Scheme'}</p>
                                        <p className="text-xs text-white/40 mt-0.5 font-mono">{scheme.schemeCode}</p>
                                    </div>
                                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${isSelected ? 'bg-primary text-white' : 'bg-white/10 text-white/60'
                                        }`}>
                                        {isSelected ? 'Selected' : 'Select'}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-3 text-xs">
                                    {(() => {
                                        const t = (scheme.schemeType || scheme.scheme_type || '').toLowerCase();
                                        const colors = { corporate: 'bg-blue-100 text-blue-700', insurance: 'bg-purple-100 text-purple-700', government: 'bg-amber-100 text-amber-700' };
                                        return <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${colors[t] || 'bg-slate-100 text-slate-600'}`}>{t || 'other'}</span>;
                                    })()}
                                    <span className="text-white/50">Discount: <strong className="text-white/80">{scheme.discountRate || 0}%</strong></span>
                                    <span className="inline-flex items-center gap-1 text-white/50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Active
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Upload Section — only visible when a scheme is selected */}
            {selectedScheme && (
                <div className="p-6 bg-white/5 shadow-sm border border-white/10 rounded-xl">
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                        Upload Roster for <span className="text-primary">{selectedSchemeName}</span> (Excel)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-900 border border-slate-300 rounded-lg cursor-pointer bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium whitespace-nowrap shadow-sm min-w-[140px]"
                        >
                            {uploading ? (
                                <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Uploading...</>
                            ) : (
                                <><Upload className="h-4 w-4" /> Upload</>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Required columns: 'Employee number', 'NRC', 'Name'. Missing patients will be auto-created.</p>
                </div>
            )}

            {/* Members Table */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-500" />
                        {selectedScheme
                            ? <>{selectedSchemeName} Members <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs">{members.length} Total</span></>
                            : 'Registered Members'
                        }
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, NRC or Emp No..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                                <th className="p-4">Emp No. / Policy</th>
                                <th className="p-4">NRC</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Rank</th>
                                <th className="p-4">Utilisation (Bal)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-8 text-slate-500">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                                            Loading members...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-12 text-slate-500 bg-slate-50/50">
                                        {selectedScheme ? 'No members found. Upload an Excel roster to get started.' : 'Select a scheme above to view its members.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-mono text-slate-600">{member.patientNumber || member.policyNumber || '-'}</td>
                                        <td className="p-4 text-slate-500">{member.nrc || '-'}</td>
                                        <td className="p-4 font-medium text-slate-800">{member.firstName} {member.lastName}</td>
                                        <td className="p-4">
                                            <span className="capitalize text-slate-600">{member.memberRank || 'Principal'}</span>
                                        </td>
                                        <td className="p-4 text-slate-700 font-medium">
                                            K{Number(member.balance || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${member.memberStatus === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${member.memberStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                {member.memberStatus === 'active' ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="p-4 w-40">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => toggleStatus(member.id, member.memberStatus)}
                                                    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${member.memberStatus === 'active' ? 'text-rose-600' : 'text-emerald-600'
                                                        }`}
                                                    title={member.memberStatus === 'active' ? 'Suspend Member' : 'Activate Member'}
                                                >
                                                    {member.memberStatus === 'active' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/patients/${member.id}`)}
                                                    className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="View Full Patient File"
                                                >
                                                    <LinkIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CorporateMemberManagement;
