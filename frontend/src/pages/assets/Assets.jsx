import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetAPI } from '../../services/apiService';
import { Package, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const Assets = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        loadAssets();
    }, [categoryFilter]);

    const loadAssets = async () => {
        try {
            setLoading(true);
            const params = { category: categoryFilter || undefined };
            const response = await assetAPI.getAll(params);
            setAssets(response.data);
        } catch (error) {
            console.error('Failed to load assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) return;

        try {
            await assetAPI.delete(id);
            loadAssets();
        } catch (error) {
            console.error('Failed to delete asset:', error);
            alert('Failed to delete asset');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'badge-success',
            disposed: 'badge-danger',
            under_maintenance: 'badge-warning'
        };
        return `badge ${badges[status] || 'badge-info'} `;
    };

    const calculateBookValue = (asset) => {
        return asset.purchasePrice - (asset.accumulatedDepreciation || 0);
    };

    const filteredAssets = assets.filter(asset =>
        asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Asset Register</h1>
                    <p className="page-subtitle">Manage fixed assets, acquisition, and depreciation tracking</p>
                </div>
                <button
                    onClick={() => navigate('/app/assets/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Asset
                </button>
            </div>

            <div className="card mb-6">
                <div className="card-header border-b-0 flex flex-col md:flex-row gap-4">
                    <div className="search-box">
                        <Search className="text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Search assets by tag or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="filter-select md:w-48"
                    >
                        <option value="">All Categories</option>
                        <option value="equipment">Equipment</option>
                        <option value="furniture">Furniture</option>
                        <option value="vehicles">Vehicles</option>
                        <option value="buildings">Buildings</option>
                    </select>
                </div>
            </div>

            {/* Assets Table */}
            <div className="card">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Asset Tag</th>
                                <th>Asset Name</th>
                                <th>Category</th>
                                <th>Purchase Price</th>
                                <th>Depreciation</th>
                                <th>Book Value</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12">
                                        <div className="empty-state">
                                            <Package size={48} />
                                            <p>{loading ? 'Loading...' : 'No assets found'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id}>
                                        <td className="font-medium">{asset.assetTag}</td>
                                        <td>{asset.assetName}</td>
                                        <td className="capitalize">{asset.category}</td>
                                        <td className="font-semibold">K {asset.purchasePrice?.toLocaleString()}</td>
                                        <td className="text-error">
                                            K {asset.accumulatedDepreciation?.toLocaleString() || '0.00'}
                                        </td>
                                        <td className="font-semibold text-success">
                                            K {calculateBookValue(asset).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={getStatusBadge(asset.status)}>
                                                {asset.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/assets/${asset.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.id)}
                                                    className="btn btn-sm btn-danger"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

export default Assets;
