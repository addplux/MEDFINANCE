import React, { useState, useEffect } from 'react';
import { setupAPI } from '../../services/apiService';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServicesList = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await setupAPI.services.getAll();
            setServices(response.data);
        } catch (error) {
            console.error('Failed to load services:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Medical Tariffs & Services</h1>
                    <p className="text-text-secondary">Manage service pricelist and codes</p>
                </div>
                <button
                    onClick={() => navigate('/app/setup/services/new')}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Service
                </button>
            </div>

            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        className="form-input pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-bg-tertiary">
                        <tr>
                            <th className="text-left p-4 font-medium">Code</th>
                            <th className="text-left p-4 font-medium">Service Name</th>
                            <th className="text-left p-4 font-medium">Category</th>
                            <th className="text-right p-4 font-medium">Standard Price</th>
                            <th className="text-right p-4 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {filteredServices.map(service => (
                            <tr key={service.id} className="hover:bg-bg-tertiary/50">
                                <td className="p-4 font-medium text-primary-600">{service.code}</td>
                                <td className="p-4">{service.name}</td>
                                <td className="p-4 text-text-secondary">{service.category}</td>
                                <td className="p-4 text-right">K{parseFloat(service.basePrice).toFixed(2)}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => navigate(`/app/setup/services/${service.id}/edit`)}
                                        className="btn btn-sm btn-ghost text-primary-600"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ServicesList;
