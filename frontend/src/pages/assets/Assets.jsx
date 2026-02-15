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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Asset Register</h1>
                    <p className="text-gray-600 mt-1">Manage fixed assets and depreciation</p>
                </div>
                <button
                    onClick={() => navigate('/app/assets/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Asset
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pl-11"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="form-select"
                    >
                        <option value="">All Categories</option>
                        <option value="equipment">Equipment</option>
                        <option value="furniture">Furniture</option>
                        <option value="vehicles">Vehicles</option>
                        <option value="buildings">Buildings</option>
                    </select>
                    <button onClick={loadAssets} className="btn btn-secondary">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Assets Table */}
            <div className="card overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="table">
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
                                    <td colSpan="8" className="text-center py-8 text-gray-500">
                                        {loading ? 'Loading...' : 'No assets found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id}>
                                        <td className="font-medium">{asset.assetTag}</td>
                                        <td>{asset.assetName}</td>
                                        <td className="capitalize">{asset.category}</td>
                                        <td className="font-semibold">K {asset.purchasePrice?.toLocaleString()}</td>
                                        <td className="text-orange-600">
                                            K {asset.accumulatedDepreciation?.toLocaleString() || '0.00'}
                                        </td>
                                        <td className="font-semibold text-green-600">
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
                                                    onClick={() => navigate(`/app/assets/${asset.id}`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
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

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredAssets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {loading ? 'Loading...' : 'No assets found'}
                        </div>
                    ) : (
                        filteredAssets.map((asset) => (
                            <div key={asset.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-gray-900">{asset.assetName}</div>
                                        <div className="text-sm text-gray-500">{asset.assetTag}</div>
                                    </div>
                                    <span className={getStatusBadge(asset.status)}>
                                        {asset.status?.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm flex justify-between">
                                        <span className="text-gray-500">Category:</span>
                                        <span className="capitalize">{asset.category}</span>
                                    </div>
                                    <div className="text-sm flex justify-between">
                                        <span className="text-gray-500">Purchase Price:</span>
                                        <span className="font-semibold">K {asset.purchasePrice?.toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm flex justify-between">
                                        <span className="text-gray-500">Book Value:</span>
                                        <span className="font-semibold text-green-600">K {calculateBookValue(asset).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                    <button
                                        onClick={() => navigate(`/app/assets/${asset.id}`)}
                                        className="btn btn-sm btn-secondary flex-1 justify-center"
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/app/assets/${asset.id}/edit`)}
                                        className="btn btn-sm btn-secondary flex-1 justify-center"
                                    >
                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(asset.id)}
                                        className="btn btn-sm btn-danger flex-1 justify-center"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assets;
