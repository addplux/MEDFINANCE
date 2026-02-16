import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupAPI } from '../../services/apiService';
import { Settings, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import OrganizationProfile from './OrganizationProfile';

const Setup = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('services');
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'profile', label: 'Organization Profile' },
        { id: 'services', label: 'Services & Tariffs' },
        { id: 'users', label: 'Users' },
        { id: 'departments', label: 'Departments' }
    ];

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            switch (activeTab) {
                case 'services':
                    const servicesRes = await setupAPI.services.getAll();
                    setServices(servicesRes.data);
                    break;
                case 'users':
                    const usersRes = await setupAPI.users.getAll();
                    setUsers(usersRes.data);
                    break;
                case 'departments':
                    const deptsRes = await setupAPI.departments.getAll();
                    setDepartments(deptsRes.data);
                    break;
                case 'profile':
                    // Profile data handles its own loading
                    setLoading(false);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;

        try {
            switch (activeTab) {
                case 'services':
                    await setupAPI.services.delete(id);
                    break;
                case 'users':
                    await setupAPI.users.delete(id);
                    break;
                case 'departments':
                    await setupAPI.departments.delete(id);
                    break;
                default:
                    break;
            }
            loadData();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Setup</h1>
                    <p className="text-gray-600 mt-1">Configure system settings and master data</p>
                </div>
                {activeTab !== 'profile' && (
                    <button
                        onClick={() => navigate(`/app/setup/${activeTab}/new`)}
                        className="btn btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        New {activeTab === 'services' ? 'Service' : activeTab === 'users' ? 'User' : 'Department'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="card">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                {activeTab !== 'profile' && (
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input pl-11"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                {activeTab === 'profile' && <OrganizationProfile />}

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <>
                        <div className="hidden md:block">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Service Code</th>
                                        <th>Service Name</th>
                                        <th>Category</th>
                                        <th>Tariff Type</th>
                                        <th>Department</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.filter(s =>
                                        s.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        s.serviceCode?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((service) => (
                                        <tr key={service.id}>
                                            <td className="font-medium">{service.serviceCode}</td>
                                            <td>{service.serviceName}</td>
                                            <td className="capitalize">{service.category}</td>
                                            <td>{service.tariffType}</td>
                                            <td>{service.department}</td>
                                            <td className="font-semibold">K {service.price?.toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                    {service.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/app/setup/services/${service.id}/edit`)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(service.id)}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Services Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {services.filter(s =>
                                s.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.serviceCode?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((service) => (
                                <div key={service.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-gray-900">{service.serviceName}</div>
                                            <div className="text-sm text-gray-500">{service.serviceCode}</div>
                                        </div>
                                        <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {service.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div><span className="text-gray-500">Category:</span> <span className="capitalize">{service.category}</span></div>
                                        <div><span className="text-gray-500">Tariff:</span> <span>{service.tariffType}</span></div>
                                        <div><span className="text-gray-500">Price:</span> <span className="font-semibold">K {service.price?.toLocaleString()}</span></div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/app/setup/services/${service.id}/edit`)}
                                            className="btn btn-sm btn-secondary flex-1 justify-center"
                                        >
                                            <Edit className="w-4 h-4 mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="btn btn-sm btn-danger flex-1 justify-center"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <>
                        <div className="hidden md:block">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u =>
                                        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((user) => (
                                        <tr key={user.id}>
                                            <td className="font-medium">{user.username}</td>
                                            <td>{user.firstName} {user.lastName}</td>
                                            <td>{user.email}</td>
                                            <td className="capitalize">{user.role?.replace('_', ' ')}</td>
                                            <td>
                                                <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/app/setup/users/${user.id}/edit`)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Users Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {users.filter(u =>
                                u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((user) => (
                                <div key={user.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                            <div className="text-sm text-gray-500">@{user.username}</div>
                                        </div>
                                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div><span className="text-gray-500">Role:</span> <span className="capitalize">{user.role?.replace('_', ' ')}</span></div>
                                        <div><span className="text-gray-500">Email:</span> {user.email}</div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/app/setup/users/${user.id}/edit`)}
                                            className="btn btn-sm btn-secondary flex-1 justify-center"
                                        >
                                            <Edit className="w-4 h-4 mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="btn btn-sm btn-danger flex-1 justify-center"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Departments Tab */}
                {activeTab === 'departments' && (
                    <>
                        <div className="hidden md:block">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Department Code</th>
                                        <th>Department Name</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.filter(d =>
                                        d.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        d.departmentCode?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((dept) => (
                                        <tr key={dept.id}>
                                            <td className="font-medium">{dept.departmentCode}</td>
                                            <td>{dept.departmentName}</td>
                                            <td>{dept.description || '-'}</td>
                                            <td>
                                                <span className={`badge ${dept.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                                    {dept.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/app/setup/departments/${dept.id}/edit`)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept.id)}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Departments Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {departments.filter(d =>
                                d.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                d.departmentCode?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((dept) => (
                                <div key={dept.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-gray-900">{dept.departmentName}</div>
                                            <div className="text-sm text-gray-500">{dept.departmentCode}</div>
                                        </div>
                                        <span className={`badge ${dept.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                            {dept.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{dept.description || 'No description'}</p>
                                    <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/app/setup/departments/${dept.id}/edit`)}
                                            className="btn btn-sm btn-secondary flex-1 justify-center"
                                        >
                                            <Edit className="w-4 h-4 mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dept.id)}
                                            className="btn btn-sm btn-danger flex-1 justify-center"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Setup;
