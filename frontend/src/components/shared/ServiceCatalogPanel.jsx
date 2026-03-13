import React, { useState, useEffect } from 'react';
import { Search, X, Activity, DollarSign, Beaker, Pill, Stethoscope, BriefcaseMedical } from 'lucide-react';
import { setupAPI } from '../../../services/apiService';

const ServiceCatalogPanel = ({ isOpen, onClose, department }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (isOpen) {
            fetchServices();
        }
    }, [isOpen, department]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            // We pass the category to the API if a specific department is provided
            // e.g., 'laboratory' or 'radiology'
            const params = { isActive: true };
            if (department) {
                params.category = department.toLowerCase();
            }
            const response = await setupAPI.services.getAll(params);
            setServices(response.data);
        } catch (error) {
            console.error('Failed to fetch service catalog:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter services based on search query and active tab (High Cost vs Low Cost)
    const filteredServices = services.filter(service => {
        const matchesSearch = service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              service.serviceCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || 
                           (activeTab === 'high' && service.tariffType === 'High Cost') ||
                           (activeTab === 'low' && service.tariffType === 'Low Cost');
        return matchesSearch && matchesTab;
    });

    // Group services by their sub-department or category for cleaner display
    const groupedServices = filteredServices.reduce((acc, curr) => {
        const group = curr.department || 'General';
        if (!acc[group]) acc[group] = [];
        acc[group].push(curr);
        return acc;
    }, {});

    const getIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'laboratory': return <Beaker className="w-5 h-5 text-purple-400" />;
            case 'radiology': return <Activity className="w-5 h-5 text-blue-400" />;
            case 'pharmacy': return <Pill className="w-5 h-5 text-green-400" />;
            case 'opd': return <Stethoscope className="w-5 h-5 text-yellow-400" />;
            default: return <BriefcaseMedical className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl h-full bg-bg-primary border-l border-border-color shadow-2xl flex flex-col animate-slide-in-right">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-color bg-bg-secondary/50">
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                            {department ? getIcon(department) : <BriefcaseMedical className="w-5 h-5 text-primary" />}
                            <span className="capitalize">{department || 'Global'} Service Catalog</span>
                        </h2>
                        <p className="text-xs text-white/50 mt-1 uppercase tracking-widest font-bold">Standard Pricing & Tariffs</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="p-6 border-b border-border-color bg-bg-primary space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search tests, scans, or services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-secondary border border-border-color text-text-primary text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block pl-9 p-2.5 transition-all outline-none"
                        />
                    </div>
                    
                    <div className="flex bg-bg-secondary p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'all' ? 'bg-primary text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab('high')}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'high' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                        >
                            High Cost
                        </button>
                        <button
                            onClick={() => setActiveTab('low')}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'low' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                        >
                            Low Cost
                        </button>
                    </div>
                </div>

                {/* Service List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-40 space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="text-xs text-white/50 font-bold tracking-widest uppercase">Loading Catalog...</span>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12">
                            <BriefcaseMedical className="w-12 h-12 text-white/10 mx-auto mb-3" />
                            <p className="text-sm text-white/50">No services found in this catalog.</p>
                        </div>
                    ) : (
                        Object.entries(groupedServices).map(([group, svcs]) => (
                            <div key={group} className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <span className="h-px bg-primary/20 flex-1"></span>
                                    {group}
                                    <span className="h-px bg-primary/20 flex-1"></span>
                                </h3>
                                <div className="space-y-2">
                                    {svcs.map(service => (
                                        <div key={service.id} className="group flex items-center justify-between p-3 rounded-lg border border-border-color bg-bg-secondary hover:border-primary/50 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-text-primary text-sm">{service.serviceName}</span>
                                                    {service.tariffType === 'High Cost' ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-900/30 text-purple-300 border border-purple-700/50">High Cost</span>
                                                    ) : service.tariffType === 'Low Cost' ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-900/30 text-blue-300 border border-blue-700/50">Low Cost</span>
                                                    ) : null}
                                                </div>
                                                <div className="text-[11px] text-white/40 font-mono mt-1">{service.serviceCode}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-white">K {Number(service.price).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default ServiceCatalogPanel; 
