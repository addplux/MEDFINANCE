import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, FileText, Search, Edit } from 'lucide-react';
import api from '../../services/apiClient';

const SchemeMembers = ({ schemeId }) => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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
            setMembers(response.data);
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

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header / Filters */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search name, policy, NRC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                </form>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select text-sm py-2"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="closed">Closed</option>
                </select>
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
    );
};

export default SchemeMembers;
