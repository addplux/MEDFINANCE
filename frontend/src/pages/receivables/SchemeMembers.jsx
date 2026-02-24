import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Upload,
    ArrowLeft,
    Filter,
    UserPlus,
    FileSpreadsheet,
    History,
    Shield
} from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../services/apiClient';

const SchemeMembers = ({ schemeId }) => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);

    useEffect(() => {
        if (schemeId) {
            fetchSchemeAndMembers();
        }
    }, [schemeId]);

    const fetchSchemeAndMembers = async () => {
        try {
            setLoading(true);
            const [schemeRes, membersRes] = await Promise.all([
                api.get(`/receivables/schemes/${schemeId}`),
                api.get(`/receivables/schemes/${schemeId}/members`)
            ]);
            setScheme(schemeRes.data);
            setMembers(membersRes.data.data || membersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m =>
        (m.policyNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            field: 'policyNumber',
            headerName: 'POLICY #',
            width: 130,
            renderCell: (params) => (
                <span className="font-mono font-bold text-[11px] text-primary tracking-widest">
                    {params.value}
                </span>
            )
        },
        {
            field: 'memberSuffix',
            headerName: 'SUFFIX',
            width: 80,
            renderCell: (params) => (
                <span className="text-white/60 font-bold text-[11px]">
                    {params.value || '-'}
                </span>
            )
        },
        {
            field: 'fullName',
            headerName: 'MEMBER NAME',
            width: 260,
            renderCell: (params) => (
                <div className="flex flex-col py-2">
                    <span className="font-bold text-white text-sm">
                        {`${params.row.lastName || ''}, ${params.row.firstName || ''}`}
                    </span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                        {params.row.relationship || 'MEMBER'}
                    </span>
                </div>
            )
        },
        {
            field: 'relationship',
            headerName: 'ROLE',
            width: 120,
            renderCell: (params) => (
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${params.value?.toLowerCase() === 'principal'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-white/5 text-white/50 border-white/10'
                    }`}>
                    {params.value || 'DEPENDENT'}
                </span>
            )
        },
        {
            field: 'gender',
            headerName: 'SEX',
            width: 70,
            renderCell: (params) => (
                <span className="text-white/50 font-bold text-sm uppercase">
                    {params.value?.[0] || '-'}
                </span>
            )
        },
        {
            field: 'status',
            headerName: 'STATUS',
            width: 120,
            renderCell: (params) => (
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${(params.value || 'active').toLowerCase() === 'active'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-white/5 text-white/30 border-white/10'
                    }`}>
                    {params.value || 'ACTIVE'}
                </span>
            )
        },
        {
            field: 'actions',
            headerName: 'ACTIONS',
            width: 200,
            sortable: false,
            renderCell: (params) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/app/receivables/schemes/ledger/${params.row.policyNumber}`)}
                        className="p-2 hover:bg-primary/20 rounded-xl text-white/40 hover:text-primary transition-all"
                        title="View Ledger"
                    >
                        <History size={15} />
                    </button>
                    <button
                        onClick={() => navigate(`/app/patients/${params.row.patientId}`)}
                        className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white rounded-full border border-white/5 transition-all"
                    >
                        PROFILE
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by policy number or name..."
                        className="w-full bg-white/[0.04] border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.07] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => navigate(`/app/receivables/import?schemeId=${schemeId}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-sm font-bold text-white/60 hover:text-white rounded-full border border-white/10 transition-all"
                >
                    <Upload className="w-4 h-4 text-primary" />
                    Bulk Upload
                </button>

                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,0,204,0.25)] hover:scale-[1.02] active:scale-95">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                </button>
            </div>

            {/* DataGrid */}
            <div className="bg-black/40 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-sm">
                <div style={{ height: 520 }}>
                    <DataGrid
                        rows={filteredMembers}
                        columns={columns}
                        loading={loading}
                        checkboxSelection
                        disableRowSelectionOnClick
                        getRowHeight={() => 'auto'}
                        onRowSelectionModelChange={(newSel) => setSelectedRows(newSel)}
                        sx={{
                            border: 'none',
                            color: 'white',
                            backgroundColor: 'transparent',
                            fontFamily: 'Inter, sans-serif',
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '0.65rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                color: 'rgba(255,255,255,0.7)',
                                display: 'flex',
                                alignItems: 'center',
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'rgba(255,255,255,0.03)',
                            },
                            '& .MuiDataGrid-row.Mui-selected': {
                                backgroundColor: 'rgba(255,0,204,0.08)',
                            },
                            '& .MuiDataGrid-row.Mui-selected:hover': {
                                backgroundColor: 'rgba(255,0,204,0.12)',
                            },
                            '& .MuiCheckbox-root': {
                                color: 'rgba(255,255,255,0.2)',
                            },
                            '& .MuiCheckbox-root.Mui-checked': {
                                color: 'var(--primary, #FF00CC)',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.4)',
                            },
                            '& .MuiTablePagination-root': {
                                color: 'rgba(255,255,255,0.4)',
                            },
                            '& .MuiTablePagination-actions button': {
                                color: 'rgba(255,255,255,0.3)',
                            },
                            '& .MuiDataGrid-columnSeparator': {
                                display: 'none',
                            },
                            '& .MuiDataGrid-sortIcon': {
                                color: 'rgba(255,255,255,0.3)',
                            },
                            '& .MuiDataGrid-menuIcon button': {
                                color: 'rgba(255,255,255,0.2)',
                            },
                            '& .MuiDataGrid-overlay': {
                                backgroundColor: 'transparent',
                                color: 'rgba(255,255,255,0.3)',
                            },
                        }}
                    />
                </div>
            </div>

            {/* Floating bulk-action bar */}
            {selectedRows.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-primary px-10 py-4 rounded-full shadow-[0_0_50px_rgba(255,0,204,0.5)] flex items-center gap-6 border border-white/20">
                        <p className="text-[11px] font-black text-white uppercase tracking-widest">
                            <span className="text-lg mr-2">{selectedRows.length}</span> Selected
                        </p>
                        <div className="h-5 w-px bg-white/30"></div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white">Suspend</button>
                        <button className="bg-white text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-colors">Terminate Access</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemeMembers;
