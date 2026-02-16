import React, { useState, useEffect } from 'react';
import { setupAPI } from '../../services/apiService';
import { Save, Building } from 'lucide-react';

const OrganizationProfile = () => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'Private Hospital',
        address: '',
        phone: '',
        email: '',
        website: '',
        taxId: '',
        currency: 'ZMW'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await setupAPI.organization.get();
            if (response.data) {
                setFormData({
                    name: response.data.name || '',
                    type: response.data.type || 'Private Hospital',
                    address: response.data.address || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
                    website: response.data.website || '',
                    taxId: response.data.taxId || '',
                    currency: response.data.currency || 'ZMW'
                });
            }
        } catch (error) {
            console.error('Failed to load organization profile:', error);
            setMessage({ type: 'error', text: 'Failed to load organization details' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            await setupAPI.organization.update(formData);
            window.dispatchEvent(new Event('org-profile-updated'));
            setMessage({ type: 'success', text: 'Organization profile updated successfully' });
        } catch (error) {
            console.error('Failed to update profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            {message && (
                <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="card">
                <div className="border-b border-gray-200 p-6 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Hospital / Organization Profile
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="form-label">Organization Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                required
                                placeholder="e.g. City General Hospital"
                            />
                        </div>

                        {/* Type */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="form-label">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="Private Hospital">Private Hospital</option>
                                <option value="Mission / NGO">Mission / NGO</option>
                                <option value="Government">Government</option>
                                <option value="Clinic">Clinic</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Address */}
                        <div className="col-span-2">
                            <label className="form-label">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="form-input"
                                rows="3"
                                placeholder="Physical Address"
                            ></textarea>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="form-label">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="+260..."
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="admin@hospital.com"
                            />
                        </div>

                        {/* Website */}
                        <div>
                            <label className="form-label">Website</label>
                            <input
                                type="text"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="www.hospital.com"
                            />
                        </div>

                        {/* Tax ID */}
                        <div>
                            <label className="form-label">TPIN / Tax ID</label>
                            <input
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Tax Identification Number"
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="form-label">Base Currency</label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="ZMW">ZMW (Zambian Kwacha)</option>
                                <option value="USD">USD (US Dollar)</option>
                                <option value="GBP">GBP (British Pound)</option>
                                <option value="EUR">EUR (Euro)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary min-w-[150px]"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrganizationProfile;
