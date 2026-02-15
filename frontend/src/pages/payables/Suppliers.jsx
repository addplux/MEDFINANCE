import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { payablesAPI } from '../../services/apiService';
import { Building2, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const Suppliers = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadSuppliers();
    }, [currentPage]);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const params = { page: currentPage, limit: 10 };
            const response = await payablesAPI.suppliers.getAll(params);
            setSuppliers(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) return;

        try {
            await payablesAPI.suppliers.delete(id);
            loadSuppliers();
        } catch (error) {
            console.error('Failed to delete supplier:', error);
            alert('Failed to delete supplier');
        }
    };

    const getStatusBadge = (status) => {
        return status === 'active' ? 'badge-success' : 'badge-danger';
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-600 mt-1">Manage supplier accounts</p>
                </div>
                <button
                    onClick={() => navigate('/app/payables/suppliers/new')}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Supplier
                </button>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-11"
                    />
                </div>
            </div>

            {/* Suppliers Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Supplier Code</th>
                                <th>Supplier Name</th>
                                <th>Contact Person</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        {loading ? 'Loading...' : 'No suppliers found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id}>
                                        <td className="font-medium">{supplier.supplierCode}</td>
                                        <td>{supplier.supplierName}</td>
                                        <td>{supplier.contactPerson || '-'}</td>
                                        <td>{supplier.phone || '-'}</td>
                                        <td>{supplier.email || '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(supplier.status)}`}>
                                                {supplier.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/payables/suppliers/${supplier.id}`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/app/payables/suppliers/${supplier.id}/edit`)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="card-footer flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-sm btn-secondary"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-sm btn-secondary"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Suppliers;
