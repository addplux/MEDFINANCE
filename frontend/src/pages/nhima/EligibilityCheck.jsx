import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const EligibilityCheck = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('nhima');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setResult({
                eligible: true,
                memberNumber: searchTerm,
                memberName: 'John Doe',
                scheme: 'NHIMA Standard',
                validUntil: '2026-12-31',
                dependents: 3
            });
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">NHIMA Eligibility Check</h1>
                <p className="text-gray-600 mt-1">Verify patient NHIMA coverage and eligibility</p>
            </div>

            {/* Search Form */}
            <div className="card p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="label">Search By</label>
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="form-select"
                            >
                                <option value="nhima">NHIMA Number</option>
                                <option value="nrc">NRC Number</option>
                                <option value="name">Patient Name</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Search Term</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input pl-11"
                                    placeholder="Enter NHIMA number, NRC, or name..."
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? 'Checking...' : 'Check Eligibility'}
                    </button>
                </form>
            </div>

            {/* Results */}
            {result && (
                <div className="card p-6">
                    <div className="flex items-start gap-4">
                        {result.eligible ? (
                            <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                {result.eligible ? 'Eligible for NHIMA Coverage' : 'Not Eligible'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Member Number</p>
                                    <p className="font-medium">{result.memberNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Member Name</p>
                                    <p className="font-medium">{result.memberName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Scheme</p>
                                    <p className="font-medium">{result.scheme}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Valid Until</p>
                                    <p className="font-medium">{result.validUntil}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Dependents</p>
                                    <p className="font-medium">{result.dependents}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EligibilityCheck;
