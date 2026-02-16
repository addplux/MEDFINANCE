import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';

const Schemes = () => {
    const navigate = useNavigate();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchSchemes();
    }, [statusFilter]);

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const response = await apiService.get('/receivables/schemes', { params });
            setSchemes(response.data || []);
        } catch (error) {
            console.error('Error fetching schemes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSchemes = schemes.filter(scheme =>
        scheme.schemeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.schemeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.schemeType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const badges = {
            'active': 'badge-success',
            'suspended': 'badge-warning',
            'inactive': 'badge-secondary'
        };
        return `badge ${badges[status] || 'badge-success'}`;
    };

    const getSchemeTypeBadge = (type) => {
        const badges = {
            'insurance': 'badge-primary',
            'discount': 'badge-info',
            'government': 'badge-warning'
        };
        return `badge ${badges[type] || 'badge-secondary'}`;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Schemes</h1>
                    <p className="page-subtitle">Manage insurance schemes and discount programs</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/app/receivables/schemes/new')}>
                    <Plus size={20} />
                    New Scheme
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search schemes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading-state">Loading schemes...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Scheme Code</th>
                                    <th>Scheme Name</th>
                                    <th>Type</th>
                                    <th>Discount Rate</th>
                                    <th>Contact Person</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSchemes.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            <div className="empty-state">
                                                <Shield size={48} />
                                                <p>No schemes found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSchemes.map((scheme) => (
                                        <tr key={scheme.id}>
                                            <td className="font-medium">{scheme.schemeCode}</td>
                                            <td>{scheme.schemeName}</td>
                                            <td>
                                                <span className={getSchemeTypeBadge(scheme.schemeType)}>
                                                    {scheme.schemeType}
                                                </span>
                                            </td>
                                            <td>{scheme.discountRate}%</td>
                                            <td>{scheme.contactPerson || '-'}</td>
                                            <td>{scheme.phone || '-'}</td>
                                            <td>
                                                <span className={getStatusBadge(scheme.status)}>
                                                    {scheme.status || 'active'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-sm btn-secondary"
                                                    onClick={() => navigate(`/app/receivables/schemes/${scheme.id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Schemes;
