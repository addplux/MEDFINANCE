import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Search, Edit, Upload, Download, AlertCircle, CheckCircle, ChevronDown, Activity, ChevronRight, X } from 'lucide-react';
import api from '../../services/apiClient';
import { DataGrid } from '@mui/x-data-grid';
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
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvPreview, setCsvPreview] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [columnMapping, setColumnMapping] = useState({
        firstName: '', lastName: '', fullName: '',
        policyNumber: '', nrc: '', gender: '', dob: '', phone: '', address: '', rank: '', suffix: '',
        consultation: '', total: '',
        nursingCare: '', laboratory: '', radiology: '', dental: '', lodging: '', surgicals: '',
        drRound: '', food: '', physio: '', pharmacy: '', sundries: '', antenatal: ''
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (schemeId) {
            fetchMembers();
            fetchServices();
        }
    }, [schemeId, searchTerm, statusFilter]);

    const fetchServices = async () => {
        try {
            const res = await api.get('/receivables/services');
            setServices(res.data);
        } catch (err) {
            console.error('Failed to fetch services', err);
        }
    };

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
                // Detailed Guesses
                nursingCare: guess(['nursing', 'nursing care']) || '',
                laboratory: guess(['lab', 'laboratory']) || '',
                radiology: guess(['radio', 'radiology', 'xray', 'scan']) || '',
                dental: guess(['dental']) || '',
                lodging: guess(['lodging', 'ward']) || '',
                surgicals: guess(['surgical', 'theatre']) || '',
                drRound: guess(['round', 'dr round', 'doctor']) || '',
                food: guess(['food', 'meal']) || '',
                physio: guess(['physio']) || '',
                pharmacy: guess(['pharmacy', 'drug', 'medication']) || '',
                sundries: guess(['sundries', 'sundary']) || '',
                antenatal: guess(['antenatal', 'maternity']) || ''
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

            const cleanNum = (val) => val ? parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0 : 0;

            return {
                firstName: fName || 'Unknown',
                lastName: lName || 'Member',
                policyNumber: getVal('policyNumber'),
                balance: cleanNum(getVal('total')),
                dateOfBirth: getVal('dob'),
                phone: getVal('phone'),
                address: getVal('address'),
                rank: getVal('rank')?.toLowerCase() || 'principal',
                suffix: getVal('suffix'),
                // Detailed
                nursingCare: cleanNum(getVal('nursingCare')),
                laboratory: cleanNum(getVal('laboratory')),
                radiology: cleanNum(getVal('radiology')),
                dental: cleanNum(getVal('dental')),
                lodging: cleanNum(getVal('lodging')),
                surgicals: cleanNum(getVal('surgicals')),
                drRound: cleanNum(getVal('drRound')),
                food: cleanNum(getVal('food')),
                physio: cleanNum(getVal('physio')),
                pharmacy: cleanNum(getVal('pharmacy')),
                sundries: cleanNum(getVal('sundries')),
                antenatal: cleanNum(getVal('antenatal'))
            };
        }).filter(m => m && m.policyNumber && m.policyNumber.length > 1); // Strict filter: must have policy number

        await uploadMembers(membersData);
        setShowMappingModal(false);
        setSelectedService(''); // Reset service selection
    };

    const uploadMembers = async (membersData) => {
        setImporting(true);
        setImportResult(null);
        try {
            const response = await api.post(`/receivables/schemes/${schemeId}/import`, {
                members: membersData,
                serviceId: selectedService || null
            });
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


    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const columns = [
        { field: 'policyNumber', headerName: 'Policy #', width: 110, renderCell: (params) => <span className="font-bold text-slate-800">{params.value}</span> },
        { field: 'memberSuffix', headerName: 'Suf', width: 60, renderCell: (params) => <span className="font-semibold text-slate-500">{params.value || '-'}</span> },
        { field: 'fullName', headerName: 'Name', width: 180, renderCell: (params) => <span className="font-bold text-slate-700">{`${params.row.lastName}, ${params.row.firstName}`}</span> },
        { field: 'nursingCare', headerName: 'Nurs', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'laboratory', headerName: 'Lab', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'radiology', headerName: 'Rad', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'dental', headerName: 'Dent', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'lodging', headerName: 'Lodge', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'surgicals', headerName: 'Surg', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'drRound', headerName: 'Dr', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'food', headerName: 'Food', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-500">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'physio', headerName: 'Physio', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-400">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'pharmacy', headerName: 'Pharm', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-400">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'sundries', headerName: 'Sund', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-400">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'antenatal', headerName: 'Ante', width: 80, type: 'number', renderCell: (params) => <span className="font-semibold text-slate-400">{Number(params.value || 0).toLocaleString()}</span> },
        { field: 'balance', headerName: 'Total', width: 100, type: 'number', renderCell: (params) => <span className="font-black text-blue-600">{Number(params.value || 0).toLocaleString()}</span> },
        {
            field: 'memberStatus', headerName: 'Sts', width: 70, renderCell: (params) => (
                <span className={`px-2 py-0.5 inline-flex text-[9px] leading-tight font-black rounded-md uppercase tracking-widest ${params.value === 'active' ? 'bg-green-100/50 text-green-700 border border-green-200' : 'bg-red-100/50 text-red-700 border border-red-200'}`}>
                    {params.value.substring(0, 3)}
                </span>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <div className="flex items-center gap-2">
                    {params.row.policyNumber && (
                        <button
                            onClick={() => navigate(`/app/receivables/ledger/${params.row.policyNumber}`)}
                            className="p-1 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                            title="View Family Ledger"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded transition-colors"
                        title="Edit Member"
                        onClick={() => navigate(`/app/patients/${params.row.id}/edit`)}
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (

        <div className="flex flex-col h-full space-y-3 min-w-0 bg-transparent text-white p-4">
            {/* Import Status Message */}
            {importResult && (
                <div className={`p-4 rounded-xl flex items-start gap-3 animate-fade-in ${importResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {importResult.type === 'success' ? (
                        <>
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-black uppercase tracking-tight">Import Successful</h4>
                                <ul className="text-sm mt-1 font-medium tracking-tight">
                                    <li>Added: {importResult.summary.added}</li>
                                    <li>Updated: {importResult.summary.updated}</li>
                                    <li>Failed: {importResult.summary.failed}</li>
                                </ul>
                                {importResult.summary.errors?.length > 0 && (
                                    <div className="mt-2 text-xs bg-gray-100 p-3 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
                                        <p className="font-bold mb-1 uppercase tracking-widest text-[10px] text-gray-500">Error Log:</p>
                                        {importResult.summary.errors.map((err, i) => <div key={i} className="mb-1">{err}</div>)}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-black uppercase tracking-tight">System Error</h4>
                                <p className="text-sm font-medium tracking-tight">{importResult.message}</p>
                            </div>
                        </>
                    )}
                    <button onClick={() => setImportResult(null)} className="ml-auto p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">&times;</button>
                </div>
            )}

            <div className="flex flex-col flex-1 bg-white/[0.02] border border-white/10 overflow-hidden min-w-0 rounded-2xl shadow-sm">
                {/* Header / Filters (Compact Style) */}
                <div className="p-3 border-b border-white/10 flex flex-wrap gap-3 items-center flex-shrink-0 bg-transparent backdrop-blur-md">
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-[11px] focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all w-full placeholder-white/30 font-medium text-white shadow-sm"
                                />
                            </div>
                            <button type="submit" className="px-4 py-1.5 bg-white/10 text-white hover:bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all shadow-sm border border-white/5">
                                Search
                            </button>
                        </form>

                        <div className="relative w-full sm:w-auto">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full sm:w-auto px-4 py-1.5 bg-white/5 border border-white/10 rounded-md text-[11px] font-bold text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer appearance-none uppercase tracking-wide hover:bg-white/10 transition-all shadow-sm pr-8"
                            >
                                <option value="all" className="bg-bg-primary">All Status</option>
                                <option value="active" className="bg-bg-primary">Active</option>
                                <option value="suspended" className="bg-bg-primary">Suspended</option>
                                <option value="closed" className="bg-bg-primary">Closed</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>
                    </div>

                    {/* Import Actions */}
                    <div className="flex gap-2 w-full md:w-auto justify-end ml-auto">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all shadow-sm"
                            title="Download CSV Template"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Template</span>
                        </button>

                        <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-black rounded-md text-[11px] font-black uppercase tracking-wide transition-all shadow-sm cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>Import</span>
                        </label>
                    </div>
                </div>

                {/* Table - Fixed Scroll Container */}
                <div className="flex-1 w-full relative flex flex-col min-h-[400px] overflow-hidden">
                    <DataGrid
                        rows={members}
                        columns={columns}
                        pageSizeOptions={[10, 25, 100]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                        }}
                        disableRowSelectionOnClick
                        density="compact"
                        sx={{
                            border: 0,
                            backgroundColor: 'transparent',
                            fontFamily: 'inherit',
                            color: '#ffffff',
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'transparent',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                            },
                            '& .MuiDataGrid-columnHeaderTitle': {
                                color: 'rgba(255,255,255,0.5)',
                                fontWeight: 800,
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                            },
                            '& .MuiDataGrid-columnHeader': {
                                color: 'rgba(255,255,255,0.7)',
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '12px',
                                color: 'rgba(255,255,255,0.8)',
                                fontWeight: 500,
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'rgba(255,255,255,0.02)',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'transparent',
                                color: 'rgba(255,255,255,0.5)',
                            },
                            '& .MuiTablePagination-root': {
                                color: 'rgba(255,255,255,0.5)',
                            },
                            '& .MuiIconButton-root': {
                                color: 'rgba(255,255,255,0.5)',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                                '&::-webkit-scrollbar-track': { background: 'transparent' },
                                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '6px' },
                                '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
                            },
                        }}
                    />
                </div>
            </div>
            {/* Modal for Column Mapping */}
            {showMappingModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
                    <div className="bg-bg-secondary border border-white/5 rounded-[3rem] shadow-[0_32px_120px_rgba(0,0,0,0.8)] w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden text-white">
                        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <h3 className="font-black text-3xl uppercase tracking-tighter">MAP COLUMNS</h3>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Initialize member data structure</p>
                            </div>
                            <button onClick={() => setShowMappingModal(false)} className="p-3 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all text-2xl font-black">&times;</button>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                            <div className="bg-primary/10 text-primary p-6 rounded-[2rem] text-sm flex items-start gap-4 border border-primary/20 shadow-[0_0_30px_rgba(255,0,204,0.1)]">
                                <AlertCircle className="w-6 h-6 shrink-0" />
                                <p className="font-bold tracking-tight">Verify that the file headers match our system requirements. Required fields are marked with an asterisk.</p>
                            </div>

                            {/* Global Service Selection */}
                            <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem]">
                                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 ml-2">
                                    Assign Service / Department
                                </label>
                                <div className="relative max-w-md group">
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase tracking-widest"
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                    >
                                        <option value="" className="bg-bg-primary">-- Auto-Detect Service --</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id} className="bg-bg-primary">{s.serviceName} {s.department ? `(${s.department})` : ''}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Name Mapping */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">
                                        Full Name Column <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                                            value={columnMapping.fullName || columnMapping.firstName}
                                            onChange={(e) => setColumnMapping({ ...columnMapping, fullName: e.target.value, firstName: '' })}
                                        >
                                            <option value="" className="bg-bg-primary text-white/40">Select Column</option>
                                            {csvHeaders.map((h, i) => <option key={i} value={h} className="bg-bg-primary">{h}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Policy Mapping */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">
                                        Policy / Man Number <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                                            value={columnMapping.policyNumber}
                                            onChange={(e) => setColumnMapping({ ...columnMapping, policyNumber: e.target.value })}
                                        >
                                            <option value="" className="bg-bg-primary text-white/40">Select Column</option>
                                            {csvHeaders.map((h, i) => <option key={i} value={h} className="bg-bg-primary">{h}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-8 text-center">FINANCIAL ENGINE MAPPING</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {['consultation', 'total', 'nursingCare', 'laboratory', 'radiology', 'dental', 'lodging', 'surgicals', 'drRound', 'food', 'physio', 'pharmacy', 'sundries', 'antenatal'].map(field => (
                                        <div key={field} className="space-y-2">
                                            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">
                                                {field.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white/70 hover:bg-white/5 hover:border-white/10 transition-all appearance-none"
                                                    value={columnMapping[field]}
                                                    onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                                                >
                                                    <option value="" className="bg-bg-primary">(SKIP)</option>
                                                    {csvHeaders.map((h, i) => <option key={i} value={h} className="bg-bg-primary">{h}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/10 pointer-events-none" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="pt-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">DATA PREVIEW</h4>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-white/20">FIRST 10 RECORDS</span>
                                </div>
                                <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-black/20 custom-scrollbar shadow-inner">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-white/[0.03] border-b border-white/5 text-white/40 font-black uppercase tracking-widest">
                                            <tr>{csvHeaders.map((h, i) => <th key={i} className="px-6 py-4 whitespace-nowrap">{h}</th>)}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {csvPreview.map((row, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                    {row.map((cell, j) => <td key={j} className="px-6 py-4 whitespace-nowrap text-white/60 font-medium">{cell}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-8 border-t border-white/5 flex justify-end gap-5 bg-white/[0.02]">
                            <button
                                onClick={() => setShowMappingModal(false)}
                                className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processImport}
                                className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] disabled:opacity-20"
                                disabled={importing || !(columnMapping.policyNumber && (columnMapping.firstName || columnMapping.fullName))}
                            >
                                {importing ? 'Processing Architecture...' : 'EXECUTE IMPORT'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div>
    );
};

export default SchemeMembers;
