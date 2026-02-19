import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Search, Edit, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/apiClient';

const SchemeMembers = ({ schemeId }) => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Import State
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (schemeId) {
            fetchMembers();
        }
    }, [schemeId, statusFilter]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const params = { search: searchTerm };
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get(`/receivables/schemes/${schemeId}/members`, { params });
            // Ensure response.data is an array (handle potential { data: [...] } structure if API changes)
            setMembers(Array.isArray(response.data) ? response.data : response.data.data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMembers();
    };

    const getRankBadge = (rank) => {
        const colors = {
            principal: 'bg-blue-100 text-blue-800',
            spouse: 'bg-purple-100 text-purple-800',
            child: 'bg-green-100 text-green-800',
            dependant: 'bg-gray-100 text-gray-800'
        };
        return `px-2 py-0.5 rounded text-xs font-medium uppercase ${colors[rank] || 'bg-gray-100 text-gray-800'}`;
    };

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            suspended: 'bg-red-100 text-red-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return `px-2 py-0.5 rounded text-xs font-medium uppercase ${colors[status] || 'bg-gray-100 text-gray-800'}`;
    };

    // --- CSV Import Logic ---

    const handleDownloadTemplate = () => {
        const headers = ['FirstName', 'LastName', 'DOB(YYYY-MM-DD)', 'Gender(M/F)', 'PolicyNumber', 'Rank(Principal/Spouse/Child)', 'Suffix', 'Phone', 'Email', 'NRC', 'Address'];
        const sample = ['John', 'Doe', '1980-05-20', 'M', 'POL-12345', 'Principal', '1', '0970000000', 'john@example.com', '123456/10/1', ' Lusaka'];

        const csvContent = [headers.join(','), sample.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scheme_members_template.csv';
        a.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split('\n').map(row => row.trim()).filter(row => row);

                if (rows.length < 2) {
                    alert('Invalid CSV file. Must contain header and data.');
                    return;
                }

                // --- Flexible Header Detection logic ---
                // Find the header row by looking for keywords like 'name', 'policy', 'man no'
                let headerRowIndex = 0;
                let headers = [];

                for (let i = 0; i < Math.min(rows.length, 10); i++) {
                    const candidateHeaders = rows[i].split(',').map(h => h.trim().toLowerCase());
                    const hasName = candidateHeaders.some(h => h.includes('name') || h.includes('employee'));
                    const hasId = candidateHeaders.some(h => h.includes('policy') || h.includes('man no') || h.includes('man #') || h.includes('nrc'));

                    if (hasName || hasId) {
                        headerRowIndex = i;
                        headers = candidateHeaders;
                        break; // Found the header row
                    }
                }

                if (headers.length === 0) {
                    // Fallback to first row if detection fails
                    headers = rows[0].split(',').map(h => h.trim().toLowerCase());
                }

                console.log('Detected Headers:', headers);

                const membersData = rows.slice(headerRowIndex + 1).map(row => {
                    // Handle potential empty lines or footer totals
                    if (!row || row.toLowerCase().startsWith('total')) return null;

                    const values = row.split(',').map(v => v.trim());

                    const getValue = (keywords) => {
                        const index = headers.findIndex(h => keywords.some(k => h.includes(k)));
                        return index !== -1 ? values[index] : '';
                    };

                    // --- Mapping Logic ---
                    // 1. Name: Try composite 'Name' first, then split. Or look for First/Last specific.
                    let firstName = getValue(['firstname', 'first name']);
                    let lastName = getValue(['lastname', 'last name', 'surname']);

                    if (!firstName && !lastName) {
                        const fullName = getValue(['name', 'employee name', 'patient name', 'member name']);
                        if (fullName) {
                            const parts = fullName.split(' ');
                            firstName = parts[0];
                            lastName = parts.slice(1).join(' '); // Join the rest as last name
                        }
                    }

                    // 2. Policy Number: Look for 'policy', 'man no', 'employee id'
                    let policyNumber = getValue(['policy', 'man no', 'man #', 'staff id', 'employee id']);

                    // 3. Other fields
                    return {
                        firstName: firstName || 'Unknown',
                        lastName: lastName || 'Member',
                        policyNumber: policyNumber || '', // Backend handles missing policy if nrc exists, but usually required
                        dateOfBirth: getValue(['dob', 'birth', 'date of birth']),
                        gender: getValue(['gender', 'sex']),
                        rank: getValue(['rank', 'level'])?.toLowerCase() || 'principal', // Default to Principal
                        suffix: getValue(['suffix']),
                        phone: getValue(['phone', 'mobile', 'contact']),
                        email: getValue(['email']),
                        nrc: getValue(['nrc', 'national id']),
                        address: getValue(['address', 'residence'])
                    };
                }).filter(m => m && (m.firstName !== 'Unknown' || m.policyNumber)); // Filter out empty/invalid rows

                if (membersData.length === 0) {
                    alert('No valid member records found. Please check your CSV format.');
                    return;
                }

                await uploadMembers(membersData);
            } catch (error) {
                console.error('CSV Parse Error:', error);
                alert('Failed to parse CSV file.');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = null;
    };

    const uploadMembers = async (membersData) => {
        setImporting(true);
        setImportResult(null);
        try {
            const response = await api.post(`/receivables/schemes/${schemeId}/import`, { members: membersData });
            setImportResult({ type: 'success', summary: response.data.summary });
            fetchMembers(); // Refresh list
        } catch (error) {
            console.error('Import API Error:', error);
            setImportResult({
                type: 'error',
                message: error.response?.data?.error || 'Failed to import members.'
            });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Import Status Message */}
            {importResult && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${importResult.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {importResult.type === 'success' ? (
                        <>
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold">Import Successful</h4>
                                <ul className="text-sm mt-1 list-disc list-inside">
                                    <li>Added: {importResult.summary.added}</li>
                                    <li>Updated: {importResult.summary.updated}</li>
                                    <li>Failed: {importResult.summary.failed}</li>
                                </ul>
                                {importResult.summary.errors?.length > 0 && (
                                    <div className="mt-2 text-xs text-red-600 bg-white p-2 rounded border border-red-100 max-h-32 overflow-y-auto">
                                        <p className="font-semibold mb-1">Errors:</p>
                                        {importResult.summary.errors.map((err, i) => <div key={i}>{err}</div>)}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold">Import Failed</h4>
                                <p className="text-sm">{importResult.message}</p>
                            </div>
                        </>
                    )}
                    <button onClick={() => setImportResult(null)} className="ml-auto hover:text-gray-900">&times;</button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header / Filters */}
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search name, policy, NRC..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm h-9">Search</button>
                        </form>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-select text-sm py-2 h-9"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {/* Import Actions */}
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button
                            onClick={handleDownloadTemplate}
                            className="btn btn-secondary btn-sm flex items-center gap-2"
                            title="Download CSV Template"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Template</span>
                        </button>

                        <label className={`btn btn-primary btn-sm flex items-center gap-2 cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                accept=".csv"
                                className="hidden"
                                disabled={importing}
                            />
                            {importing ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Import Members</span>
                            <span className="sm:hidden">Import</span>
                        </label>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Policy #</th>
                                <th className="px-4 py-3">Suffix</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">NRC / ID</th>
                                <th className="px-4 py-3">Rank</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading members...</td></tr>
                            ) : members.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No members found.</td></tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-gray-600">{member.policyNumber || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">*{member.memberSuffix || (member.memberRank === 'principal' ? 1 : '?')}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {member.firstName} {member.lastName}
                                            <div className="text-xs text-gray-400">{member.patientNumber}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{member.nrc || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={getRankBadge(member.memberRank)}>{member.memberRank}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={getStatusBadge(member.memberStatus)}>{member.memberStatus}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {member.policyNumber && (
                                                    <button
                                                        onClick={() => navigate(`/app/receivables/ledger/${member.policyNumber}`)}
                                                        className="p-1 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded"
                                                        title="View Family Ledger"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded"
                                                    title="Edit Member"
                                                    onClick={() => navigate(`/app/patients/${member.id}/edit`)} // Assuming patient edit route exists
                                                >
                                                    <Edit className="w-4 h-4" />
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

export default SchemeMembers;
