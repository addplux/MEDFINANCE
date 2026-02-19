import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Search, Edit, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/apiClient';
import * as XLSX from 'xlsx';

const SchemeMembers = ({ schemeId }) => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Import State
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [columnMapping, setColumnMapping] = useState({
        firstName: '',
        lastName: '', // Optional if name is full
        fullName: '', // Alternative to First/Last
        policyNumber: '',
        nrc: '',
        gender: '',
        dob: '',
        phone: '',
        address: '',
        rank: '',
        suffix: ''
    });
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

    const [allRows, setAllRows] = useState([]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCsvFile(file);
        const reader = new FileReader();

        const processWorkbook = (wb) => {
            const sheetName = wb.SheetNames[0];
            const ws = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); // Array of arrays

            if (data.length < 2) {
                alert('Invalid file: too few rows.');
                return;
            }

            setAllRows(data);

            // Header Recognition (Look for "Name" or "Policy" in first 20 rows)
            let headerRowIndex = 0;
            let headers = [];

            for (let i = 0; i < Math.min(data.length, 20); i++) {
                const row = data[i].map(c => String(c).trim());
                const sig = row.join(' ').toLowerCase();
                if ((sig.includes('name') || sig.includes('consult') || sig.includes('man no') || sig.includes('policy')) && row.length > 1) {
                    headerRowIndex = i;
                    headers = row;
                    break;
                }
            }

            if (headers.length === 0) headers = data[0].map(c => String(c).trim());

            setCsvHeaders(headers);
            setCsvHeaders(headers);
            setCsvPreview(data.slice(headerRowIndex + 1, headerRowIndex + 11)); // Preview next 10 rows

            // Auto-guess columns
            const lowerHeaders = headers.map(h => h.toLowerCase());
            const guess = (keywords) => {
                const key = keywords.find(k => lowerHeaders.some(h => h.includes(k)));
                return key ? headers[lowerHeaders.findIndex(h => h.includes(key))] : '';
            };

            setColumnMapping({
                firstName: guess(['firstname', 'first name', 'given name']) || '',
                lastName: guess(['lastname', 'last name', 'surname']) || '',
                fullName: guess(['name', 'employee name', 'patient name', 'member name']) || '',
                policyNumber: guess(['policy', 'man no', 'man #', 'staff id', 'employee id', 'ref no']) || '',
                consultation: guess(['consultation', 'consult']) || '',
                total: guess(['total', 'amount', 'balance', 'charge']) || '',
                dob: guess(['dob', 'birth', 'date of birth']) || '',
                phone: guess(['phone', 'mobile', 'contact', 'cell']) || '',
                address: guess(['address', 'residence', 'location']) || '',
                rank: guess(['rank', 'level', 'grade']) || '',
                suffix: guess(['suffix']) || '',
            });

            setShowMappingModal(true);
        };

        reader.onload = (event) => {
            try {
                const data = event.target.result;
                let workbook;
                if (file.name.endsWith('.csv')) {
                    // Force read CSV as string first to handle encodings if needed, but binary is safer for XLSX read
                    workbook = XLSX.read(data, { type: 'binary' });
                } else {
                    workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                }
                processWorkbook(workbook);
            } catch (error) {
                console.error('File Parse Error:', error);
                alert('Failed to parse file. Please check the format.');
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
        e.target.value = null; // Reset input
    };

    const processImport = async () => {
        if (!allRows || allRows.length === 0) return;

        // Find header row again using the mapped Policy Number column name
        const policyColName = columnMapping.policyNumber;
        let headerRowIndex = 0;

        // Find line where headers match
        for (let i = 0; i < Math.min(allRows.length, 20); i++) {
            const row = allRows[i].map(c => String(c).trim());
            if (row.includes(policyColName)) {
                headerRowIndex = i;
                break;
            }
        }

        const headers = allRows[headerRowIndex].map(c => String(c).trim());
        const getIndex = (name) => headers.indexOf(name);

        const membersData = allRows.slice(headerRowIndex + 1).map(row => {
            // Safe access helper
            const getVal = (mappingKey) => {
                const colName = columnMapping[mappingKey];
                if (!colName) return '';
                const idx = getIndex(colName);
                if (idx === -1) return '';
                return row[idx] ? String(row[idx]).trim() : '';
            };

            // Skip total rows or empty rows
            if (!row || row.length === 0) return null;
            // Crude check for total line
            if (String(row[0]).toLowerCase().includes('total')) return null;

            let fName = getVal('firstName');
            let lName = getVal('lastName');
            const full = getVal('fullName');

            if (!fName && full) {
                const parts = full.split(/\s+/);
                if (parts.length > 0) {
                    fName = parts[0];
                    lName = parts.slice(1).join(' ');
                }
            }

            return {
                firstName: fName || 'Unknown',
                lastName: lName || 'Member',
                policyNumber: getVal('policyNumber'),
                balance: getVal('total') ? parseFloat(getVal('total').replace(/[^0-9.-]+/g, "")) : 0, // Clean currency
                dateOfBirth: getVal('dob'),
                phone: getVal('phone'),
                address: getVal('address'),
                rank: getVal('rank')?.toLowerCase() || 'principal',
                suffix: getVal('suffix')
            };
        }).filter(m => m && m.policyNumber && m.policyNumber.length > 1); // Strict filter: must have policy number

        await uploadMembers(membersData);
        setShowMappingModal(false);
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
                                accept=".csv, .xlsx, .xls"
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

            {/* Modal for Column Mapping */}
            {showMappingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-semibold text-lg text-gray-800">Map File Columns</h3>
                            <button onClick={() => setShowMappingModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-6 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Please select the columns from your uploaded file that match the required fields below.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name Mapping */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Full Name Column <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                        value={columnMapping.fullName || columnMapping.firstName}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, fullName: e.target.value, firstName: '' })}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Select the column containing the member's name (e.g. "Employee Name").</p>
                                </div>

                                {/* Policy Mapping */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Policy / Man Number <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                        value={columnMapping.policyNumber}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, policyNumber: e.target.value })}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                {/* "Consultation" Mapping (Dummy/Validation) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Consultation
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                        value={columnMapping.consultation}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, consultation: e.target.value })}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                {/* "Total" Mapping (Balances) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Total Bill / Balance
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                        value={columnMapping.total}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, total: e.target.value })}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {csvHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="mt-8">
                                <h4 className="font-semibold text-sm mb-2 text-gray-700">File Preview (First 10 Rows)</h4>
                                <div className="overflow-x-auto border border-gray-200 rounded-md bg-gray-50">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                                            <tr>{csvHeaders.map((h, i) => <th key={i} className="px-3 py-2 whitespace-nowrap">{h}</th>)}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {csvPreview.map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((cell, j) => <td key={j} className="px-3 py-2 whitespace-nowrap text-gray-600">{cell}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowMappingModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processImport}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                disabled={importing || !(columnMapping.policyNumber && (columnMapping.firstName || columnMapping.fullName))}
                            >
                                {importing ? 'Importing...' : 'Import Members'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemeMembers;
