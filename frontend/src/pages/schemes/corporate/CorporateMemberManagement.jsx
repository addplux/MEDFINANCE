import React, { useState, useEffect } from 'react';
import { Download, Upload, Search, Link as LinkIcon, CheckCircle, XCircle, Users, UserPlus, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { receivablesAPI } from '../../../services/apiService';
import { useToast } from '../../../context/ToastContext';
import AddMemberModal from './AddMemberModal';

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
    const [showUpload, setShowUpload] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    useEffect(() => {
        fetchSchemes();
    }, []);

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
            const data = response.data || [];
            setMembers(data);
            setShowUpload(data.length === 0);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            addToast('error', 'Failed to load member list.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => setSelectedFile(event.target.files[0]);

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
            const { summary } = response.data;
            addToast('success', summary ? `Imported: ${summary.added}, Updated: ${summary.updated}` : `Upload successful!`);
            setSelectedFile(null);
            fetchMembers(selectedScheme);
        } catch (error) {
            addToast('error', error.response?.data?.error || 'Failed to upload roster.');
        } finally {
            setUploading(false);
        }
    };

    const toggleStatus = async (patientId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Confirm member ${newStatus}?`)) return;

        try {
            await receivablesAPI.schemes.updateMemberStatus(selectedScheme, patientId, newStatus);
            setMembers(members.map(m => m.id === patientId ? { ...m, memberStatus: newStatus } : m));
            addToast('success', `Status updated successfully.`);
        } catch (error) {
            addToast('error', 'Failed to update status.');
        }
    };

    const filteredMembers = members.filter(m =>
        m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.patientNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nrc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedSchemeName = corporateSchemes.find(s => String(s.id) === String(selectedScheme))?.schemeName || 'Scheme';

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80">Corporate Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Member <span className="text-slate-400 font-light">Ecosystem</span></h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Manage corporate enrollments, utilization limits, and membership statuses.</p>
                </div>
            </div>

            {/* Scheme Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {corporateSchemes.map(scheme => {
                    const isSelected = String(selectedScheme) === String(scheme.id);
                    return (
                        <button
                            key={scheme.id}
                            onClick={() => setSelectedScheme(String(scheme.id))}
                            className={`group relative p-5 rounded-[1.5rem] border transition-all duration-300 ${
                                isSelected 
                                ? 'bg-white border-blue-200 shadow-xl shadow-blue-500/5 ring-1 ring-blue-100' 
                                : 'bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`} />
                            </div>
                            <h3 className={`font-black text-sm uppercase tracking-tight mb-1 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                                {scheme.schemeName}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{scheme.schemeCode}</p>
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            {selectedScheme ? (
                <div className="flex flex-col gap-6">
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Find member by name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-400 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button 
                                onClick={() => setShowUpload(!showUpload)}
                                className={`h-12 px-5 font-bold rounded-2xl transition-all flex items-center gap-2 ${showUpload ? 'bg-slate-100 text-slate-900' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Upload className="w-4 h-4" />
                                Import
                            </button>
                            <button 
                                onClick={() => setShowAddMember(true)}
                                className="h-12 px-6 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Member
                            </button>
                        </div>
                    </div>

                    {/* Upload Area */}
                    {showUpload && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-8 animate-in slide-in-from-top-4 duration-300">
                            <div className="max-w-xl mx-auto text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">Import Membership Roster</h3>
                                <p className="text-slate-500 text-sm mb-6">Drop your Excel file here to auto-enroll patients into <b>{selectedSchemeName}</b>.</p>
                                
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm"
                                    />
                                    <button 
                                        onClick={handleUpload}
                                        disabled={uploading || !selectedFile}
                                        className="h-12 px-8 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {uploading ? 'Processing...' : 'Upload Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table Container */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-12">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Membership Identity</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Info</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tier</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Utilization</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-black uppercase tracking-widest">Synchronizing...</td></tr>
                                    ) : filteredMembers.length === 0 ? (
                                        <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No matches found</td></tr>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="font-mono font-black text-slate-400 text-[11px] tracking-tighter uppercase mb-1">
                                                        {member.patientNumber || member.policyNumber || 'GEN-000'}
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-500">{member.nrc || 'No NRC Record'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-900 text-sm tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                                                        {member.firstName} {member.lastName}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase">
                                                        {member.memberRank || 'Principal'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <p className="font-black text-slate-900 text-sm">K{Number(member.balance || 0).toLocaleString()}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        <div className={`w-2 h-2 rounded-full ${member.memberStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_8px_rgba(16,185,129,0.3)]`} />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => toggleStatus(member.id, member.memberStatus)}
                                                            className={`p-2 rounded-xl transition-all ${member.memberStatus === 'active' ? 'text-rose-400 hover:bg-rose-50' : 'text-emerald-400 hover:bg-emerald-50'}`}
                                                        >
                                                            {member.memberStatus === 'active' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate(`/app/patients/${member.id}`)}
                                                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
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
            ) : (
                <div className="flex-1 flex items-center justify-center p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div>
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-slate-200" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-widest">Select Operational Unit</h2>
                        <p className="text-slate-400 text-sm font-medium">Choose a corporate scheme from the cards above to manage membership data.</p>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showAddMember && selectedScheme && (
                <AddMemberModal
                    schemeId={selectedScheme}
                    schemeName={selectedSchemeName}
                    onClose={() => setShowAddMember(false)}
                    onSuccess={() => fetchMembers(selectedScheme)}
                />
            )}
        </div>
    );
};

export default CorporateMemberManagement;
