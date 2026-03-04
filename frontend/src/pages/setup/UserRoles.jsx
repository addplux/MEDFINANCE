import React, { useState, useEffect } from 'react';
import { getRoles, deleteRole, createRole, updateRole } from '../../services/roleService';
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';

const UserRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: {}
    });

    const resources = ['patients', 'billing', 'finance', 'reports', 'settings', 'users'];
    const actions = ['read', 'write', 'delete'];

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            console.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await deleteRole(id);
                fetchRoles();
            } catch (error) {
                alert('Failed to delete role. It might be assigned to users.');
            }
        }
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: role.permissions || {}
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingRole(null);
        setFormData({
            name: '',
            description: '',
            permissions: {}
        });
        setShowModal(true);
    };

    const handlePermissionChange = (resource, action) => {
        setFormData(prev => {
            const currentPermissions = prev.permissions[resource] || [];
            const newPermissions = currentPermissions.includes(action)
                ? currentPermissions.filter(p => p !== action)
                : [...currentPermissions, action];

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [resource]: newPermissions
                }
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRole(editingRole.id, formData);
            } else {
                await createRole(formData);
            }
            setShowModal(false);
            fetchRoles();
        } catch (error) {
            alert('Failed to save role');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">User Roles &amp; Permissions</h1>
                <button
                    onClick={handleCreate}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <FaPlus /> Add Role
                </button>
            </div>

            {/* Main Table */}
            <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
                <table className="w-full text-left">
                    <thead className="bg-gray-900 border-b border-gray-800">
                        <tr>
                            <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Role Name</th>
                            <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Description</th>
                            <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Users</th>
                            <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Created At</th>
                            <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-gray-900/60 transition-colors">
                                <td className="p-4 font-medium text-white">
                                    {role.name}
                                    {role.isSystem && <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">System</span>}
                                </td>
                                <td className="p-4 text-gray-400">{role.description}</td>
                                <td className="p-4 text-gray-400">{role.users?.length || 0} users</td>
                                <td className="p-4 text-gray-400">{new Date(role.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(role)}
                                            className="p-1.5 text-blue-400 hover:bg-blue-900/40 rounded transition-colors"
                                        >
                                            <FaEdit />
                                        </button>
                                        {!role.isSystem && (
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="p-1.5 text-red-400 hover:bg-red-900/40 rounded transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Role Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={editingRole?.isSystem}
                                    className="form-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-textarea"
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">Permissions</label>
                                <div className="border border-gray-800 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-800 border-b border-gray-700">
                                            <tr>
                                                <th className="p-3 text-left font-medium text-gray-400">Resource</th>
                                                {actions.map(action => (
                                                    <th key={action} className="p-3 text-center font-medium text-gray-400 capitalize">{action}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {resources.map(resource => (
                                                <tr key={resource} className="hover:bg-gray-800/50 transition-colors">
                                                    <td className="p-3 font-medium text-gray-300 capitalize">{resource}</td>
                                                    {actions.map(action => (
                                                        <td key={action} className="p-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions[resource]?.includes(action) || false}
                                                                onChange={() => handlePermissionChange(resource, action)}
                                                                className="w-4 h-4 text-blue-500 rounded border-gray-600 focus:ring-blue-500 bg-gray-700"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Save Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserRoles;
